import React, { Suspense, useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Text,
  PointerLockControls,
  SoftShadows,
  ContactShadows,
  Line
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import SunCalc from 'suncalc';
import { RoomAccessories } from './RoomAccessories';

const ENABLE_POSTPROCESSING = true;

// Foundation height - building sits on top of this
const FOUNDATION_HEIGHT = 0.25;
const FOUNDATION_PADDING = 1.5; // How much foundation extends beyond building

const DEFAULT_SUN_SETTINGS = {
  enabled: true,
  // Position controls (X, Y, Z)
  posX: 8,
  posY: 25,
  posZ: 5,
  // Lighting intensity
  brightness: 1.8,
  shadowStrength: 0.8,
  // Time preset: 'morning', 'noon', 'afternoon', 'evening', 'custom'
  preset: 'noon',
  // Color temperature (2700K warm to 6500K cool)
  colorTemp: 5500,
  // Shadow quality: 'low', 'medium', 'high', 'ultra'
  shadowQuality: 'high'
};

// Time-of-day presets with position, color temp, and brightness
const SUN_PRESETS = {
  morning: { posX: -15, posY: 12, posZ: 10, colorTemp: 3200, brightness: 1.2 },
  noon: { posX: 8, posY: 25, posZ: 5, colorTemp: 5500, brightness: 1.8 },
  afternoon: { posX: 18, posY: 18, posZ: -8, colorTemp: 4500, brightness: 1.5 },
  evening: { posX: 25, posY: 8, posZ: -15, colorTemp: 2700, brightness: 0.8 }
};

// Shadow quality settings
const SHADOW_QUALITY = {
  low: { mapSize: 1024, bias: -0.001 },
  medium: { mapSize: 2048, bias: -0.0005 },
  high: { mapSize: 4096, bias: -0.0001 },
  ultra: { mapSize: 8192, bias: -0.00005 }
};

// Convert color temperature to RGB hex
const colorTempToHex = (kelvin) => {
  const temp = kelvin / 100;
  let r, g, b;
  
  if (temp <= 66) {
    r = 255;
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
  }
  
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  }
  
  const toHex = (c) => Math.round(c).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const clampNumber = (value, min, max) => {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.min(max, Math.max(min, num));
};

const degToRad = (deg) => (deg * Math.PI) / 180;

// Solar visualization + dynamic sunlight with simplified controls
const SunSystem3D = memo(({ target = [0, 0, 0], settings }) => {
  const { scene } = useThree();
  const lightRef = useRef();

  const {
    enabled,
    posX,
    posY,
    posZ,
    brightness,
    shadowStrength,
    colorTemp,
    shadowQuality
  } = settings || DEFAULT_SUN_SETTINGS;

  const solar = useMemo(() => {
    if (!enabled) return null;

    // Use direct position controls
    const sunPosition = [posX, posY, posZ];
    
    // Convert color temperature to actual color
    const sunColor = colorTempToHex(colorTemp);
    
    // Get shadow quality settings
    const shadowSettings = SHADOW_QUALITY[shadowQuality] || SHADOW_QUALITY.high;
    
    return {
      sunPosition,
      sunVisible: true,
      sunIntensity: brightness,
      sunColor,
      shadowSettings,
      shadowStrength
    };
  }, [enabled, posX, posY, posZ, brightness, colorTemp, shadowQuality, shadowStrength]);

  useEffect(() => {
    if (!lightRef.current || !scene) return;
    // Ensure the target exists in the scene so updates apply
    if (lightRef.current.target && !lightRef.current.target.parent) {
      scene.add(lightRef.current.target);
    }
    if (lightRef.current.target) {
      lightRef.current.target.position.set(target[0], target[1], target[2]);
      lightRef.current.target.updateMatrixWorld();
    }
  }, [scene, target]);

  if (!solar) return null;

  return (
    <>
      {/* Dynamic sunlight with customizable position */}
      <directionalLight
        ref={lightRef}
        position={solar.sunPosition}
        intensity={solar.sunIntensity}
        color={solar.sunColor}
        castShadow
        shadow-mapSize-width={solar.shadowSettings.mapSize}
        shadow-mapSize-height={solar.shadowSettings.mapSize}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={solar.shadowSettings.bias}
        shadow-normalBias={0.02}
      />

      {/* Sun visual - brightness based on settings */}
      {solar.sunVisible && (
        <mesh position={solar.sunPosition}>
          <sphereGeometry args={[2.2, 32, 32]} />
          <meshStandardMaterial
            color={solar.sunColor}
            emissive={solar.sunColor}
            emissiveIntensity={solar.sunIntensity}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Ambient light adjusted by shadow strength (inverse relationship) */}
      <ambientLight intensity={0.5 - (solar.shadowStrength * 0.3)} color="#E6F3FF" />
      
      {/* Sky hemisphere light for realistic outdoor lighting */}
      <hemisphereLight 
        skyColor="#87CEEB" 
        groundColor="#8B7355" 
        intensity={0.5} 
      />

      {/* Sun rays effect */}
      <group position={solar.sunPosition}>
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (i / 6) * Math.PI * 2;
          const length = 3;
          const x = Math.cos(angle) * 0.1;
          const z = Math.sin(angle) * 0.1;
          return (
            <Line
              key={i}
              points={[
                [x, 0, z],
                [x, -length, z]
              ]}
              color={solar.sunColor}
              lineWidth={1}
              transparent
              opacity={0.5}
            />
          );
        })}
      </group>
    </>
  );
});

// Enhanced Door Component with bi-directional visibility and proper wall penetration
const Door3D = memo(({ position, rotation = [0, 0, 0], width = 1.2, height = 2.4, isOpen = false, onToggle, playerPosition, autoOpen = true, wallThickness = 0.2, customColor }) => {
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);
  const doorRef = useRef();
  const frameRef = useRef();
  const [proximityOpen, setProximityOpen] = useState(false);
  const [openAngle, setOpenAngle] = useState(0);
  
  // Enhanced auto-open settings for better user experience
  const openDistance = 2.5; // Wider proximity for easier walkthrough
  const closeDistance = 4.0; // Larger close distance to prevent flickering
  
  // Use custom color or default brown
  const doorColor = customColor || '#8B4513';
  
  // Memoized materials to prevent unnecessary re-creation and improve performance
  const materials = useMemo(() => ({
    frame: { color: doorColor, roughness: 0.6 },
    panel: { color: doorColor, roughness: 0.8, metalness: 0.1 },
    handle: { color: "#FFD700", roughness: 0.3, metalness: 0.8 },
    threshold: { color: doorColor, roughness: 0.8 },
    shadow: { color: "#654321", roughness: 0.95, transparent: true, opacity: 0.8 },
    indicator: { color: "#00FF7F", transparent: true, opacity: 0.6 }
  }), [doorColor]);
  
  // Smooth door animation with useFrame
  useFrame((state, delta) => {
    if (autoOpen && playerPosition && position) {
      // Use horizontal-only distance (ignore Y) so player height doesn't affect detection
      const dx = position[0] - playerPosition[0];
      const dz = position[2] - playerPosition[2];
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance <= openDistance && !proximityOpen) {
        setProximityOpen(true);
        setLocalIsOpen(true);
        if (onToggle) onToggle(true);
      } else if (distance > closeDistance && proximityOpen) {
        setProximityOpen(false);
        setLocalIsOpen(false);
        if (onToggle) onToggle(false);
      }
    }
    
    // Smooth door opening animation
    const targetAngle = localIsOpen ? Math.PI * 0.45 : 0; // ~81 degrees when open for wider passage
    const newAngle = THREE.MathUtils.lerp(openAngle, targetAngle, delta * 6);
    setOpenAngle(newAngle);
    
    if (doorRef.current) {
      doorRef.current.rotation.y = newAngle;
      doorRef.current.position.x = localIsOpen ? Math.sin(newAngle) * width * 0.4 : 0;
    }
  });
  
  // Update when external isOpen changes
  useEffect(() => {
    if (!proximityOpen) {
      setLocalIsOpen(isOpen);
    }
  }, [isOpen, proximityOpen]);
  
  const handleClick = (event) => {
    event.stopPropagation();
    if (!proximityOpen) { // Only allow manual toggle if not auto-opened
      const newState = !localIsOpen;
      setLocalIsOpen(newState);
      if (onToggle) onToggle(newState);
    }
  };
  
  // Enhanced dimensions for better wall penetration
  const doorThickness = Math.max(wallThickness * 1.2, 0.15); // Scale with wall thickness
  const frameThickness = doorThickness + 0.03; // Slightly thicker than door
  const frameWidth = 0.12;
  
  return (
    <group position={position} rotation={rotation}>
      {/* Enhanced Door Frame with better wall penetration */}
      <group ref={frameRef}>
        {/* Frame - Left Post */}
        <mesh position={[-width/2 - frameWidth/2, height/2, 0]} castShadow receiveShadow>
          <boxGeometry args={[frameWidth, height + frameWidth, frameThickness]} />
          <meshStandardMaterial {...materials.frame} />
        </mesh>
        
        {/* Frame - Right Post */}
        <mesh position={[width/2 + frameWidth/2, height/2, 0]} castShadow receiveShadow>
          <boxGeometry args={[frameWidth, height + frameWidth, frameThickness]} />
          <meshStandardMaterial {...materials.frame} />
        </mesh>
        
        {/* Frame - Top */}
        <mesh position={[0, height + frameWidth/2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + frameWidth*2, frameWidth, frameThickness]} />
          <meshStandardMaterial {...materials.frame} />
        </mesh>
        
        {/* Enhanced threshold for better visual connection */}
        <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + frameWidth*2, 0.06, frameThickness + 0.02]} />
          <meshStandardMaterial {...materials.threshold} />
        </mesh>
      </group>
      
      {/* Enhanced Door Panel with smooth animation */}
      <group 
        ref={doorRef}
        position={[0, 0, 0]}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Main Door Panel with wood texture */}
        <mesh position={[0, height/2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, doorThickness]} />
          <meshStandardMaterial {...materials.panel} />
        </mesh>
        
        {/* Decorative door panels */}
        <mesh position={[0, height*0.75, doorThickness/2 + 0.02]} castShadow>
          <boxGeometry args={[width*0.85, height*0.18, 0.03]} />
          <meshStandardMaterial {...materials.threshold} />
        </mesh>
        
        <mesh position={[0, height*0.25, doorThickness/2 + 0.02]} castShadow>
          <boxGeometry args={[width*0.85, height*0.18, 0.03]} />
          <meshStandardMaterial {...materials.threshold} />
        </mesh>
        
        {/* Enhanced door handle system */}
        <mesh position={[width*0.42, height*0.5, doorThickness/2 + 0.04]} castShadow>
          <boxGeometry args={[0.12, 0.04, 0.02]} />
          <meshStandardMaterial {...materials.handle} />
        </mesh>
        
        {/* Door knobs on both sides for bi-directional access */}
        <mesh position={[width*0.42, height*0.5, doorThickness/2 + 0.07]} castShadow>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial {...materials.handle} />
        </mesh>
        
        <mesh position={[width*0.42, height*0.5, -doorThickness/2 - 0.07]} castShadow>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial {...materials.handle} />
        </mesh>
        
        {/* Realistic hinges */}
        {[0.8, 0.2].map((yPos, idx) => (
          <mesh key={idx} position={[-width/2 + 0.02, height*yPos, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, doorThickness + 0.04]} />
            <meshStandardMaterial color="#2F2F2F" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
      </group>
      
      {/* Enhanced door mat */}
      <mesh position={[0, 0.008, doorThickness/2 + 0.4]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 0.5, 1.0]} />
        <meshStandardMaterial {...materials.shadow} />
      </mesh>
      
      {/* Proximity indicator with better design */}
      {proximityOpen && autoOpen && (
        <mesh position={[0, height + 0.3, 0]}>
          <ringGeometry args={[0.1, 0.15]} />
          <meshBasicMaterial {...materials.indicator} />
        </mesh>
      )}
    </group>
  );
});

// Window Component with FIXED positioning - no longer floating above walls
// Enhanced Window3D component with anti-flickering and proper sizing
const Window3D = memo(({ position, rotation = [0, 0, 0], width = 1.2, height = 1.0, roomType = 'default', customColors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openAngle, setOpenAngle] = useState(0);
  const leftPaneRef = useRef();
  const rightPaneRef = useRef();
  
  const frameThickness = 0.08;
  const glassThickness = 0.01;
  const frameDepth = 0.06;
  
  const windowBottomHeight = 0.9;
  const windowCenterY = windowBottomHeight + height / 2;
  
  // Smooth window opening animation
  useFrame((state, delta) => {
    const targetAngle = isOpen ? Math.PI * 0.35 : 0; // 63 degrees when open
    const newAngle = THREE.MathUtils.lerp(openAngle, targetAngle, delta * 6);
    setOpenAngle(newAngle);
    
    if (leftPaneRef.current) {
      leftPaneRef.current.rotation.y = -newAngle;
    }
    if (rightPaneRef.current) {
      rightPaneRef.current.rotation.y = newAngle;
    }
  });
  
  const handleClick = (event) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  // Room-type specific styling with stable colors - memoized for performance
  const styling = useMemo(() => {
    // If custom colors are provided, use them
    if (customColors?.windows) {
      return {
        frameColor: customColors.windows,
        glassColor: customColors.windows,
        glassOpacity: 0.3,
        dividerColor: customColors.windows
      };
    }
    
    const getWindowStyling = (roomType) => {
      const type = roomType.toLowerCase();
      
      if (type.includes('living') || type.includes('drawing')) {
        return {
          frameColor: "#87CEEB", // Sky blue frame
          glassColor: "#E0F4FF", // Light blue sky tint
          glassOpacity: 0.3, // More visible glass
          dividerColor: "#5B9BD5" // Darker sky blue
        };
      } else if (type.includes('bedroom')) {
        return {
          frameColor: "#87CEEB", // Sky blue frame
          glassColor: "#E0F4FF", // Light blue sky tint
          glassOpacity: 0.3,
          dividerColor: "#5B9BD5"
        };
      } else if (type.includes('kitchen')) {
        return {
          frameColor: "#87CEEB", // Sky blue frame
          glassColor: "#E0F4FF", // Light blue sky tint
          glassOpacity: 0.3,
          dividerColor: "#5B9BD5"
        };
      } else {
        return {
          frameColor: "#87CEEB", // Sky blue frame
          glassColor: "#E0F4FF", // Light blue sky tint
          glassOpacity: 0.3,
          dividerColor: "#5B9BD5"
        };
      }
    };
    
    return getWindowStyling(roomType);
  }, [roomType, customColors]);
  
  return (
    <group position={position} rotation={rotation}>
      {/* Window Frame - Stable positioning to prevent flickering */}
      <mesh position={[0, windowCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + frameThickness, height + frameThickness, frameDepth]} />
        <meshStandardMaterial 
          color={styling.frameColor}
          roughness={0.7} 
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Left Window Pane (Opens outward to the left) */}
      <group ref={leftPaneRef} position={[-width/4, windowCenterY, 0]}>
        {/* Left Glass - moves with pane, becomes more transparent when open */}
        <mesh position={[0, 0, 0.001]} onClick={handleClick} style={{ cursor: 'pointer' }}>
          <boxGeometry args={[width/2 - 0.04, height - 0.02, glassThickness]} />
          <meshStandardMaterial 
            color={styling.glassColor}
            transparent 
            opacity={isOpen ? styling.glassOpacity * 0.3 : styling.glassOpacity}
            roughness={0.05}
            metalness={0.1}
            envMapIntensity={1.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        
        {/* Left inner glass reflection */}
        <mesh position={[0, 0, -0.001]}>
          <boxGeometry args={[width/2 - 0.04, height - 0.02, glassThickness]} />
          <meshStandardMaterial 
            color={styling.glassColor}
            transparent 
            opacity={isOpen ? styling.glassOpacity * 0.2 : styling.glassOpacity * 0.8}
            roughness={0.05}
            metalness={0.1}
            envMapIntensity={1.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        
        {/* Left frame edge */}
        <mesh position={[-(width/4 - 0.02), 0, 0]} castShadow>
          <boxGeometry args={[0.03, height * 0.9, frameDepth * 0.8]} />
          <meshStandardMaterial 
            color={styling.dividerColor}
            roughness={0.6} 
            metalness={0.0}
          />
        </mesh>
      </group>
      
      {/* Right Window Pane (Opens outward to the right) */}
      <group ref={rightPaneRef} position={[width/4, windowCenterY, 0]}>
        {/* Right Glass - moves with pane, becomes more transparent when open */}
        <mesh position={[0, 0, 0.001]} onClick={handleClick} style={{ cursor: 'pointer' }}>
          <boxGeometry args={[width/2 - 0.04, height - 0.02, glassThickness]} />
          <meshStandardMaterial 
            color={styling.glassColor}
            transparent 
            opacity={isOpen ? styling.glassOpacity * 0.3 : styling.glassOpacity}
            roughness={0.05}
            metalness={0.1}
            envMapIntensity={1.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        
        {/* Right inner glass reflection */}
        <mesh position={[0, 0, -0.001]}>
          <boxGeometry args={[width/2 - 0.04, height - 0.02, glassThickness]} />
          <meshStandardMaterial 
            color={styling.glassColor}
            transparent 
            opacity={isOpen ? styling.glassOpacity * 0.2 : styling.glassOpacity * 0.8}
            roughness={0.05}
            metalness={0.1}
            envMapIntensity={1.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        
        {/* Right frame edge */}
        <mesh position={[(width/4 - 0.02), 0, 0]} castShadow>
          <boxGeometry args={[0.03, height * 0.9, frameDepth * 0.8]} />
          <meshStandardMaterial 
            color={styling.dividerColor}
            roughness={0.6} 
            metalness={0.0}
          />
        </mesh>
      </group>
      
      {/* Center Vertical Divider - Static */}
      <mesh position={[0, windowCenterY, 0]} castShadow>
        <boxGeometry args={[0.03, height * 0.9, frameDepth * 0.8]} />
        <meshStandardMaterial 
          color={styling.dividerColor}
          roughness={0.6} 
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Window Sills */}
      <mesh position={[0, windowBottomHeight - 0.04, frameDepth/2 + 0.02]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.12, 0.08, 0.06]} />
        <meshStandardMaterial 
          color="#A0826D"
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>
      
      <mesh position={[0, windowBottomHeight - 0.04, -frameDepth/2 - 0.02]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.12, 0.08, 0.06]} />
        <meshStandardMaterial 
          color="#A0826D"
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>
      
      {/* Open indicator */}
      {isOpen && (
        <mesh position={[0, windowCenterY + height/2 + 0.2, 0]}>
          <ringGeometry args={[0.08, 0.12]} />
          <meshBasicMaterial color="#4CAF50" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
});

// Enhanced door placement system with precise wall boundary positioning for bi-directional visibility
const generateSmartDoors = (rooms, bounds, detectedDoors = []) => {
  const doors = [];
  const windows = [];
  const doorWidth = 1.2;
  const doorHeight = 2.4;
  const windowWidth = 0.8;
  const windowHeight = 1.2;
  
  // Early return if no rooms to prevent unnecessary processing
  if (!rooms || rooms.length === 0) {
    console.log('ðŸšª No rooms available for door generation');
    return doors;
  }
  
  // Early return if bounds are invalid
  if (!bounds || typeof bounds.minX === 'undefined') {
    console.log('ðŸšª Invalid bounds for door generation');
    return doors;
  }
  
  console.log('ðŸšª Enhanced door generation with detected doors:', detectedDoors.length);
  console.log('ðŸ  Rooms available:', rooms.map(r => ({ id: r.id, name: r.name, type: r.type })));
  console.log('ðŸ“ Bounds:', bounds);
  
  // Process detected doors from the 2D floor plan with enhanced boundary detection
  detectedDoors.forEach((detectedDoor, index) => {
    // Door x,y are now center coordinates (from updated parsing)
    const world = convertToWorld3D(detectedDoor.x, detectedDoor.y, detectedDoor.width, detectedDoor.height, bounds);
    
    // Use center position directly - no need to add width/2 anymore since x,y are center coords
    const doorCenterX = world.x;
    const doorCenterZ = world.z;
    
    // VALIDATION: Skip doors with coordinates clearly outside the building bounds
    // This handles corrupted data from previous coordinate conversion bugs
    // World coordinates should typically be within a reasonable range (worldScale is 25/maxDimension)
    const maxReasonableCoord = 50; // World coordinates should be within ~0-25 range typically
    if (Math.abs(doorCenterX) > maxReasonableCoord || Math.abs(doorCenterZ) > maxReasonableCoord) {
      console.warn(`⚠️ Door ${index} has invalid coordinates (${doorCenterX.toFixed(2)}, ${doorCenterZ.toFixed(2)}) - skipping`);
      return; // Skip this door
    }
    
    // Use door's isHorizontal property if available for better orientation detection
    const doorIsHorizontal = detectedDoor.isHorizontal !== undefined ? detectedDoor.isHorizontal : true;
    
    console.log('Door', index, 'at center:', doorCenterX.toFixed(2), doorCenterZ.toFixed(2), 'isHorizontal:', doorIsHorizontal);
    
    // Find ALL rooms this door connects with enhanced detection
    const connectedRooms = [];
    // Increased tolerance to account for coordinate conversion precision
    const tolerance = 2.0;
    
    rooms.forEach(room => {
      const roomWorld = convertToWorld3D(room.x, room.y, room.width, room.height, bounds);
      
      // Enhanced boundary detection for exact wall positioning
      const onNorthWall = Math.abs(doorCenterZ - roomWorld.z) < tolerance;
      const onSouthWall = Math.abs(doorCenterZ - (roomWorld.z + roomWorld.height)) < tolerance;
      const onEastWall = Math.abs(doorCenterX - (roomWorld.x + roomWorld.width)) < tolerance;
      const onWestWall = Math.abs(doorCenterX - roomWorld.x) < tolerance;
      
      const withinXBounds = doorCenterX >= (roomWorld.x - tolerance) && 
                           doorCenterX <= (roomWorld.x + roomWorld.width + tolerance);
      const withinZBounds = doorCenterZ >= (roomWorld.z - tolerance) && 
                           doorCenterZ <= (roomWorld.z + roomWorld.height + tolerance);
      
      if ((onNorthWall || onSouthWall) && withinXBounds) {
        connectedRooms.push({
          room,
          wall: onNorthWall ? 'north' : 'south',
          wallPosition: doorCenterX - (roomWorld.x + roomWorld.width / 2)
        });
      } else if ((onEastWall || onWestWall) && withinZBounds) {
        connectedRooms.push({
          room,
          wall: onEastWall ? 'east' : 'west',
          wallPosition: doorCenterZ - (roomWorld.z + roomWorld.height / 2)
        });
      }
    });
    
    console.log(`ðŸšª Door ${index} connects ${connectedRooms.length} rooms:`, 
                connectedRooms.map(cr => cr.room.name || cr.room.id));
    
    // Enhanced door positioning for perfect wall boundary alignment
    if (connectedRooms.length >= 1) {
      let globalDoorX = doorCenterX;
      let globalDoorZ = doorCenterZ;
      let doorRotation = [0, 0, 0];
      
      // For doors connecting exactly 2 rooms, position at exact shared boundary
      if (connectedRooms.length === 2) {
        const room1World = convertToWorld3D(connectedRooms[0].room.x, connectedRooms[0].room.y, 
                                          connectedRooms[0].room.width, connectedRooms[0].room.height, bounds);
        const room2World = convertToWorld3D(connectedRooms[1].room.x, connectedRooms[1].room.y, 
                                          connectedRooms[1].room.width, connectedRooms[1].room.height, bounds);
        
        const wallThickness = 0.08; // Must match Room3D wall thickness
        
        // Calculate room centers for proper wall boundary positioning
        const room1CenterX = room1World.x + room1World.width / 2;
        const room1CenterZ = room1World.z + room1World.height / 2;
        
        // Determine wall orientation and set exact boundary position
        // Position door at wall center (matching Room3D wall positions)
        if (connectedRooms[0].wall === 'north' || connectedRooms[0].wall === 'south') {
          // Horizontal wall - door spans in X direction
          if (connectedRooms[0].wall === 'north') {
            // North wall is at room center Z - height/2 + wallThickness/2
            globalDoorZ = room1CenterZ - room1World.height/2 + wallThickness/2;
          } else {
            // South wall is at room center Z + height/2 - wallThickness/2
            globalDoorZ = room1CenterZ + room1World.height/2 - wallThickness/2;
          }
          doorRotation = [0, 0, 0]; // Door faces north/south
        } else {
          // Vertical wall - door spans in Z direction  
          if (connectedRooms[0].wall === 'east') {
            // East wall is at room center X + width/2 - wallThickness/2
            globalDoorX = room1CenterX + room1World.width/2 - wallThickness/2;
          } else {
            // West wall is at room center X - width/2 + wallThickness/2
            globalDoorX = room1CenterX - room1World.width/2 + wallThickness/2;
          }
          doorRotation = [0, Math.PI/2, 0]; // Door faces east/west
        }
      } else {
        // Single room door (exterior) - position at room boundary wall CENTER
        const roomWorld = convertToWorld3D(connectedRooms[0].room.x, connectedRooms[0].room.y, 
                                         connectedRooms[0].room.width, connectedRooms[0].room.height, bounds);
        
        const wallThickness = 0.08; // Must match Room3D wall thickness
        
        // Room3D positions walls relative to room center:
        // - roomX/roomZ is the center of the room (roomWorld.x + roomWorld.width/2)
        // - Walls are positioned at Â±world.height/2 or Â±world.width/2 from center
        // So exterior doors should be positioned at the room boundary from its center
        const roomCenterX = roomWorld.x + roomWorld.width / 2;
        const roomCenterZ = roomWorld.z + roomWorld.height / 2;
        
        // Position at the room boundary wall (matching Room3D wall positions)
        if (connectedRooms[0].wall === 'north') {
          // North wall is at room center Z - height/2 + wallThickness/2
          globalDoorZ = roomCenterZ - roomWorld.height/2 + wallThickness/2;
          doorRotation = [0, 0, 0];
        } else if (connectedRooms[0].wall === 'south') {
          // South wall is at room center Z + height/2 - wallThickness/2
          globalDoorZ = roomCenterZ + roomWorld.height/2 - wallThickness/2;
          doorRotation = [0, Math.PI, 0];
        } else if (connectedRooms[0].wall === 'east') {
          // East wall is at room center X + width/2 - wallThickness/2
          globalDoorX = roomCenterX + roomWorld.width/2 - wallThickness/2;
          doorRotation = [0, -Math.PI/2, 0];
        } else if (connectedRooms[0].wall === 'west') {
          // West wall is at room center X - width/2 + wallThickness/2
          globalDoorX = roomCenterX - roomWorld.width/2 + wallThickness/2;
          doorRotation = [0, Math.PI/2, 0];
        }
      }
      
      // Create a single door that's visible from all connected rooms
      const doorId = `detected-door-${index}`;
      const connectedRoomIds = connectedRooms.map(cr => cr.room.id);
      
      // Calculate door width from 2D door length - scale appropriately
      // detectedDoor.width is now the line length in 2D pixels
      const doorWorldWidth = Math.max(1.0, Math.min(world.width, 1.6));
      
      // Use detected door orientation if wall detection doesn't override
      const finalRotation = doorRotation[1] !== 0 ? doorRotation : 
                           (doorIsHorizontal ? [0, 0, 0] : [0, Math.PI/2, 0]);
      
      doors.push({
        id: doorId,
        globalPosition: [globalDoorX, 0, globalDoorZ], // Exact wall boundary position
        connectedRooms: connectedRoomIds,
        connectedRoomData: connectedRooms,
        width: doorWorldWidth,
        height: doorHeight,
        type: connectedRooms.length > 1 ? 'interior' : 'exterior',
        isOpen: false,
        rotation: finalRotation, // Store rotation for proper wall alignment
        onToggle: null,
        // Enhanced room positioning for better wall cutouts
        roomPositions: connectedRooms.map(cr => ({
          roomId: cr.room.id,
          wall: cr.wall,
          wallPosition: cr.wallPosition,
          rotation: finalRotation // Use calculated rotation
        }))
      });
      
      console.log(`ðŸšª Created door connecting rooms: ${connectedRoomIds.join(' <-> ')}`);
    } else {
      // Fallback: create as exterior door for the closest room
      const closestRoom = rooms.reduce((closest, room) => {
        const roomWorld = convertToWorld3D(room.x, room.y, room.width, room.height, bounds);
        const roomCenterX = roomWorld.x + roomWorld.width / 2;
        const roomCenterZ = roomWorld.z + roomWorld.height / 2;
        const distance = Math.sqrt(Math.pow(doorCenterX - roomCenterX, 2) + Math.pow(doorCenterZ - roomCenterZ, 2));
        
        return !closest || distance < closest.distance ? { room, distance } : closest;
      }, null);
      
      if (closestRoom) {
        // Calculate door width from 2D door length
        const doorWorldWidth = Math.max(1.0, Math.min(world.width, 1.6));
        const fallbackRotation = doorIsHorizontal ? [0, 0, 0] : [0, Math.PI/2, 0];
        
        doors.push({
          id: `detected-door-${index}`,
          globalPosition: [doorCenterX, 0, doorCenterZ],
          connectedRooms: [closestRoom.room.id],
          width: doorWorldWidth,
          height: doorHeight,
          type: 'exterior',
          isOpen: false,
          rotation: fallbackRotation,
          onToggle: null
        });
      }
    }
  });
  
  // Enhanced door rotation calculation for bi-directional visibility
  function getDoorRotationForWall(wall) {
    switch (wall) {
      case 'north': 
        return [0, 0, 0];        // Door faces north/south - default orientation
      case 'south': 
        return [0, Math.PI, 0];  // Door faces north/south - flipped 180Â°
      case 'east': 
        return [0, -Math.PI/2, 0]; // Door faces east/west - 90Â° CCW
      case 'west': 
        return [0, Math.PI/2, 0];  // Door faces east/west - 90Â° CW
      default: 
        return [0, 0, 0];
    }
  }
  
  // Add main entrance door if no detected doors found
  if (doors.length === 0 && rooms.length > 0) {
    console.log('ðŸšª No doors detected, creating intelligent door placement');
    
    // Create a realistic door placement system based on architectural principles
    const roomConnections = [];
    const doorCount = {}; // Track doors per room
    
    // Initialize door count for each room
    rooms.forEach(room => {
      doorCount[room.id] = 0;
    });
    
    // Define room hierarchy for logical connections
    const roomTypeHierarchy = {
      'living': 1,
      'livingroom': 1,
      'family': 1,
      'main': 2,
      'entrance': 2,
      'hallway': 2,
      'corridor': 2,
      'kitchen': 3,
      'dining': 3,
      'bedroom': 4,
      'bathroom': 5,
      'toilet': 5,
      'storage': 6,
      'closet': 6
    };
    
    // Get room priority for logical door placement
    const getRoomPriority = (room) => {
      const roomName = (room.name || room.type || '').toLowerCase();
      for (const [type, priority] of Object.entries(roomTypeHierarchy)) {
        if (roomName.includes(type)) return priority;
      }
      return 10; // Default priority for unknown types
    };
    
    // Create a more selective door placement system
    const potentialConnections = [];
    
    // Find all potential room connections
    rooms.forEach((room1, i) => {
      rooms.forEach((room2, j) => {
        if (i >= j) return; // Avoid duplicates and self-connections
        
        // Only connect rooms that make architectural sense
        const room1Priority = getRoomPriority(room1);
        const room2Priority = getRoomPriority(room2);
        const priorityDiff = Math.abs(room1Priority - room2Priority);
        
        // Skip connections that don't make sense (e.g., bathroom to kitchen)
        if (priorityDiff > 2) return;
        
        const world1 = convertToWorld3D(room1.x, room1.y, room1.width, room1.height, bounds);
        const world2 = convertToWorld3D(room2.x, room2.y, room2.width, room2.height, bounds);
        
        // Check if rooms are adjacent (share a wall)
        const tolerance = 0.3;
        const wallThickness = 0.08; // Must match Room3D wall thickness
        let doorPosition = null;
        let doorRotation = [0, 0, 0];
        let sharedWallLength = 0;
        
        // Check for horizontal adjacency (rooms side by side)
        if (Math.abs((world1.x + world1.width) - world2.x) < tolerance || 
            Math.abs((world2.x + world2.width) - world1.x) < tolerance) {
          
          // Check if they overlap vertically
          const overlapStart = Math.max(world1.z, world2.z);
          const overlapEnd = Math.min(world1.z + world1.height, world2.z + world2.height);
          
          if (overlapEnd > overlapStart && (overlapEnd - overlapStart) > 1.5) {
            sharedWallLength = overlapEnd - overlapStart;
            // Place door in the middle of the shared wall, inset to wall center
            const doorZ = overlapStart + (overlapEnd - overlapStart) / 2;
            // Door positioned at wall center (between the two rooms)
            const doorX = Math.abs((world1.x + world1.width) - world2.x) < tolerance ? 
                         world2.x + wallThickness/2 : world1.x + wallThickness/2;
            
            doorPosition = [doorX, 0, doorZ];
            doorRotation = [0, Math.PI/2, 0];
          }
        }
        
        // Check for vertical adjacency (rooms above/below each other)
        else if (Math.abs((world1.z + world1.height) - world2.z) < tolerance || 
            Math.abs((world2.z + world2.height) - world1.z) < tolerance) {
          
          // Check if they overlap horizontally
          const overlapStart = Math.max(world1.x, world2.x);
          const overlapEnd = Math.min(world1.x + world1.width, world2.x + world2.width);
          
          if (overlapEnd > overlapStart && (overlapEnd - overlapStart) > 1.5) {
            sharedWallLength = overlapEnd - overlapStart;
            // Place door in the middle of the shared wall, inset to wall center
            const doorX = overlapStart + (overlapEnd - overlapStart) / 2;
            // Door positioned at wall center (between the two rooms)
            const doorZ = Math.abs((world1.z + world1.height) - world2.z) < tolerance ? 
                         world2.z + wallThickness/2 : world1.z + wallThickness/2;
            
            doorPosition = [doorX, 0, doorZ];
            doorRotation = [0, 0, 0];
          }
        }
        
        if (doorPosition && sharedWallLength > 1.5) {
          potentialConnections.push({
            room1,
            room2,
            position: doorPosition,
            rotation: doorRotation,
            priority: Math.min(room1Priority, room2Priority), // Lower number = higher priority
            wallLength: sharedWallLength
          });
        }
      });
    });
    
    // Sort potential connections by priority and wall length
    potentialConnections.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.wallLength - a.wallLength; // Prefer longer shared walls
    });
    
    // Create doors selectively - maximum 2 doors per room, prioritize important connections
    potentialConnections.forEach(connection => {
      const { room1, room2, position, rotation } = connection;
      
      // Check if both rooms can still have more doors (max 2 per room for cleaner design)
      if (doorCount[room1.id] >= 2 || doorCount[room2.id] >= 2) {
        return;
      }
      
      // Create the door
      doors.push({
        id: `auto-door-${room1.id}-${room2.id}`,
        globalPosition: position,
        connectedRooms: [room1.id, room2.id],
        width: 0.8,
        height: 2.1,
        type: 'interior',
        isOpen: false,
        roomPositions: [
          {
            roomId: room1.id,
            wall: 'auto',
            wallPosition: 0,
            rotation: rotation
          },
          {
            roomId: room2.id,
            wall: 'auto',
            wallPosition: 0,
            rotation: rotation
          }
        ]
      });
      
      // Update door counts
      doorCount[room1.id]++;
      doorCount[room2.id]++;
      roomConnections.push([room1.id, room2.id]);
      
      console.log(`ðŸšª Created smart door between ${room1.name || room1.id} and ${room2.name || room2.id}`);
    });
    
    // Add main entrance door to a logical entry room (only if needed)
    const hasEnoughConnections = roomConnections.length >= Math.max(1, rooms.length - 2);
    
    if (!hasEnoughConnections) {
      const entryRoom = rooms.find(room => {
        const name = (room.name || room.type || '').toLowerCase();
        return name.includes('living') || name.includes('entrance') || name.includes('main');
      }) || rooms[0]; // Fallback to first room
      
      if (entryRoom && doorCount[entryRoom.id] < 2) {
        const roomWorld = convertToWorld3D(entryRoom.x, entryRoom.y, entryRoom.width, entryRoom.height, bounds);
        const wallThickness = 0.08; // Must match Room3D wall thickness
        
        // Place entrance door on the front wall (bottom edge), inset to wall center
        doors.push({
          id: `entrance-door-${entryRoom.id}`,
          globalPosition: [roomWorld.x + roomWorld.width / 2, 0, roomWorld.z + roomWorld.height - wallThickness/2],
          connectedRooms: [entryRoom.id],
          width: 0.9,
          height: 2.1,
          type: 'entrance',
          isOpen: false,
          roomPositions: [{
            roomId: entryRoom.id,
            wall: 'south',
            wallPosition: 0,
            rotation: [0, 0, 0]
          }]
        });
        
        console.log(`ðŸšª Created entrance door for ${entryRoom.name || entryRoom.id}`);
      }
    }
  }
  
  console.log(`ðŸšª Generated ${doors.length} doors total`);
  
  // Log door distribution for debugging
  const doorsByRoom = {};
  doors.forEach(door => {
    door.connectedRooms.forEach(roomId => {
      doorsByRoom[roomId] = (doorsByRoom[roomId] || 0) + 1;
    });
  });
  
  console.log(`ðŸšª Door distribution:`, doorsByRoom);
  return doors;
};

// Smart window placement system
const generateSmartWindows = (rooms, bounds, detectedWindows = []) => {
  const windows = [];
  
  // Early return if no rooms to prevent unnecessary processing
  if (!rooms || rooms.length === 0) {
    console.log('ðŸªŸ No rooms available for window generation');
    return windows;
  }
  
  // Early return if bounds are invalid
  if (!bounds || typeof bounds.minX === 'undefined') {
    console.log('ðŸªŸ Invalid bounds for window generation');
    return windows;
  }
  
  console.log('ðŸªŸ Window generation with detected windows:', detectedWindows.length);
  
  // Process detected windows from the 2D floor plan
  if (detectedWindows && detectedWindows.length > 0) {
    const wallThickness = 0.08; // Must match Room3D wall thickness
    
    detectedWindows.forEach((window, idx) => {
      console.log(`ðŸªŸ Processing detected window ${idx}:`, window);
      
      // Convert window position to 3D world coordinates
      const x1 = window.x || 0;
      const y1 = window.y || 0;
      const x2 = x1 + (window.width || 40);
      const y2 = y1 + (window.height || 60);
      
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      const windowWidth = Math.abs(x2 - x1);
      const windowHeight = Math.abs(y2 - y1);
      
      // Convert to world coordinates
      const worldPos = convertToWorld3D(centerX, centerY, 1, 1, bounds);
      
      // Determine window orientation (horizontal or vertical)
      const isHorizontal = windowWidth > windowHeight;
      
      // Find the nearest room wall and adjust position to sit on wall
      let adjustedX = worldPos.x;
      let adjustedZ = worldPos.z;
      
      // Find nearest room to determine wall position
      const tolerance = 0.5;
      rooms.forEach(room => {
        const roomWorld = convertToWorld3D(room.x, room.y, room.width, room.height, bounds);
        
        // Check if window is near room boundaries and snap to wall center
        if (Math.abs(worldPos.z - roomWorld.z) < tolerance) {
          // Near north wall
          adjustedZ = roomWorld.z + wallThickness/2;
        } else if (Math.abs(worldPos.z - (roomWorld.z + roomWorld.height)) < tolerance) {
          // Near south wall
          adjustedZ = roomWorld.z + roomWorld.height - wallThickness/2;
        }
        
        if (Math.abs(worldPos.x - roomWorld.x) < tolerance) {
          // Near west wall
          adjustedX = roomWorld.x + wallThickness/2;
        } else if (Math.abs(worldPos.x - (roomWorld.x + roomWorld.width)) < tolerance) {
          // Near east wall
          adjustedX = roomWorld.x + roomWorld.width - wallThickness/2;
        }
      });
      
      // Use unique ID combining original ID and index to prevent duplicates
      const uniqueId = `detected-window-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      windows.push({
        id: uniqueId,
        position: [adjustedX, 1.2, adjustedZ], // Position at standard window height, adjusted to wall
        rotation: isHorizontal ? [0, 0, 0] : [0, Math.PI/2, 0],
        width: Math.max(0.6, (isHorizontal ? windowWidth : windowHeight) / 100),
        height: 1.2,
        roomType: 'detected',
        isDetected: true
      });
      
      console.log(`ðŸªŸ Added detected window:`, windows[windows.length - 1]);
    });
  }
  
  // DISABLED: Skip automatic window generation - only use user-placed windows from 2D editor
  /*
  rooms.forEach((room) => {
    const world = convertToWorld3D(room.x, room.y, room.width, room.height, bounds);
    const roomCenterX = world.x + world.width / 2;
    const roomCenterZ = world.z + world.height / 2;
    
    // Only add automatic windows if NO user windows detected
    // Otherwise skip to show only user-placed windows
    const roomType = room.type?.toLowerCase() || '';
    
    // Skip automatic windows - only use user-placed ones
    // if (world.width > 2 && world.height > 2) { }
      const wallThickness = 0.08; // Wall thickness for proper embedding
      
      if (roomType.includes('living') || roomType.includes('drawing')) {
        // Living rooms get larger windows - adjusted proportions
        windows.push({
          id: `window-${room.id}-1`,
          position: [roomCenterX - world.width/3, 0, roomCenterZ + world.height/2 - wallThickness/2],
          rotation: [0, 0, 0],
          width: Math.min(1.4, world.width * 0.3), // Proportional to room size
          height: 1.2, // Standard height
          roomType: roomType
        });
        
        windows.push({
          id: `window-${room.id}-2`,
          position: [roomCenterX + world.width/3, 0, roomCenterZ + world.height/2 - wallThickness/2],
          rotation: [0, 0, 0],
          width: Math.min(1.4, world.width * 0.3), // Proportional to room size
          height: 1.2, // Standard height
          roomType: roomType
        });
      } 
      else if (roomType.includes('bedroom')) {
        // Bedrooms get appropriately sized windows
        windows.push({
          id: `window-${room.id}`,
          position: [roomCenterX + world.width/2 - wallThickness/2, 0, roomCenterZ],
          rotation: [0, Math.PI/2, 0],
          width: Math.min(1.2, world.height * 0.4), // Proportional to wall length
          height: 1.0, // Standard residential height
          roomType: roomType
        });
      }
      else if (roomType.includes('kitchen')) {
        // Kitchen gets practical window size
        windows.push({
          id: `window-${room.id}`,
          position: [roomCenterX, 0, roomCenterZ - world.height/2 + wallThickness/2],
          rotation: [0, Math.PI, 0],
          width: Math.min(1.3, world.width * 0.4), // Proportional but practical
          height: 0.8, // Lower height for kitchen
          roomType: roomType
        });
      }
      else if (!roomType.includes('bathroom')) { // Most rooms except bathrooms
        windows.push({
          id: `window-${room.id}`,
          position: [roomCenterX, 0, roomCenterZ + world.height/2 - wallThickness/2],
          rotation: [0, 0, 0],
          width: Math.min(1.2, world.width * 0.35), // Proportional default size
          height: 1.0, // Standard height
          roomType: roomType
        });
      }
    }
  });
  */
  
  console.log('ðŸªŸ Generated windows:', windows);
  return windows;
};
const analyzeFloorPlanData = (data) => {
  console.log('ðŸ” Analyzing floor plan data:', data);
  
  let rooms = [];
  let walls = [];
  let doors = [];
  let windows = [];
  
  // First, check for direct rooms array (from 2D editor) - prioritize this
  if (data && data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
    console.log('ðŸ  Found direct rooms array from 2D editor with', data.rooms.length, 'rooms');
    rooms = data.rooms.map((room, index) => {
      const processedRoom = {
        id: room.id || `room-${index}`,
        x: parseFloat(room.x || 0),
        y: parseFloat(room.y || 0),
        width: parseFloat(room.width || 100),
        height: parseFloat(room.height || 100),
        type: room.type || room.tag || room.roomType || 'room',
        name: room.name || room.type || room.tag || 'Room',
        source: room.source || 'unknown'
      };
      console.log(`  Processing room ${index}:`, room, 'â†’', processedRoom);
      return processedRoom;
    });
  }
  
  // Then check if data has mapData array (genetic algorithm output)
  if (data && data.mapData && Array.isArray(data.mapData)) {
    console.log('ðŸ“Š Found mapData with', data.mapData.length, 'items');
    
    // Separate different types of elements (only if no direct rooms array found)
    data.mapData.forEach((item, index) => {
      if (!item) return;
      
      console.log(`MapData item ${index}:`, item);
      
      // Extract room data with flexible field mapping (only add if not already from direct array)
      if (item.type === 'room' && (item.x !== undefined || item.position) && rooms.length === 0) {
        const x = item.x || item.position?.x || 0;
        const y = item.y || item.position?.y || 0;
        const width = item.width || item.size?.width || item.dimensions?.width || 100;
        const height = item.height || item.size?.height || item.dimensions?.height || 100;
        
        rooms.push({
          id: item.id || `mapdata-room-${index}`,
          x: parseFloat(x),
          y: parseFloat(y),
          width: parseFloat(width),
          height: parseFloat(height),
          type: item.roomType || item.tag || item.name || 'room',
          name: item.name || item.roomType || item.tag || 'Room',
          fitness: item.fitness || 0,
          source: 'mapdata'
        });
        console.log(`  Added mapData room:`, rooms[rooms.length - 1]);
      } 
      // Extract wall data
      else if ((item.type === 'wall' || item.type === 'Wall') && item.x1 !== undefined) {
        const wallData = {
          id: item.id || `wall-${walls.length}`, // Preserve wall ID for filtering
          x1: parseFloat(item.x1 || 0),
          y1: parseFloat(item.y1 || 0),
          x2: parseFloat(item.x2 || 100),
          y2: parseFloat(item.y2 || 100)
        };
        walls.push(wallData);
        console.log('ðŸ§± Found wall:', wallData);
      } 
      // Extract door data - Enhanced to detect doors in multiple formats
      else if (item.type === 'door' || item.type === 'Door' || item.type === 'Wall') {
        // Check if this is a door (Wall type from backend but might be door)
        if (item.type === 'Wall') {
          // Skip walls, handle them separately
        } else if (item.x1 !== undefined && item.y1 !== undefined && item.x2 !== undefined && item.y2 !== undefined) {
          // Line format from mapData (x1, y1, x2, y2) - use center coordinates for consistency
          const x1 = parseFloat(item.x1);
          const y1 = parseFloat(item.y1);
          const x2 = parseFloat(item.x2);
          const y2 = parseFloat(item.y2);
          
          // VALIDATION: Skip doors with coordinates clearly outside reasonable bounds
          // Plot dimensions are typically 0-2000 range, anything beyond 3000 is corrupted data
          const maxReasonableCoord = 3000;
          if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
              Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
            console.warn(`⚠️ Skipping door with corrupted coordinates: x1=${x1}, y1=${y1}, x2=${x2}, y2=${y2}`);
            return; // Skip this corrupted door
          }
          
          const centerX = (x1 + x2) / 2;
          const centerY = (y1 + y2) / 2;
          const doorLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const isHorizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);
          
          doors.push({
            id: item.id || `door-${doors.length}`,
            x: centerX,
            y: centerY,
            width: Math.max(doorLength, 10),
            height: 10, // Nominal height for line-based doors
            points: [x1, y1, x2, y2], // Preserve original points
            isHorizontal: isHorizontal,
            rotation: parseFloat(item.rotation || 0),
            type: 'door'
          });
          console.log('ðŸšª Found door (line format) at center:', centerX, centerY, 'isHorizontal:', isHorizontal);
        } else if (item.x !== undefined && item.width !== undefined && item.height !== undefined) {
          // Rectangle format - x,y is already center or top-left, keep as-is
          const doorX = parseFloat(item.x || 0);
          const doorY = parseFloat(item.y || 0);
          
          // VALIDATION: Skip doors with corrupted coordinates
          const maxReasonableCoord = 3000;
          if (Math.abs(doorX) > maxReasonableCoord || Math.abs(doorY) > maxReasonableCoord) {
            console.warn(`⚠️ Skipping door with corrupted coordinates: x=${doorX}, y=${doorY}`);
            return; // Skip this corrupted door
          }
          
          doors.push({
            id: item.id || `door-${doors.length}`,
            x: doorX,
            y: doorY,
            width: parseFloat(item.width || 30),
            height: parseFloat(item.height || 80),
            rotation: parseFloat(item.rotation || 0),
            type: 'door'
          });
          console.log('ðŸšª Found door (rect format):', doors[doors.length - 1]);
        }
      }
      // Extract window data
      else if (item.type === 'Window' || item.type === 'window') {
        if (item.x1 !== undefined && item.y1 !== undefined && item.x2 !== undefined && item.y2 !== undefined) {
          // Line format from mapData (x1, y1, x2, y2)
          const x = Math.min(item.x1, item.x2);
          const y = Math.min(item.y1, item.y2);
          const width = Math.abs(item.x2 - item.x1) || 40;
          const height = Math.abs(item.y2 - item.y1) || 60;
          
          windows.push({
            id: item.id || `window-${windows.length}`,
            x: parseFloat(x),
            y: parseFloat(y),
            width: Math.max(parseFloat(width), 10),
            height: Math.max(parseFloat(height), 10),
            rotation: parseFloat(item.rotation || 0),
            type: 'window'
          });
          console.log('ðŸªŸ Found window:', windows[windows.length - 1]);
        } else if (item.x !== undefined && item.width !== undefined && item.height !== undefined) {
          // Rectangle format
          windows.push({
            id: item.id || `window-${windows.length}`,
            x: parseFloat(item.x || 0),
            y: parseFloat(item.y || 0),
            width: parseFloat(item.width || 40),
            height: parseFloat(item.height || 60),
            rotation: parseFloat(item.rotation || 0),
            type: 'window'
          });
          console.log('ðŸªŸ Found window (rect format):', windows[windows.length - 1]);
        }
      }
      // Handle rooms without explicit type (legacy format) - only if no direct rooms
      else if (!item.type && item.x !== undefined && item.width !== undefined && rooms.length === 0) {
        // Check if this is a door based on size (small rectangles are doors)
        const width = parseFloat(item.width);
        const height = parseFloat(item.height || 100);
        
        if (width < 100 && height < 100) {
          // This is likely a door (small brown rectangle)
          doors.push({
            id: `door-${doors.length}`,
            x: parseFloat(item.x),
            y: parseFloat(item.y || 0),
            width: width,
            height: height,
            rotation: parseFloat(item.rotation || 0),
            type: 'door'
          });
        } else {
          // This is a room
          const newRoom = {
            id: item.id || `legacy-room-${index}`,
            x: parseFloat(item.x),
            y: parseFloat(item.y || 0),
            width: width,
            height: height,
            type: item.roomType || item.tag || item.name || 'room',
            name: item.name || item.roomType || item.tag || 'Room',
            fitness: item.fitness || 0,
            source: 'legacy'
          };
          rooms.push(newRoom);
          console.log(`  Added legacy room:`, newRoom);
        }
      }
    });
  }
  
  // Check for doors array (from 2D editor)
  if (data && data.doors && Array.isArray(data.doors)) {
    console.log('🚪 Using direct doors array with', data.doors.length, 'doors');
    const maxReasonableCoord = 3000; // Coordinates beyond this are corrupted
    
    doors = data.doors.map((door, index) => {
      // Handle both line format (x1,y1,x2,y2) and rect format (x,y,width,height)
      if (door.x1 !== undefined && door.y1 !== undefined) {
        // Line format - convert to rect format
        const x1 = parseFloat(door.x1);
        const y1 = parseFloat(door.y1);
        const x2 = parseFloat(door.x2);
        const y2 = parseFloat(door.y2);
        
        // VALIDATION: Skip doors with corrupted coordinates
        if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
            Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
          console.warn(`⚠️ Skipping door ${index} with corrupted coordinates`);
          return null; // Will be filtered out
        }
        
        // Calculate door length as the primary dimension
        const doorLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const isHorizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);
        
        // Use center point of door line
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        
        return {
          id: door.id || `door-${index}`,
          x: centerX,
          y: centerY,
          width: doorLength || 30,
          height: 10, // Nominal height for line-based doors
          points: [x1, y1, x2, y2], // Preserve original points
          isHorizontal: isHorizontal,
          rotation: isHorizontal ? 0 : Math.PI / 2,
          type: 'door'
        };
      } else if (door.points && Array.isArray(door.points) && door.points.length >= 4) {
        // Points array format [x1, y1, x2, y2]
        const x1 = parseFloat(door.points[0]);
        const y1 = parseFloat(door.points[1]);
        const x2 = parseFloat(door.points[2]);
        const y2 = parseFloat(door.points[3]);
        
        // VALIDATION: Skip doors with corrupted coordinates
        if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
            Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
          console.warn(`⚠️ Skipping door ${index} with corrupted coordinates`);
          return null; // Will be filtered out
        }
        
        // Calculate door length as the primary dimension
        const doorLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const isHorizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);
        
        // Use center point of door line
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        
        return {
          id: door.id || `door-${index}`,
          x: centerX,
          y: centerY,
          width: doorLength || 30,
          height: 10, // Nominal height for line-based doors
          points: [x1, y1, x2, y2], // Preserve original points
          isHorizontal: isHorizontal,
          rotation: isHorizontal ? 0 : Math.PI / 2,
          type: 'door'
        };
      } else {
        // Standard rect format
        const doorX = parseFloat(door.x || 0);
        const doorY = parseFloat(door.y || 0);
        
        // VALIDATION: Skip doors with corrupted coordinates
        if (Math.abs(doorX) > maxReasonableCoord || Math.abs(doorY) > maxReasonableCoord) {
          console.warn(`⚠️ Skipping door ${index} with corrupted coordinates`);
          return null; // Will be filtered out
        }
        
        return {
          id: door.id || `door-${index}`,
          x: doorX,
          y: doorY,
          width: parseFloat(door.width || 30),
          height: parseFloat(door.height || 80),
          rotation: parseFloat(door.rotation || 0),
          type: 'door'
        };
      }
    }).filter(Boolean); // Remove null entries from corrupted doors
  }
  
  // Check for walls array (from 2D editor)
  if (data && data.walls && Array.isArray(data.walls)) {
    console.log('ðŸ§± Using direct walls array with', data.walls.length, 'walls:', data.walls);
    walls = data.walls.map((wall, idx) => {
      if (wall.points && Array.isArray(wall.points) && wall.points.length >= 4) {
        const wallData = {
          id: wall.id || `wall-${idx}`, // Preserve wall ID for filtering
          x1: parseFloat(wall.points[0]),
          y1: parseFloat(wall.points[1]),
          x2: parseFloat(wall.points[2]),
          y2: parseFloat(wall.points[3])
        };
        console.log(`  Wall ${idx}:`, wall.points, 'â†’', wallData);
        return wallData;
      }
      return {
        id: wall.id || `wall-${idx}`, // Preserve wall ID for filtering
        x1: parseFloat(wall.x1 || 0),
        y1: parseFloat(wall.y1 || 0),
        x2: parseFloat(wall.x2 || 0),
        y2: parseFloat(wall.y2 || 0)
      };
    });
  }
  
  // Fallback 1: check for direct rooms array (from 2D editor)
  if (rooms.length === 0 && data && data.rooms && Array.isArray(data.rooms)) {
    console.log('ðŸ“‹ Using direct rooms array from 2D editor with', data.rooms.length, 'rooms');
    console.log('ðŸ“‹ Raw rooms data:', data.rooms);
    rooms = data.rooms.map((room, index) => {
      const processedRoom = {
        id: room.id || `room-${index}`,
        x: parseFloat(room.x || 0),
        y: parseFloat(room.y || 0),
        width: parseFloat(room.width || 100),
        height: parseFloat(room.height || 100),
        type: room.type || room.tag || room.roomType || 'room',
        name: room.name || room.type || room.tag || 'Room',
        source: room.source || 'unknown' // Track room source
      };
      console.log(`  Room ${index}:`, room, 'â†’', processedRoom);
      return processedRoom;
    });
  }
  
  // Fallback 2: check if data is directly a rooms array
  if (rooms.length === 0 && Array.isArray(data)) {
    console.log('ðŸ“‹ Data is directly a rooms array');
    rooms = data.map((room, index) => ({
      id: room.id || `room-${index}`,
      x: parseFloat(room.x || 0),
      y: parseFloat(room.y || 0),
      width: parseFloat(room.width || 100),
      height: parseFloat(room.height || 100),
      type: room.type || room.tag || room.roomType || 'room',
      name: room.name || room.type || room.tag || 'Room'
    }));
  }
  
  // Create demo data if no rooms found
  if (rooms.length === 0) {
    console.log('âš ï¸ No room data found, creating demo rooms');
    rooms = [
      {
        id: 'demo-living',
        x: 0, y: 0,
        width: 400, height: 300,
        type: 'livingroom',
        name: 'Living Room'
      },
      {
        id: 'demo-kitchen',
        x: 400, y: 0,
        width: 300, height: 200,
        type: 'kitchen',
        name: 'Kitchen'
      },
      {
        id: 'demo-bedroom',
        x: 0, y: 300,
        width: 350, height: 250,
        type: 'bedroom',
        name: 'Bedroom'
      }
    ];
  }
  
  console.log('âœ… Final analysis:', { rooms: rooms.length, walls: walls.length, doors: doors.length });
  console.log('ðŸ  Room details:', rooms);
  console.log('ðŸ§± Wall details:', walls);
  return { rooms, walls, doors, windows };
};

// Intelligent coordinate conversion with proper scaling - FIXED for accurate positioning
const convertToWorld3D = (x, y, width, height, bounds) => {
  // Calculate world scale to fit everything in a reasonable space
  const maxDimension = Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
    1
  );
  
  // Target world size - smaller scale for better precision
  const targetWorldSize = 25;
  const worldScale = targetWorldSize / maxDimension;
  
  // DON'T center - use absolute positioning to maintain layout integrity
  return {
    x: x * worldScale,
    z: y * worldScale, // Note: Y becomes Z in 3D space
    width: width * worldScale,
    height: height * worldScale
  };
};

// Calculate bounds from room data - FIXED to not add artificial padding
const calculateBounds = (rooms) => {
  if (rooms.length === 0) {
    return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
  }
  
  // Use actual room boundaries without artificial padding
  const bounds = {
    minX: Math.min(...rooms.map(r => r.x)),
    maxX: Math.max(...rooms.map(r => r.x + r.width)),
    minY: Math.min(...rooms.map(r => r.y)),
    maxY: Math.max(...rooms.map(r => r.y + r.height))
  };
  
  console.log('ðŸ“ Calculated bounds (no padding):', bounds);
  console.log('ðŸ“ Room positions:', rooms.map(r => ({ 
    name: r.name, 
    x: r.x, 
    y: r.y, 
    width: r.width, 
    height: r.height 
  })));
  
  return bounds;
};

// Standalone Wall Component - Renders custom walls from 2D editor
const Wall3D = ({ wall, bounds, customColors }) => {
  const wallHeight = 2.7; // Match room boundary walls
  const wallThickness = 0.08; // Match room boundary walls
  const wallColor = customColors?.walls || '#FAFAFA';
  
  console.log('ðŸ§± Rendering wall:', wall, 'bounds:', bounds);
  
  // Convert wall coordinates to 3D world space
  const start = convertToWorld3D(wall.x1, wall.y1, 0, 0, bounds);
  const end = convertToWorld3D(wall.x2, wall.y2, 0, 0, bounds);
  
  // Calculate wall center, length, and rotation
  const centerX = (start.x + end.x) / 2;
  const centerZ = (start.z + end.z) / 2;
  
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  
  if (length < 0.01) return null; // Skip zero-length walls
  
  return (
    <mesh
      position={[centerX, wallHeight / 2, centerZ]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, wallHeight, wallThickness]} />
      {/* Custom walls with same styling as room boundary walls */}
      <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.0} />
    </mesh>
  );
};

// Simple Door Component for 2D editor doors - positioned at exact coordinates
const SimpleDoor3D = ({ door, bounds }) => {
  const doorHeight = 2.1;
  const doorThickness = 0.08; // Match wall thickness
  const doorFrameWidth = 0.1; // Door frame width
  
  // Doors from 2D editor already converted to {x, y, width, height} format by analyzeFloorPlanData
  const x = door.x || 0;
  const y = door.y || 0;
  const rectWidth = door.width || 30;
  const rectHeight = door.height || 80;
  
  console.log('ðŸšª Door input data:', { x, y, rectWidth, rectHeight });
  
  // Determine door orientation based on rectangle dimensions
  // If width > height, door is horizontal; if height > width, door is vertical
  let centerX, centerZ, doorWidth, angle;
  
  if (rectWidth > rectHeight) {
    // Horizontal door (along X axis)
    const x1 = x;
    const x2 = x + rectWidth;
    const yPos = y + rectHeight / 2;
    
    const start = convertToWorld3D(x1, yPos, 0, 0, bounds);
    const end = convertToWorld3D(x2, yPos, 0, 0, bounds);
    
    centerX = (start.x + end.x) / 2;
    centerZ = (start.z + end.z) / 2;
    
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    doorWidth = Math.sqrt(dx * dx + dz * dz);
    angle = Math.atan2(dz, dx);
  } else {
    // Vertical door (along Y axis)
    const xPos = x + rectWidth / 2;
    const y1 = y;
    const y2 = y + rectHeight;
    
    const start = convertToWorld3D(xPos, y1, 0, 0, bounds);
    const end = convertToWorld3D(xPos, y2, 0, 0, bounds);
    
    centerX = (start.x + end.x) / 2;
    centerZ = (start.z + end.z) / 2;
    
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    doorWidth = Math.sqrt(dx * dx + dz * dz);
    angle = Math.atan2(dz, dx);
  }
  
  console.log('ðŸšª SimpleDoor3D:', { 
    center: [centerX.toFixed(2), centerZ.toFixed(2)], 
    angle: (angle * 180 / Math.PI).toFixed(1) + 'Â°',
    doorWidth: doorWidth.toFixed(2),
    orientation: rectWidth > rectHeight ? 'horizontal' : 'vertical'
  });
  
  if (doorWidth < 0.1) return null; // Skip tiny doors
  
  return (
    <group position={[centerX, 0, centerZ]} rotation={[0, -angle, 0]}>
      {/* Door opening/gap - no mesh, just empty space */}
      
      {/* Left door frame */}
      <mesh
        position={[-doorWidth / 2 + doorFrameWidth / 2, doorHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[doorFrameWidth, doorHeight, doorThickness]} />
        <meshStandardMaterial color="#8B4513" roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Right door frame */}
      <mesh
        position={[doorWidth / 2 - doorFrameWidth / 2, doorHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[doorFrameWidth, doorHeight, doorThickness]} />
        <meshStandardMaterial color="#8B4513" roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Top frame */}
      <mesh
        position={[0, doorHeight - doorFrameWidth / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[doorWidth, doorFrameWidth, doorThickness]} />
        <meshStandardMaterial color="#8B4513" roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Door panel (swinging door) - positioned at left side */}
      <mesh
        position={[0, doorHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[doorWidth - doorFrameWidth * 2, doorHeight - doorFrameWidth, 0.04]} />
        <meshStandardMaterial color="#A0522D" roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
};

// Enhanced Room Component - FIXED positioning with doors and windows
const Room3D = ({ room, bounds, showLabels = true, doors = [], windows = [], walls = [], customColors, roomColors = {} }) => {
  // Normalize room ID to string for consistent lookup
  const roomIdString = String(room.id);
  
  // Check if this room has a specific color, otherwise use global wall color
  const wallColor = roomColors[roomIdString] || customColors?.walls || '#FAFAFA';
  
  const floorColors = {
    'livingroom': '#F4E4C7', // Warm beige
    'living': '#F4E4C7',
    'bedroom': '#E8F4F8', // Soft blue
    'kitchen': '#FFF8E7', // Cream white
    'bathroom': '#F0F8FF', // Alice blue
    'drawingroom': '#F5F0E8', // Off white
    'drawing': '#F5F0E8',
    'carporch': '#E6E6FA', // Lavender
    'porch': '#E6E6FA',
    'garden': '#F0FFF0', // Honeydew
    'dining': '#FFF5EE', // Seashell
    'study': '#F8F8FF', // Ghost white
    'office': '#F8F8FF'
  };
  
  // Normalize room type for color lookup
  const normalizedType = room.type?.toLowerCase()
    .replace(/[-\d\s]/g, '') 
    .replace('room', '') || 'room';
  
  const roomColor = floorColors[normalizedType] || '#F5F5F5';
  
  // Convert to world coordinates - FIXED to maintain exact 2D positioning
  const world = convertToWorld3D(room.x, room.y, room.width, room.height, bounds);
  
  const wallHeight = 2.8;
  const wallThickness = 0.08; // Reduced wall thickness to prevent overlap
  const floorThickness = 0.02;
  
  // Position room at its EXACT converted coordinates (no centering)
  const roomX = world.x + world.width / 2;  // Center of room in world space
  const roomZ = world.z + world.height / 2; // Center of room in world space
  
  // Find doors and windows for this room - updated for new door structure
  const roomDoors = doors.filter(door => 
    door.connectedRooms?.includes(room.id) ||
    (door.roomPositions && door.roomPositions.some(rp => rp.roomId === room.id))
  );
  
  const roomWindows = windows.filter(window => 
    window.roomId === room.id ||
    window.id.includes(room.id?.toString() || room.name)
  );
  
  console.log(`Room ${room.name}: Doors: ${roomDoors.length}, Windows: ${roomWindows.length}`);
  
  return (
    <group position={[roomX, 0, roomZ]}>
      {/* Floor - slightly larger to overlap with adjacent rooms and hide seams */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[world.width + 0.1, world.height + 0.1]} />
        <meshLambertMaterial color={roomColor} />
      </mesh>
      
      {/* Room boundary walls - ALL walls for each room to match 2D exactly */}
      {(() => {
          const wallHeight = 2.7;
          const wallThickness = 0.08;
          
          // Function to generate wall segments avoiding door cutouts
          const generateWallSegments = (wallType, totalLength) => {
            // Find doors on this wall for this specific room
            const wallDoors = roomDoors.filter(door => {
              if (door.roomPositions) {
                return door.roomPositions.some(rp => 
                  rp.roomId === room.id && rp.wall === wallType
                );
              }
              return false;
            });
            
            if (wallDoors.length === 0) {
              return [{ start: -totalLength/2, end: totalLength/2, center: 0, length: totalLength }];
            }
            
            const segments = [];
            let currentPos = -totalLength/2;
            
            // Sort doors by position along the wall
            wallDoors.sort((a, b) => {
              const posA = a.roomPositions.find(rp => rp.roomId === room.id)?.wallPosition || 0;
              const posB = b.roomPositions.find(rp => rp.roomId === room.id)?.wallPosition || 0;
              return posA - posB;
            });
            
            wallDoors.forEach(door => {
              const doorWidth = door.width || 0.8;
              const roomPosData = door.roomPositions.find(rp => rp.roomId === room.id);
              const doorPos = roomPosData?.wallPosition || 0;
              const doorStart = doorPos - doorWidth/2;
              const doorEnd = doorPos + doorWidth/2;
              
              if (currentPos < doorStart - 0.05) {
                const segmentCenter = (currentPos + doorStart) / 2;
                segments.push({ 
                  start: currentPos, 
                  end: doorStart - 0.05, 
                  center: segmentCenter,
                  length: doorStart - 0.05 - currentPos
                });
              }
              
              currentPos = doorEnd + 0.05;
            });
            
            if (currentPos < totalLength/2) {
              const segmentCenter = (currentPos + totalLength/2) / 2;
              segments.push({ 
                start: currentPos, 
                end: totalLength/2, 
                center: segmentCenter,
                length: totalLength/2 - currentPos
              });
            }
            
            return segments.filter(seg => seg.length > 0.1);
          };
          
          return (
            <>
              {/* North wall */}
              {generateWallSegments('north', world.width).map((segment, idx) => (
                <mesh 
                  key={`north-${idx}`}
                  position={[segment.center, wallHeight/2, -world.height/2 + wallThickness/2]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[segment.length, wallHeight, wallThickness]} />
                  <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.0} />
                </mesh>
              ))}
              
              {/* South wall */}
              {generateWallSegments('south', world.width).map((segment, idx) => (
                <mesh 
                  key={`south-${idx}`}
                  position={[segment.center, wallHeight/2, world.height/2 - wallThickness/2]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[segment.length, wallHeight, wallThickness]} />
                  <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.0} />
                </mesh>
              ))}
              
              {/* East wall */}
              {generateWallSegments('east', world.height).map((segment, idx) => (
                <mesh 
                  key={`east-${idx}`}
                  position={[world.width/2 - wallThickness/2, wallHeight/2, segment.center]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[wallThickness, wallHeight, segment.length]} />
                  <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.0} />
                </mesh>
              ))}
              
              {/* West wall */}
              {generateWallSegments('west', world.height).map((segment, idx) => (
                <mesh 
                  key={`west-${idx}`}
                  position={[-world.width/2 + wallThickness/2, wallHeight/2, segment.center]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[wallThickness, wallHeight, segment.length]} />
                  <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.0} />
                </mesh>
              ))}
            </>
          );
        })()}
      
      {/* Render windows with smart positioning - FIXED: Windows embedded in walls */}
      {roomWindows.map((window, idx) => {
        // Calculate window position relative to room center - FIXED to be inside walls
        let windowX = 0, windowZ = 0, windowRotation = [0, 0, 0];
        const wallThickness = 0.08; // Same as wall thickness
        
        switch (window.wall) {
          case 'north':
            windowX = window.wallPosition || 0;
            windowZ = -world.height/2 + wallThickness/2; // FIXED: Position in center of wall
            windowRotation = [0, 0, 0];
            break;
          case 'south':
            windowX = window.wallPosition || 0;
            windowZ = world.height/2 - wallThickness/2; // FIXED: Position in center of wall
            windowRotation = [0, Math.PI, 0];
            break;
          case 'east':
            windowX = world.width/2 - wallThickness/2; // FIXED: Position in center of wall
            windowZ = window.wallPosition || 0;
            windowRotation = [0, -Math.PI/2, 0];
            break;
          case 'west':
            windowX = -world.width/2 + wallThickness/2; // FIXED: Position in center of wall
            windowZ = window.wallPosition || 0;
            windowRotation = [0, Math.PI/2, 0];
            break;
          default:
            // Fallback for legacy positioning - also fixed for wall embedding
            windowX = (window.position?.[0] || 0) - roomX;
            windowZ = (window.position?.[2] || 0) - roomZ;
            
            // Adjust positions to be in wall center if they're at wall boundaries
            if (Math.abs(windowZ - world.height/2) < 0.1) {
              windowZ = world.height/2 - wallThickness/2; // South wall center
            } else if (Math.abs(windowZ + world.height/2) < 0.1) {
              windowZ = -world.height/2 + wallThickness/2; // North wall center
            }
            if (Math.abs(windowX - world.width/2) < 0.1) {
              windowX = world.width/2 - wallThickness/2; // East wall center
            } else if (Math.abs(windowX + world.width/2) < 0.1) {
              windowX = -world.width/2 + wallThickness/2; // West wall center
            }
            
            windowRotation = window.rotation || [0, 0, 0];
        }
        
        return (
          <Window3D
            key={window.id || `window-${room.id}-${idx}`}
            position={[windowX, 0, windowZ]} // FIXED: Let Window3D handle Y positioning internally
            rotation={windowRotation}
            width={window.width || 1.4}
            height={window.height || 1.2}
            roomType={window.roomType || room.type || 'default'}
            customColors={customColors}
          />
        );
      })}
      
      {/* Room Label positioned inside custom wall layout */}
      {showLabels && (() => {
        // Calculate the actual center of the room based on custom wall boundaries
        // Find walls that belong to this room by checking proximity
        const roomWalls = walls.filter(wall => {
          const wx1 = wall.x1 - roomX;
          const wz1 = wall.y1 - roomZ;
          const wx2 = wall.x2 - roomX;
          const wz2 = wall.y2 - roomZ;
          
          // Check if wall endpoints are within or near room boundaries
          const isInside = (x, z) => 
            Math.abs(x) <= world.width/2 + 0.2 && 
            Math.abs(z) <= world.height/2 + 0.2;
          
          return isInside(wx1, wz1) || isInside(wx2, wz2);
        });
        
        // Calculate bounding box of custom walls for this room
        let minX = -world.width/2, maxX = world.width/2;
        let minZ = -world.height/2, maxZ = world.height/2;
        
        if (roomWalls.length > 0) {
          minX = Math.min(...roomWalls.flatMap(w => [w.x1 - roomX, w.x2 - roomX]));
          maxX = Math.max(...roomWalls.flatMap(w => [w.x1 - roomX, w.x2 - roomX]));
          minZ = Math.min(...roomWalls.flatMap(w => [w.y1 - roomZ, w.y2 - roomZ]));
          maxZ = Math.max(...roomWalls.flatMap(w => [w.y1 - roomZ, w.y2 - roomZ]));
        }
        
        // Position label at center of custom wall boundaries
        const labelX = (minX + maxX) / 2;
        const labelZ = (minZ + maxZ) / 2;
        const labelWidth = maxX - minX;
        
        return (
          <Text
            position={[labelX, 0.15, labelZ]}
            rotation={[-Math.PI/2, 0, 0]}
            fontSize={Math.min(world.width, world.height) * 0.15}
            color="#2C3E50"
            anchorX="center"
            anchorY="middle"
            maxWidth={labelWidth * 0.85}
            outlineWidth={0.01}
            outlineColor="#FFFFFF"
          >
            {room.name || room.type || 'Room'}
          </Text>
        );
      })()}

      {/* Room Accessories/Furniture */}
      <RoomAccessories
        roomType={room.type || 'room'}
        roomWidth={world.width}
        roomHeight={world.height}
      />
    </group>
  );
};

// Professional outdoor daylight lighting setup
const Lighting3D = ({ sunSettings }) => (
  <>
    {/* Outdoor ambient light for natural illumination */}
    <ambientLight intensity={0.25} color="#E6F3FF" />
    
    {/* Sky hemisphere light for realistic outdoor environment */}
    <hemisphereLight 
      skyColor="#87CEEB" 
      groundColor="#8B7355" 
      intensity={0.5} 
    />

    {/* Sun system or fallback directional light */}
    {sunSettings?.enabled ? (
      <SunSystem3D settings={sunSettings} />
    ) : (
      <>
        {/* Natural daylight positioned above house */}
        <directionalLight
          position={[8, 25, 5]}
          intensity={1.6}
          color="#FFF8DC"
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-near={0.1}
          shadow-camera-far={100}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-bias={-0.0001}
          shadow-normalBias={0.02}
        />
        {/* Secondary fill light for softer shadows */}
        <directionalLight
          position={[-15, 20, -10]}
          intensity={0.4}
          color="#B8D4F0"
        />
      </>
    )}
    
    {/* Secondary directional light for softer shadows */}
    <directionalLight
      position={[-15, 25, 15]}
      intensity={0.4}
      color="#E6F3FF"
      castShadow={false}
    />
    
    {/* Interior point lights for warmth */}
    <pointLight 
      position={[0, 12, 0]} 
      intensity={0.6} 
      color="#FFF8DC" 
      distance={25}
      decay={2}
    />
    <pointLight 
      position={[-12, 8, -12]} 
      intensity={0.4} 
      color="#FFE4B5" 
      distance={20}
      decay={2}
    />
    <pointLight 
      position={[12, 8, 12]} 
      intensity={0.4} 
      color="#FFE4B5" 
      distance={20}
      decay={2}
    />
    
    {/* Hemisphere light for natural sky lighting */}
    <hemisphereLight
      skyColor="#87CEEB"
      groundColor="#8B7355"
      intensity={0.3}
    />
  </>
);

// Enhanced First Person Walking Controller with WASD movement and mouse look
const FirstPersonController = ({ bounds, rooms, onPlayerPositionChange }) => {
  const { camera, scene, gl } = useThree();
  const [moveState, setMoveState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  });
  
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const rightVectorRef = useRef(new THREE.Vector3());
  
  // Movement settings
  const walkSpeed = 3.0;
  const sprintSpeed = 6.0;
  const playerHeight = 1.7 + FOUNDATION_HEIGHT; // Account for foundation
  const collisionDistance = 0.3;
  const mouseSensitivity = 0.002;
  
  // Mouse look variables
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const PI_2 = Math.PI / 2;
  
  // Check if currently moving (for UI display)
  const isMoving = moveState.forward || moveState.backward || moveState.left || moveState.right;
  
  // Handle keyboard input for WASD movement (works with or without pointer lock)
  const handleKeyDown = useCallback((event) => {
    console.log('Key pressed:', event.code); // DEBUG: Show which keys are pressed
    
    switch (event.code) {
      case 'KeyW':
        setMoveState(prev => ({ ...prev, forward: true }));
        event.preventDefault();
        console.log('Moving FORWARD');
        break;
      case 'KeyS':
        setMoveState(prev => ({ ...prev, backward: true }));
        event.preventDefault();
        console.log('Moving BACKWARD');
        break;
      case 'KeyA':
        setMoveState(prev => ({ ...prev, left: true }));
        event.preventDefault();
        console.log('Moving LEFT');
        break;
      case 'KeyD':
        setMoveState(prev => ({ ...prev, right: true }));
        event.preventDefault();
        console.log('Moving RIGHT');
        break;
      case 'ArrowUp':
        setMoveState(prev => ({ ...prev, forward: true }));
        event.preventDefault();
        break;
      case 'ArrowDown':
        setMoveState(prev => ({ ...prev, backward: true }));
        event.preventDefault();
        break;
      case 'ArrowLeft':
        if (!isPointerLocked) {
          // Use arrow keys for camera rotation when pointer lock is not available
          euler.current.setFromQuaternion(camera.quaternion);
          euler.current.y += 0.05;
          camera.quaternion.setFromEuler(euler.current);
          event.preventDefault();
        } else {
          setMoveState(prev => ({ ...prev, left: true }));
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (!isPointerLocked) {
          euler.current.setFromQuaternion(camera.quaternion);
          euler.current.y -= 0.05;
          camera.quaternion.setFromEuler(euler.current);
          event.preventDefault();
        } else {
          setMoveState(prev => ({ ...prev, right: true }));
          event.preventDefault();
        }
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        setMoveState(prev => ({ ...prev, sprint: true }));
        event.preventDefault();
        break;
    }
  }, []);
  
  const handleKeyUp = useCallback((event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        setMoveState(prev => ({ ...prev, forward: false }));
        event.preventDefault();
        break;
      case 'KeyS':
      case 'ArrowDown':
        setMoveState(prev => ({ ...prev, backward: false }));
        event.preventDefault();
        break;
      case 'KeyA':
      case 'ArrowLeft':
        setMoveState(prev => ({ ...prev, left: false }));
        event.preventDefault();
        break;
      case 'KeyD':
      case 'ArrowRight':
        setMoveState(prev => ({ ...prev, right: false }));
        event.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        setMoveState(prev => ({ ...prev, sprint: false }));
        event.preventDefault();
        break;
    }
  }, []);

  // Handle mouse movement for looking around
  const handleMouseMove = useCallback((event) => {
    if (!isPointerLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    euler.current.setFromQuaternion(camera.quaternion);
    euler.current.y -= movementX * mouseSensitivity;
    euler.current.x -= movementY * mouseSensitivity;
    euler.current.x = Math.max(-PI_2, Math.min(PI_2, euler.current.x));
    
    camera.quaternion.setFromEuler(euler.current);
  }, [isPointerLocked, camera, mouseSensitivity]);

  // Try to request pointer lock when component mounts
  useEffect(() => {
    const requestPointerLock = () => {
      const canvas = gl.domElement;
      if (canvas && canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    };

    // Request pointer lock automatically after a short delay
    const timer = setTimeout(requestPointerLock, 1000);
    
    return () => clearTimeout(timer);
  }, [gl.domElement]);

  // Handle pointer lock events
  const handlePointerLockChange = useCallback(() => {
    setIsPointerLocked(document.pointerLockElement === gl.domElement);
  }, [gl.domElement]);

  const handlePointerLockError = useCallback(() => {
    setIsPointerLocked(false);
  }, []);
  
  // Setup event listeners for keyboard, mouse, and pointer lock
  useEffect(() => {
    const canvas = gl.domElement;
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Mouse events
    document.addEventListener('mousemove', handleMouseMove);
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    
    // Make canvas focusable and focus it
    canvas.tabIndex = -1;
    canvas.focus();
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handlePointerLockChange, handlePointerLockError, gl.domElement]);
  
  // Check collision with walls and boundaries
  const checkCollision = useCallback((newPosition) => {
    if (!bounds || !rooms) return false;
    
    // Convert bounds to world coordinates for collision checking
    const worldScale = 25 / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1);
    const worldBounds = {
      minX: bounds.minX * worldScale,
      maxX: bounds.maxX * worldScale,
      minZ: bounds.minY * worldScale,
      maxZ: bounds.maxY * worldScale
    };
    
    // Check boundaries
    if (newPosition.x < worldBounds.minX + collisionDistance || 
        newPosition.x > worldBounds.maxX - collisionDistance ||
        newPosition.z < worldBounds.minZ + collisionDistance || 
        newPosition.z > worldBounds.maxZ - collisionDistance) {
      return true;
    }
    
    // Check if position is inside any room (allowed)
    for (const room of rooms) {
      const roomWorldX = room.x * worldScale;
      const roomWorldZ = room.y * worldScale;
      const roomWorldWidth = room.width * worldScale;
      const roomWorldHeight = room.height * worldScale;
      
      if (newPosition.x >= roomWorldX + collisionDistance &&
          newPosition.x <= roomWorldX + roomWorldWidth - collisionDistance &&
          newPosition.z >= roomWorldZ + collisionDistance &&
          newPosition.z <= roomWorldZ + roomWorldHeight - collisionDistance) {
        return false; // Inside room, no collision
      }
    }
    
    return true; // Outside all rooms, collision
  }, [bounds, rooms, collisionDistance]);
  
  // Animation loop for WASD movement - SIMPLIFIED AND DIRECT
  useFrame((state, delta) => {
    if (!camera) return;
    
    // Calculate current movement speed (walk or sprint)
    const currentSpeed = moveState.sprint ? sprintSpeed : walkSpeed;
    
    // Check if any movement keys are pressed
    const isMoving = moveState.forward || moveState.backward || moveState.left || moveState.right;
    
    // DEBUG: Log movement state periodically
    if (isMoving && Math.random() < 0.01) { // Log 1% of frames to avoid spam
      console.log('Movement active:', moveState, 'Camera pos:', camera.position);
    }
    
    if (isMoving) {
      // DIRECT MOVEMENT - bypass complex collision for now
      const moveDistance = currentSpeed * delta;
      
      // Get camera direction for forward/backward
      camera.getWorldDirection(directionRef.current);
      directionRef.current.y = 0; // Keep horizontal
      directionRef.current.normalize();
      
      // Get right vector for left/right
      rightVectorRef.current.crossVectors(directionRef.current, camera.up).normalize();
      
      // Apply movement directly to camera position
      if (moveState.forward) {
        camera.position.add(directionRef.current.clone().multiplyScalar(moveDistance));
      }
      if (moveState.backward) {
        camera.position.add(directionRef.current.clone().multiplyScalar(-moveDistance));
      }
      if (moveState.left) {
        camera.position.add(rightVectorRef.current.clone().multiplyScalar(-moveDistance));
      }
      if (moveState.right) {
        camera.position.add(rightVectorRef.current.clone().multiplyScalar(moveDistance));
      }
      
      // Keep camera at proper height
      camera.position.y = playerHeight;
    }
    
    // Notify parent about player position for door proximity detection
    if (onPlayerPositionChange) {
      onPlayerPositionChange([camera.position.x, camera.position.y, camera.position.z]);
    }
  });
  
  // Return movement status indicator
  return (
    <>
      {/* Movement Status Display */}
      <Text
        position={[camera.position.x, camera.position.y + 1, camera.position.z - 2]}
        fontSize={0.2}
        color="#00FF00"
        anchorX="center"
        anchorY="middle"
      >
        {isMoving ? 
          `MOVING: ${moveState.forward ? 'W' : ''}${moveState.backward ? 'S' : ''}${moveState.left ? 'A' : ''}${moveState.right ? 'D' : ''}${moveState.sprint ? ' SPRINT' : ''}` : 
          'Press WASD to Move'
        }
      </Text>
    </>
  );
};

// Enhanced intelligent camera controller with optimal positioning
const CameraController3D = ({ mode, bounds, rooms, onPlayerPositionChange }) => {
  const { camera, scene } = useThree();
  
  // Calculate optimal camera position based on floor plan size
  const floorPlanWidth = bounds.maxX - bounds.minX;
  const floorPlanHeight = bounds.maxY - bounds.minY;
  const maxDimension = Math.max(floorPlanWidth, floorPlanHeight);
  
  // Enhanced viewing distance calculation for better overview
  const baseDistance = 35; // Increased base distance
  const scaleFactor = Math.max(maxDimension / 800, 0.8); // Better scaling
  const viewDistance = baseDistance * scaleFactor;
  
  useEffect(() => {
    if (mode === 'overview') {
      // Calculate building center for better framing
      const buildingCenterX = (bounds.maxX + bounds.minX) / 2;
      const buildingCenterY = (bounds.maxY + bounds.minY) / 2;
      
      // Convert to world coordinates
      const worldScale = 25 / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1);
      const worldCenterX = buildingCenterX * worldScale;
      const worldCenterZ = buildingCenterY * worldScale;
      
      // Enhanced camera positioning for architectural beauty
      const cameraHeight = viewDistance * 0.6; // Better height ratio
      const horizontalDistance = viewDistance * 0.8; // Optimal horizontal distance
      
      // Position camera at a 45-degree angle for best architectural view
      const angle = Math.PI / 3; // 60 degrees for more dynamic view
      const cameraX = worldCenterX + Math.cos(angle) * horizontalDistance;
      const cameraZ = worldCenterZ + Math.sin(angle) * horizontalDistance;
      
      camera.position.set(cameraX, cameraHeight, cameraZ);
      camera.lookAt(worldCenterX, 2, worldCenterZ); // Look at building center, slightly above ground
      camera.updateMatrixWorld();
      
      console.log('ðŸ“· Enhanced camera positioning:', {
        buildingCenter: [worldCenterX, worldCenterZ],
        cameraPosition: [cameraX, cameraHeight, cameraZ],
        viewDistance,
        angle: angle * (180 / Math.PI) + 'Â°'
      });
    } else if (mode === 'walk') {
      // Position camera inside the first room at human height (on foundation)
      if (rooms && rooms.length > 0) {
        const firstRoom = rooms[0];
        const worldScale = 25 / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1);
        const roomCenterX = (firstRoom.x + firstRoom.width / 2) * worldScale;
        const roomCenterZ = (firstRoom.y + firstRoom.height / 2) * worldScale;
        
        camera.position.set(roomCenterX, 1.7 + FOUNDATION_HEIGHT, roomCenterZ);
        camera.lookAt(roomCenterX + 1, 1.7 + FOUNDATION_HEIGHT, roomCenterZ);
      } else {
        // Fallback position
        camera.position.set(0, 1.7 + FOUNDATION_HEIGHT, 0);
        camera.lookAt(1, 1.7 + FOUNDATION_HEIGHT, 0);
      }
      camera.updateMatrixWorld();
    }
  }, [mode, camera, viewDistance, rooms, bounds]);

  if (mode === 'walk') {
    return (
      <FirstPersonController bounds={bounds} rooms={rooms} onPlayerPositionChange={onPlayerPositionChange} />
    );
  }
  
  // Enhanced OrbitControls for better overview experience
  const buildingCenterX = (bounds.maxX + bounds.minX) / 2;
  const buildingCenterY = (bounds.maxY + bounds.minY) / 2;
  const worldScale = 25 / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1);
  const worldCenterX = buildingCenterX * worldScale;
  const worldCenterZ = buildingCenterY * worldScale;
  
  return (
    <OrbitControls
      target={[worldCenterX, 2, worldCenterZ]} // Center on the building at eye level
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minPolarAngle={Math.PI / 8} // 22.5Â° - prevent going too low (underground view)
      maxPolarAngle={Math.PI / 2.2} // ~82Â° - prevent going completely overhead
      minAzimuthAngle={-Infinity} // Unlimited horizontal rotation
      maxAzimuthAngle={Infinity} // Unlimited horizontal rotation
      minDistance={viewDistance * 0.3} // Closer minimum for detail views
      maxDistance={viewDistance * 2.5} // Reasonable maximum distance
      enableDamping={true}
      dampingFactor={0.15} // Higher damping for smoother motion (reduces flickering)
      rotateSpeed={0.5} // Slightly slower for smoother rotation
      zoomSpeed={0.7} // Controlled zoom speed
      panSpeed={0.4} // Gentler panning
      autoRotate={false}
      autoRotateSpeed={0.3} // Slower auto-rotate when enabled
      makeDefault
    />
  );
};

// Main 3D Scene Component - Enhanced with doors and windows
const FloorPlan3DScene = ({ floorPlanData, mode, customColors, roomColors = {}, doorColors = {}, onRoomsAnalyzed, onDoorsAnalyzed, sunSettings }) => {
  const [doorStates, setDoorStates] = useState({});
  const [playerPosition, setPlayerPosition] = useState([0, 1.7, 0]);
  
  // Default colors if not provided
  const colors = customColors || {
    walls: '#FAFAFA',
    windows: '#87CEEB',
    ground: '#90EE90',
    foundation: '#D3D3D3',
    doors: '#8B4513'
  };
  
  // Analyze and extract data - memoized to prevent infinite loops
  const analysisData = useMemo(() => {
    console.log('ðŸ” Analyzing floor plan data for 3D rendering:', floorPlanData);
    console.log('ðŸ” Data structure check - has rooms?:', floorPlanData?.rooms?.length || 0);
    console.log('ðŸ” Data structure check - has walls?:', floorPlanData?.walls?.length || 0);
    console.log('ðŸ” Data structure check - has doors?:', floorPlanData?.doors?.length || 0);
    console.log('ðŸ” Data structure check - has mapData?:', floorPlanData?.mapData?.length || 0);
    console.log('ðŸ” Update timestamp:', floorPlanData?._updateTimestamp);
    
    if (floorPlanData?.rooms) {
      console.log('ðŸ  Direct rooms data for 3D:', floorPlanData.rooms.map(r => ({ id: r.id, name: r.name, source: r.source })));
    }
    
    const result = analyzeFloorPlanData(floorPlanData);
    console.log('ðŸŽ¯ Analysis result - rooms for 3D:', result.rooms.length, result.rooms.map(r => ({ id: r.id, name: r.name, source: r.source })));
    console.log('ðŸªŸ Analysis result - windows for 3D:', result.windows?.length || 0);
    return result;
  }, [floorPlanData]);
  
  const { rooms, walls, doors, windows } = analysisData;
  
  // Notify parent component about analyzed rooms so ColorCustomizer uses same IDs
  useEffect(() => {
    if (rooms && rooms.length > 0 && onRoomsAnalyzed) {
      onRoomsAnalyzed(rooms);
    }
  }, [rooms, onRoomsAnalyzed]);
  
  console.log('ðŸ“Š Extracted data:', { 
    rooms: rooms.length, 
    walls: walls.length, 
    doors: doors.length,
    windows: windows?.length || 0,
    doorsData: doors 
  });
  
  // Calculate bounds - memoized
  const bounds = useMemo(() => {
    console.log('ðŸ“ Calculating bounds for rooms:', rooms.length);
    return calculateBounds(rooms);
  }, [rooms]);
  
  // Generate smart doors and windows using detected doors from 2D plan - memoized to prevent loops
  // Always generate smart doors for room connectivity
  const smartDoors = useMemo(() => {
    console.log('ðŸšª Generating smart doors for', rooms.length, 'rooms, detected 2D doors:', doors.length);
    return generateSmartDoors(rooms, bounds, doors);
  }, [rooms, bounds, doors]);
  
  // Notify parent about analyzed doors (must be after smartDoors is declared)
  useEffect(() => {
    if (smartDoors && smartDoors.length > 0 && onDoorsAnalyzed) {
      onDoorsAnalyzed(smartDoors);
    }
  }, [smartDoors, onDoorsAnalyzed]);
  
  const smartWindows = useMemo(() => {
    console.log('ðŸªŸ Generating smart windows for', rooms.length, 'rooms, detected windows:', windows.length);
    return generateSmartWindows(rooms, bounds, windows);
  }, [rooms, bounds, windows]);
  
  // Handle door toggle
  const handleDoorToggle = (doorId, isOpen) => {
    setDoorStates(prev => ({
      ...prev,
      [doorId]: isOpen
    }));
  };
  
  // Handle player position updates for door proximity detection
  const handlePlayerPositionChange = (position) => {
    setPlayerPosition(position);
  };
  
  if (rooms.length === 0) {
    return (
      <Text position={[0, 2, 0]} fontSize={1.5} color="#E74C3C" anchorX="center">
        No floor plan data available
      </Text>
    );
  }
  
  // Calculate building dimensions - memoized to prevent re-computation
  const buildingData = useMemo(() => {
    const buildingCenterX = (bounds.minX + bounds.maxX) / 2;
    const buildingCenterZ = (bounds.minY + bounds.maxY) / 2;
    const buildingWidth = (bounds.maxX - bounds.minX);
    const buildingHeight = (bounds.maxY - bounds.minY);
    
    // Convert building center to world coordinates
    const worldBuildingCenter = convertToWorld3D(buildingCenterX, buildingCenterZ, 0, 0, bounds);
    const worldBuildingSize = convertToWorld3D(0, 0, buildingWidth, buildingHeight, bounds);
    
    return {
      centerX: buildingCenterX,
      centerZ: buildingCenterZ,
      width: buildingWidth,
      height: buildingHeight,
      worldCenter: worldBuildingCenter,
      worldSize: worldBuildingSize
    };
  }, [bounds]);
  
  console.log('ðŸ—ï¸ Building with doors and windows:', { 
    rooms: rooms.length,
    smartDoors: smartDoors.length,
    smartWindows: smartWindows.length,
    bounds
  });
  
  // Foundation height - building sits on top of this
  const foundationHeight = FOUNDATION_HEIGHT;
  const foundationPadding = FOUNDATION_PADDING;
  
  return (
    <group>
      {/* Enhanced ground plane positioned correctly - lowered to prevent z-fighting */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial 
          color={colors.ground} 
          roughness={0.8}
          metalness={0.0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      
      {/* Building foundation - 3D box that building sits on top of */}
      {(() => {
        // Calculate the actual center of the building based on rooms
        // Using same logic as Room3D to ensure alignment
        const worldScale = 25 / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1);
        const buildingCenterX = ((bounds.minX + bounds.maxX) / 2) * worldScale;
        const buildingCenterZ = ((bounds.minY + bounds.maxY) / 2) * worldScale;
        const buildingWorldWidth = (bounds.maxX - bounds.minX) * worldScale;
        const buildingWorldHeight = (bounds.maxY - bounds.minY) * worldScale;
        
        return (
          <mesh 
            position={[
              buildingCenterX, 
              foundationHeight / 2, 
              buildingCenterZ
            ]} 
            castShadow
            receiveShadow
          >
            <boxGeometry args={[
              buildingWorldWidth + foundationPadding * 2,
              foundationHeight,
              buildingWorldHeight + foundationPadding * 2
            ]} />
            <meshStandardMaterial 
              color={colors.foundation} 
              roughness={0.9}
              metalness={0.0}
            />
          </mesh>
        );
      })()}
      
      {/* Render ONLY manually added walls from 2D editor (IDs starting with 'new-wall-') - elevated on foundation */}
      {/* Room boundary walls are rendered by Room3D, so we only render user-created custom walls */}
      <group position={[0, foundationHeight, 0]}>
        {walls && walls.length > 0 && walls
          .filter(wall => wall.id && wall.id.toString().startsWith('new-wall-'))
          .map((wall, index) => {
            return (
              <Wall3D 
                key={`custom-wall-${wall.id || index}`}
                wall={wall}
                bounds={bounds}
                customColors={colors}
              />
            );
          })
        }
      </group>
      
      {/* Render doors from 2D editor - DISABLED, using smart doors instead */}
      {/* SimpleDoor3D is only for user-placed doors in customization mode */}
      {false && walls.length > 0 && console.log('ðŸ”§ About to render user doors:', doors?.length, doors)}
      {false && walls.length > 0 && doors && doors.length > 0 && doors.map((door, index) => {
        console.log(`ðŸšª Rendering user door ${index}:`, door);
        return (
          <SimpleDoor3D 
            key={`2d-door-${index}`}
            door={door}
            bounds={bounds}
          />
        );
      })}
      
      {/* Render rooms with doors and windows - elevated on foundation */}
      <group position={[0, foundationHeight, 0]}>
        {rooms.map((room, index) => {
          const roomIdString = String(room.id || index);
          return (
            <Room3D 
              key={`room-${roomIdString}-${roomColors[roomIdString] || 'default'}`} 
              room={room} 
              bounds={bounds}
              showLabels={mode === 'overview'}
              doors={smartDoors}
              windows={smartWindows}
              walls={walls}
              customColors={colors}
              roomColors={roomColors}
            />
          );
        })}
      </group>
      
      {/* Render smart doors globally - visible from both connected rooms - elevated on foundation */}
      <group position={[0, foundationHeight, 0]}>
        {smartDoors.map((door) => {
          // Use global position for doors to ensure they're visible from both sides
          const position = door.globalPosition || door.position || [0, 0, 0];
          const doorIdString = String(door.id);
          const doorColor = doorColors[doorIdString] || colors.doors;
          
          // For doors connecting multiple rooms, use the first room's rotation or calculate average
          let rotation = [0, 0, 0];
          if (door.roomPositions && door.roomPositions.length > 0) {
            rotation = door.roomPositions[0].rotation;
          } else if (door.rotation) {
            rotation = door.rotation;
          }
          
          return (
            <Door3D
              key={`${door.id}-${doorColor}`}
              position={position}
              rotation={rotation}
              width={door.width}
              height={door.height}
              isOpen={doorStates[door.id] || door.isOpen}
              onToggle={(isOpen) => handleDoorToggle(door.id, isOpen)}
              playerPosition={playerPosition}
              autoOpen={mode === 'walk'} // Only auto-open in walk mode
              customColor={doorColor}
            />
          );
        })}
      </group>
      
      {/* Render detected windows with realistic 3D windows - elevated on foundation */}
      <group position={[0, foundationHeight, 0]}>
        {smartWindows.filter(w => w.isDetected).map((window) => (
          <Window3D
            key={window.id}
            position={window.position}
            rotation={window.rotation}
            width={window.width}
            height={window.height}
            roomType={window.roomType || 'default'}
            customColors={colors}
          />
        ))}
      </group>
      
      <Lighting3D sunSettings={sunSettings} />
      <CameraController3D 
        mode={mode} 
        bounds={bounds} 
        rooms={rooms} 
        onPlayerPositionChange={handlePlayerPositionChange}
      />
    </group>
  );
};

// Loading component
const LoadingSpinner3D = () => (
  <mesh position={[0, 2, 0]}>
    <sphereGeometry args={[0.8]} />
    <meshBasicMaterial color="#3B82F6" />
  </mesh>
);

// Main component export with enhanced UI
const FloorPlan3D = ({ floorPlanData, className = "", isVisible = true }) => {
  // Generate unique save key based on floor plan data
  const saveKey = useMemo(() => {
    if (floorPlanData?.id) return `floorplan-3d-${floorPlanData.id}`;
    // Fallback: generate key from room data
    const roomsHash = floorPlanData?.rooms?.map(r => r.id).join('-') || 'default';
    return `floorplan-3d-${roomsHash}`;
  }, [floorPlanData]);
  
  // Load saved state from localStorage
  const loadSavedState = useCallback(() => {
    try {
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load saved 3D state:', error);
    }
    return null;
  }, [saveKey]);
  
  const savedState = loadSavedState();
  
  const [viewMode, setViewMode] = useState(savedState?.viewMode || 'overview');
  const [autoRotate, setAutoRotate] = useState(savedState?.autoRotate || false);
  const [walkModeStatus, setWalkModeStatus] = useState('inactive');
  const [customColors, setCustomColors] = useState(savedState?.customColors || {
    walls: '#FAFAFA',
    windows: '#87CEEB',
    ground: '#90EE90',
    foundation: '#D3D3D3',
    doors: '#8B4513'
  });
  const [roomColors, setRoomColors] = useState(savedState?.roomColors || {});
  const [doorColors, setDoorColors] = useState(savedState?.doorColors || {});
  const [analyzedRooms, setAnalyzedRooms] = useState([]);
  const [analyzedDoors, setAnalyzedDoors] = useState([]);
  const [isSunPanelOpen, setIsSunPanelOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('idle');
  const [activeTab, setActiveTab] = useState('sun');

  // Sun / daylight visualization settings
  const mergedDefaultSun = useMemo(() => {
    const base = { ...DEFAULT_SUN_SETTINGS };
    const saved = savedState?.sun || {};
    return { ...base, ...saved };
  }, [savedState]);

  const [sunEnabled, setSunEnabled] = useState(mergedDefaultSun.enabled);
  const [sunPosX, setSunPosX] = useState(mergedDefaultSun.posX);
  const [sunPosY, setSunPosY] = useState(mergedDefaultSun.posY);
  const [sunPosZ, setSunPosZ] = useState(mergedDefaultSun.posZ);
  const [sunBrightness, setSunBrightness] = useState(mergedDefaultSun.brightness);
  const [sunShadowStrength, setSunShadowStrength] = useState(mergedDefaultSun.shadowStrength);
  const [sunPreset, setSunPreset] = useState(mergedDefaultSun.preset);
  const [sunColorTemp, setSunColorTemp] = useState(mergedDefaultSun.colorTemp);
  const [sunShadowQuality, setSunShadowQuality] = useState(mergedDefaultSun.shadowQuality);

  // Apply preset when changed
  const applyPreset = useCallback((presetName) => {
    const preset = SUN_PRESETS[presetName];
    if (preset) {
      setSunPosX(preset.posX);
      setSunPosY(preset.posY);
      setSunPosZ(preset.posZ);
      setSunColorTemp(preset.colorTemp);
      setSunBrightness(preset.brightness);
      setSunPreset(presetName);
    }
  }, []);

  const sunSettings = useMemo(() => ({
    enabled: !sunEnabled,
    posX: clampNumber(sunPosX, -50, 50),
    posY: clampNumber(sunPosY, 5, 50),
    posZ: clampNumber(sunPosZ, -50, 50),
    brightness: clampNumber(sunBrightness, 0.1, 3),
    shadowStrength: clampNumber(sunShadowStrength, 0, 1),
    colorTemp: clampNumber(sunColorTemp, 2000, 8000),
    shadowQuality: sunShadowQuality
  }), [sunEnabled, sunPosX, sunPosY, sunPosZ, sunBrightness, sunShadowStrength, sunColorTemp, sunShadowQuality]);
  
  // Use analyzed rooms from 3D scene for color customizer (ensures ID consistency)
  const rooms = analyzedRooms.length > 0 ? analyzedRooms : (floorPlanData?.rooms || []);
  
  const handleRoomsAnalyzed = useCallback((rooms) => {
    setAnalyzedRooms(rooms);
  }, []);
  
  const handleDoorsAnalyzed = useCallback((doors) => {
    setAnalyzedDoors(doors);
  }, []);
  
  // Handle empty or invalid data
  if (!floorPlanData) {
    console.warn('No floor plan data provided to FloorPlan3D');
  }
  
  const handleColorsChange = (newColors, newRoomColors = {}, newDoorColors = {}) => {
    setCustomColors(newColors);
    setRoomColors(newRoomColors);
    setDoorColors(newDoorColors);
  };
  
  // Save state to localStorage
  const saveState = useCallback(() => {
    try {
      const stateToSave = {
        viewMode,
        autoRotate,
        customColors,
        roomColors,
        doorColors,
        sun: sunSettings,
        timestamp: Date.now()
      };
      localStorage.setItem(saveKey, JSON.stringify(stateToSave));
      return true;
    } catch (error) {
      console.error('Failed to save 3D state:', error);
      return false;
    }
  }, [saveKey, viewMode, autoRotate, customColors, roomColors, doorColors, sunSettings]);

  const handleSaveProgress = useCallback(() => {
    const success = saveState();
    if (!success) return;

    setSaveFeedback('saved');
    window.setTimeout(() => setSaveFeedback('idle'), 2000);
  }, [saveState]);
  
  // Auto-save whenever state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveState();
    }, 1000); // Debounce saves by 1 second
    
    return () => clearTimeout(timeoutId);
  }, [customColors, roomColors, doorColors, viewMode, autoRotate, sunSettings, saveState]);
  
  return (
    <div className={`flex h-full ${className}`}>
      {/* Left Sidebar - Color Customizer */}
      <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>🎨</span>
              <span>Customize Colors</span>
            </h3>
          </div>
          
          {/* Inline Color Customizer Content */}
          <div className="space-y-4">
            {/* Color presets */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Quick Presets</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { name: 'Modern', colors: { walls: '#FAFAFA', windows: '#87CEEB', ground: '#90EE90', foundation: '#D3D3D3', doors: '#8B4513' } },
                  { name: 'Warm', colors: { walls: '#F5DEB3', windows: '#4682B4', ground: '#98D8C8', foundation: '#C4A582', doors: '#8B6914' } },
                  { name: 'Cool', colors: { walls: '#E0E0E0', windows: '#5F9EA0', ground: '#8FBC8F', foundation: '#A9A9A9', doors: '#696969' } },
                  { name: 'Cream', colors: { walls: '#FFF8DC', windows: '#6495ED', ground: '#7CFC00', foundation: '#DEB887', doors: '#D2691E' } },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleColorsChange(preset.colors, roomColors, doorColors)}
                    className="px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual color controls */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Element Colors</div>
              {[
                { key: 'walls', label: 'Walls', emoji: '🧱' },
                { key: 'windows', label: 'Windows', emoji: '🪟' },
                { key: 'doors', label: 'Doors', emoji: '🚪' },
                { key: 'ground', label: 'Ground', emoji: '🌿' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{item.emoji} {item.label}</span>
                  <input
                    type="color"
                    value={customColors[item.key] || '#FFFFFF'}
                    onChange={(e) => handleColorsChange({ ...customColors, [item.key]: e.target.value }, roomColors, doorColors)}
                    className="w-8 h-6 rounded border border-gray-200 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* Room-specific colors */}
            {rooms.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">Room Colors</div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 truncate max-w-24">{room.name || room.type || `Room ${room.id}`}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={roomColors[String(room.id)] || customColors.walls || '#FAFAFA'}
                          onChange={(e) => {
                            const newRoomColors = { ...roomColors, [String(room.id)]: e.target.value };
                            handleColorsChange(customColors, newRoomColors, doorColors);
                          }}
                          className="w-6 h-5 rounded border border-gray-200 cursor-pointer"
                        />
                        {roomColors[String(room.id)] && (
                          <button
                            onClick={() => {
                              const newRoomColors = { ...roomColors, [String(room.id)]: null };
                              handleColorsChange(customColors, newRoomColors, doorColors);
                            }}
                            className="text-[10px] text-slate-400 hover:text-red-500"
                            title="Reset"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center - 3D Canvas */}
      <div className="flex-1 relative min-w-0 bg-sky-200">
        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-white/85 backdrop-blur-md border border-gray-200 rounded-lg px-2 py-1 shadow-md">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-900">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span>3D rendering</span>
            </div>
          </div>
        </div>

        {viewMode === 'walk' && (
          <div className="absolute top-3 left-28 z-10">
            <div className="bg-amber-100 border border-amber-300 rounded-lg px-2 py-1 text-[10px] text-amber-800 font-medium">
              WASD + mouse to navigate
            </div>
          </div>
        )}

        {/* Walk mode click indicator */}
        {viewMode === 'walk' && (
          <div 
            className="absolute inset-0 z-0 cursor-crosshair"
            onClick={() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                canvas.focus();
                if (canvas.requestPointerLock) {
                  canvas.requestPointerLock();
                }
              }
            }}
          />
        )}

        {/* Enhanced 3D Canvas with optimized camera settings */}
        <Canvas
          shadows
          dpr={[1, 1.5]}
          frameloop="always"
          flat
          gl={{ 
            antialias: true, 
            powerPreference: 'high-performance', 
            preserveDrawingBuffer: true,
            alpha: false,
            stencil: false,
            depth: true
          }}
          camera={{ 
            position: [25, 18, 25], // Better initial positioning for architectural overview
            fov: 55, // Slightly tighter field of view for better perspective
            near: 0.1, 
            far: 1000 
          }}
          className="w-full h-full"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          tabIndex={0} // Make canvas focusable
        onCreated={({ scene, gl, camera }) => {
          // Enhanced scene settings for better visual quality
          scene.fog = new THREE.Fog('#87CEEB', 20, 150); // Extended fog range
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05; // Slightly adjusted exposure

          // Ensure correct color output (Three r152+ uses outputColorSpace)
          gl.outputColorSpace = THREE.SRGBColorSpace;

          // Prefer physically-correct lighting model when available
          if ('useLegacyLights' in gl) {
            gl.useLegacyLights = false;
          }
          
          // Focus the canvas for keyboard input
          const canvas = gl.domElement;
          canvas.focus();
          canvas.setAttribute('tabindex', '0');
        }}
        onPointerDown={() => {
          // Ensure canvas is focused when clicked
          const canvas = document.querySelector('canvas');
          if (canvas) {
            canvas.focus();
          }
        }}
      >
        <color attach="background" args={['#87CEEB']} />
        
        <Suspense fallback={<LoadingSpinner3D />}>
          <SoftShadows size={15} samples={16} focus={0.5} />
          <Environment preset="apartment" background={false} intensity={0.75} blur={0.25} />
          <FloorPlan3DScene 
            floorPlanData={floorPlanData} 
            mode={viewMode} 
            autoRotate={autoRotate} 
            customColors={customColors} 
            roomColors={roomColors}
            doorColors={doorColors}
            onRoomsAnalyzed={handleRoomsAnalyzed}
            onDoorsAnalyzed={handleDoorsAnalyzed}
            sunSettings={sunSettings}
          />

          {/* Subtle grounding shadows for a more realistic â€œanchoredâ€ look */}
          <ContactShadows
            position={[0, -0.04, 0]}
            opacity={0.3}
            scale={85}
            blur={2.5}
            far={55}
            resolution={512}
            frames={Infinity}
          />

          {ENABLE_POSTPROCESSING && (
            <EffectComposer multisampling={4} disableNormalPass>
              <Bloom
                intensity={0.2}
                luminanceThreshold={0.9}
                luminanceSmoothing={0.3}
                mipmapBlur
              />
              <Vignette eskil={false} offset={0.1} darkness={0.85} />
            </EffectComposer>
          )}
        </Suspense>
        </Canvas>
      </div>

      {/* Right Sidebar - View Controls */}
      <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-4">🎮 View Controls</h3>
          
          {/* View Mode */}
          <div className="space-y-3">
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('overview')}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                  viewMode === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('walk')}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                  viewMode === 'walk'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Walk
              </button>
            </div>

            {viewMode === 'overview' && (
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`w-full rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                  autoRotate
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ↻ Auto-rotate {autoRotate ? 'ON' : 'OFF'}
              </button>
            )}

            <button
              onClick={handleSaveProgress}
              className={`w-full rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                saveFeedback === 'saved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {saveFeedback === 'saved' ? '✓ Saved' : '💾 Save Progress'}
            </button>
          </div>

          {/* Sun Settings */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-bold text-slate-900 mb-3">☀️ Sun / Lighting</h4>
            
            {/* Sun Toggle + Presets */}
            <div className="flex items-center gap-1.5 mb-3">
              <button
                onClick={() => setSunEnabled(!sunEnabled)}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  sunEnabled
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {sunEnabled ? 'ON' : 'OFF'}
              </button>
              <div className="flex-1 flex gap-0.5">
                {['morning', 'noon', 'afternoon', 'evening'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    className={`flex-1 px-1 py-1 rounded text-[9px] font-medium ${
                      sunPreset === preset
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Position X/Y/Z */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              {[
                { label: 'X', value: sunPosX, setter: setSunPosX },
                { label: 'Y', value: sunPosY, setter: setSunPosY },
                { label: 'Z', value: sunPosZ, setter: setSunPosZ },
              ].map((axis) => (
                <label key={axis.label} className="text-[10px] text-slate-600">
                  {axis.label}
                  <input
                    type="number"
                    step="1"
                    value={axis.value}
                    onChange={(e) => { axis.setter(Number(e.target.value)); setSunPreset('custom'); }}
                    className="w-full rounded border border-gray-200 px-1.5 py-0.5 text-xs"
                  />
                </label>
              ))}
            </div>

            {/* Brightness */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Brightness</span>
                <span>{sunBrightness.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.1}
                value={sunBrightness}
                onChange={(e) => setSunBrightness(Number(e.target.value))}
                className="w-full h-1.5 accent-amber-500"
              />
            </div>

            {/* Shadow Strength */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Shadow</span>
                <span>{Math.round(sunShadowStrength * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sunShadowStrength}
                onChange={(e) => setSunShadowStrength(Number(e.target.value))}
                className="w-full h-1.5 accent-slate-600"
              />
            </div>

            {/* Color Temp */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Temp</span>
                <span>{sunColorTemp}K</span>
              </div>
              <input
                type="range"
                min={2000}
                max={8000}
                step={100}
                value={sunColorTemp}
                onChange={(e) => setSunColorTemp(Number(e.target.value))}
                className="w-full h-1.5"
                style={{ background: 'linear-gradient(to right, #FF8C00, #FFD700, #FFFACD, #ADD8E6)' }}
              />
            </div>

            {/* Shadow Quality + Reset */}
            <div className="flex items-center gap-2">
              <select
                value={sunShadowQuality}
                onChange={(e) => setSunShadowQuality(e.target.value)}
                className="flex-1 text-[10px] rounded border border-gray-200 px-1.5 py-1 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="ultra">Ultra</option>
              </select>
              <button
                onClick={() => applyPreset('noon')}
                className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlan3D;
