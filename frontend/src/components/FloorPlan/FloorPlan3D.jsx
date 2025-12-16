import React, { Suspense, useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Text,
  PointerLockControls
} from '@react-three/drei';
import * as THREE from 'three';

// Enhanced Door Component with bi-directional visibility and proper wall penetration
const Door3D = memo(({ position, rotation = [0, 0, 0], width = 0.9, height = 2.1, isOpen = false, onToggle, playerPosition, autoOpen = true, wallThickness = 0.2 }) => {
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);
  const doorRef = useRef();
  const frameRef = useRef();
  const [proximityOpen, setProximityOpen] = useState(false);
  const [openAngle, setOpenAngle] = useState(0);
  
  // Enhanced auto-open settings for better user experience
  const openDistance = 1.5; // Closer proximity for more natural feel
  const closeDistance = 2.5; // Larger close distance to prevent flickering
  
  // Memoized materials to prevent unnecessary re-creation and improve performance
  const materials = useMemo(() => ({
    frame: { color: "#8B4513", roughness: 0.6 },
    panel: { color: "#8B4513", roughness: 0.8, metalness: 0.1 },
    handle: { color: "#FFD700", roughness: 0.3, metalness: 0.8 },
    threshold: { color: "#A0522D", roughness: 0.8 },
    shadow: { color: "#654321", roughness: 0.95, transparent: true, opacity: 0.8 },
    indicator: { color: "#00FF7F", transparent: true, opacity: 0.6 }
  }), []);
  
  // Smooth door animation with useFrame
  useFrame((state, delta) => {
    if (autoOpen && playerPosition && position) {
      const doorPos = new THREE.Vector3(...position);
      const playerPos = new THREE.Vector3(...playerPosition);
      const distance = doorPos.distanceTo(playerPos);
      
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
    const targetAngle = localIsOpen ? Math.PI * 0.4 : 0; // 72 degrees when open
    const newAngle = THREE.MathUtils.lerp(openAngle, targetAngle, delta * 8);
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
const Window3D = memo(({ position, rotation = [0, 0, 0], width = 1.2, height = 1.0, roomType = 'default' }) => {
  const frameThickness = 0.08; // Reduced frame thickness to prevent wall overlap
  const glassThickness = 0.01; // Thinner glass to prevent z-fighting
  const frameDepth = 0.06; // Slightly thinner than wall to prevent flickering
  
  // Enhanced window positioning with consistent proportions
  const windowBottomHeight = 0.9; // Distance from floor to bottom of window
  const windowCenterY = windowBottomHeight + height / 2; // Center Y position
  
  // Room-type specific styling with stable colors - memoized for performance
  const styling = useMemo(() => {
    const getWindowStyling = (roomType) => {
      const type = roomType.toLowerCase();
      
      if (type.includes('living') || type.includes('drawing')) {
        return {
          frameColor: "#2C3E50", // Stable dark frame
          glassColor: "#FFFFE0", // Light yellow for main rooms
          glassOpacity: 0.15, // Reduced opacity to prevent flickering
          dividerColor: "#34495E"
        };
      } else if (type.includes('bedroom')) {
        return {
          frameColor: "#2C3E50", // Consistent frame color
          glassColor: "#FFFFE0", // Light yellow for bedrooms
          glassOpacity: 0.15,
          dividerColor: "#34495E"
        };
      } else if (type.includes('kitchen')) {
        return {
          frameColor: "#2C3E50", // Consistent frame color
          glassColor: "#FFFFE0", // Light yellow for kitchen
          glassOpacity: 0.15,
          dividerColor: "#34495E"
        };
      } else {
        return {
          frameColor: "#2C3E50", // Default consistent frame
          glassColor: "#FFFFE0", // Light yellow default
          glassOpacity: 0.15,
          dividerColor: "#34495E"
        };
      }
    };
    
    return getWindowStyling(roomType);
  }, [roomType]);
  
  return (
    <group position={position} rotation={rotation}>
      {/* Window Frame - Stable positioning to prevent flickering */}
      <mesh position={[0, windowCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + frameThickness, height + frameThickness, frameDepth]} />
        <meshStandardMaterial 
          color={styling.frameColor}
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Window Glass - Positioned to prevent z-fighting */}
      <mesh position={[0, windowCenterY, 0.001]}> {/* Slight offset to prevent z-fighting */}
        <boxGeometry args={[width - 0.02, height - 0.02, glassThickness]} />
        <meshStandardMaterial 
          color={styling.glassColor}
          transparent 
          opacity={styling.glassOpacity}
          roughness={0.0}
          metalness={0.0}
          envMapIntensity={0.8} // Reduced to prevent excessive reflection
          depthWrite={false} // Prevent depth issues with transparency
        />
      </mesh>
      
      {/* Vertical Window Divider - Stable positioning */}
      <mesh position={[0, windowCenterY, frameDepth/4]} castShadow>
        <boxGeometry args={[0.02, height * 0.9, 0.02]} />
        <meshStandardMaterial 
          color={styling.dividerColor}
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Horizontal Window Divider - Stable positioning */}
      <mesh position={[0, windowCenterY, frameDepth/4]} castShadow>
        <boxGeometry args={[width * 0.9, 0.02, 0.02]} />
        <meshStandardMaterial 
          color={styling.dividerColor}
          roughness={0.3} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Window Sill - Properly proportioned */}
      <mesh position={[0, windowBottomHeight - 0.04, frameDepth/3]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.08, 0.06, frameDepth + 0.02]} />
        <meshStandardMaterial 
          color="#BDC3C7" // Light gray for window sill
          roughness={0.5}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
});

// Enhanced door placement system with precise wall boundary positioning for bi-directional visibility
const generateSmartDoors = (rooms, bounds, detectedDoors = []) => {
  const doors = [];
  const doorWidth = 0.9;
  const doorHeight = 2.1;
  
  // Early return if no rooms to prevent unnecessary processing
  if (!rooms || rooms.length === 0) {
    console.log('🚪 No rooms available for door generation');
    return doors;
  }
  
  // Early return if bounds are invalid
  if (!bounds || typeof bounds.minX === 'undefined') {
    console.log('🚪 Invalid bounds for door generation');
    return doors;
  }
  
  console.log('🚪 Enhanced door generation with detected doors:', detectedDoors.length);
  console.log('🏠 Rooms available:', rooms.map(r => ({ id: r.id, name: r.name, type: r.type })));
  console.log('📏 Bounds:', bounds);
  
  // Process detected doors from the 2D floor plan with enhanced boundary detection
  detectedDoors.forEach((detectedDoor, index) => {
    const world = convertToWorld3D(detectedDoor.x, detectedDoor.y, detectedDoor.width, detectedDoor.height, bounds);
    const doorCenterX = world.x + world.width / 2;
    const doorCenterZ = world.z + world.height / 2;
    
    // Find ALL rooms this door connects with enhanced detection
    const connectedRooms = [];
    const tolerance = 0.8;
    
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
    
    console.log(`🚪 Door ${index} connects ${connectedRooms.length} rooms:`, 
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
        
        // Determine wall orientation and set exact boundary position
        if (connectedRooms[0].wall === 'north' || connectedRooms[0].wall === 'south') {
          // Horizontal wall - door spans in X direction
          if (connectedRooms[0].wall === 'north') {
            globalDoorZ = room1World.z; // Exact north wall position
          } else {
            globalDoorZ = room1World.z + room1World.height; // Exact south wall position
          }
          doorRotation = [0, 0, 0]; // Door faces north/south
        } else {
          // Vertical wall - door spans in Z direction  
          if (connectedRooms[0].wall === 'east') {
            globalDoorX = room1World.x + room1World.width; // Exact east wall position
          } else {
            globalDoorX = room1World.x; // Exact west wall position
          }
          doorRotation = [0, Math.PI/2, 0]; // Door faces east/west
        }
      } else {
        // Single room door - position at room boundary
        const roomWorld = convertToWorld3D(connectedRooms[0].room.x, connectedRooms[0].room.y, 
                                         connectedRooms[0].room.width, connectedRooms[0].room.height, bounds);
        
        // Position at the closest room boundary
        if (connectedRooms[0].wall === 'north') {
          globalDoorZ = roomWorld.z;
          doorRotation = [0, 0, 0];
        } else if (connectedRooms[0].wall === 'south') {
          globalDoorZ = roomWorld.z + roomWorld.height;
          doorRotation = [0, Math.PI, 0];
        } else if (connectedRooms[0].wall === 'east') {
          globalDoorX = roomWorld.x + roomWorld.width;
          doorRotation = [0, -Math.PI/2, 0];
        } else if (connectedRooms[0].wall === 'west') {
          globalDoorX = roomWorld.x;
          doorRotation = [0, Math.PI/2, 0];
        }
      }
      
      // Create a single door that's visible from all connected rooms
      const doorId = `detected-door-${index}`;
      const connectedRoomIds = connectedRooms.map(cr => cr.room.id);
      
      doors.push({
        id: doorId,
        globalPosition: [globalDoorX, 0, globalDoorZ], // Exact wall boundary position
        connectedRooms: connectedRoomIds,
        connectedRoomData: connectedRooms,
        width: Math.max(0.6, Math.min(detectedDoor.width / 100, 1.2)),
        height: doorHeight,
        type: connectedRooms.length > 1 ? 'interior' : 'exterior',
        isOpen: false,
        rotation: doorRotation, // Store rotation for proper wall alignment
        onToggle: null,
        // Enhanced room positioning for better wall cutouts
        roomPositions: connectedRooms.map(cr => ({
          roomId: cr.room.id,
          wall: cr.wall,
          wallPosition: cr.wallPosition,
          rotation: doorRotation // Use calculated rotation
        }))
      });
      
      console.log(`🚪 Created door connecting rooms: ${connectedRoomIds.join(' <-> ')}`);
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
        doors.push({
          id: `detected-door-${index}`,
          globalPosition: [doorCenterX, 0, doorCenterZ],
          connectedRooms: [closestRoom.room.id],
          width: Math.max(0.6, Math.min(detectedDoor.width / 100, 1.2)),
          height: doorHeight,
          type: 'exterior',
          isOpen: false,
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
        return [0, Math.PI, 0];  // Door faces north/south - flipped 180°
      case 'east': 
        return [0, -Math.PI/2, 0]; // Door faces east/west - 90° CCW
      case 'west': 
        return [0, Math.PI/2, 0];  // Door faces east/west - 90° CW
      default: 
        return [0, 0, 0];
    }
  }
  
  // Add main entrance door if no detected doors found
  if (doors.length === 0 && rooms.length > 0) {
    console.log('🚪 No doors detected, creating intelligent door placement');
    
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
            // Place door in the middle of the shared wall
            const doorZ = overlapStart + (overlapEnd - overlapStart) / 2;
            const doorX = Math.abs((world1.x + world1.width) - world2.x) < tolerance ? 
                         world2.x : world1.x;
            
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
            // Place door in the middle of the shared wall
            const doorX = overlapStart + (overlapEnd - overlapStart) / 2;
            const doorZ = Math.abs((world1.z + world1.height) - world2.z) < tolerance ? 
                         world2.z : world1.z;
            
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
      
      console.log(`🚪 Created smart door between ${room1.name || room1.id} and ${room2.name || room2.id}`);
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
        
        // Place entrance door on the front wall (bottom edge)
        doors.push({
          id: `entrance-door-${entryRoom.id}`,
          globalPosition: [roomWorld.x + roomWorld.width / 2, 0, roomWorld.z + roomWorld.height],
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
        
        console.log(`🚪 Created entrance door for ${entryRoom.name || entryRoom.id}`);
      }
    }
  }
  
  console.log(`🚪 Generated ${doors.length} doors total`);
  
  // Log door distribution for debugging
  const doorsByRoom = {};
  doors.forEach(door => {
    door.connectedRooms.forEach(roomId => {
      doorsByRoom[roomId] = (doorsByRoom[roomId] || 0) + 1;
    });
  });
  
  console.log(`🚪 Door distribution:`, doorsByRoom);
  return doors;
};

// Smart window placement system
const generateSmartWindows = (rooms, bounds) => {
  const windows = [];
  
  // Early return if no rooms to prevent unnecessary processing
  if (!rooms || rooms.length === 0) {
    console.log('🪟 No rooms available for window generation');
    return windows;
  }
  
  // Early return if bounds are invalid
  if (!bounds || typeof bounds.minX === 'undefined') {
    console.log('🪟 Invalid bounds for window generation');
    return windows;
  }
  
  rooms.forEach((room) => {
    const world = convertToWorld3D(room.x, room.y, room.width, room.height, bounds);
    const roomCenterX = world.x + world.width / 2;
    const roomCenterZ = world.z + world.height / 2;
    
    // Add windows based on room type and size
    const roomType = room.type?.toLowerCase() || '';
    
    if (world.width > 2 && world.height > 2) { // Only add windows to larger rooms
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
  
  console.log('🪟 Generated windows:', windows);
  return windows;
};
const analyzeFloorPlanData = (data) => {
  console.log('🔍 Analyzing floor plan data:', data);
  
  let rooms = [];
  let walls = [];
  let doors = [];
  
  // First, check for direct rooms array (from 2D editor) - prioritize this
  if (data && data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
    console.log('🏠 Found direct rooms array from 2D editor with', data.rooms.length, 'rooms');
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
      console.log(`  Processing room ${index}:`, room, '→', processedRoom);
      return processedRoom;
    });
  }
  
  // Then check if data has mapData array (genetic algorithm output)
  if (data && data.mapData && Array.isArray(data.mapData)) {
    console.log('📊 Found mapData with', data.mapData.length, 'items');
    
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
          x1: parseFloat(item.x1 || 0),
          y1: parseFloat(item.y1 || 0),
          x2: parseFloat(item.x2 || 100),
          y2: parseFloat(item.y2 || 100)
        };
        walls.push(wallData);
        console.log('🧱 Found wall:', wallData);
      } 
      // Extract door data - Enhanced to detect doors in multiple formats
      else if (item.type === 'door' || item.type === 'Door' || item.type === 'Wall') {
        // Check if this is a door (Wall type from backend but might be door)
        if (item.type === 'Wall') {
          // Skip walls, handle them separately
        } else if (item.x1 !== undefined && item.y1 !== undefined && item.x2 !== undefined && item.y2 !== undefined) {
          // Line format from mapData (x1, y1, x2, y2)
          const x = Math.min(item.x1, item.x2);
          const y = Math.min(item.y1, item.y2);
          const width = Math.abs(item.x2 - item.x1) || 30;
          const height = Math.abs(item.y2 - item.y1) || 80;
          
          doors.push({
            id: item.id || `door-${doors.length}`,
            x: parseFloat(x),
            y: parseFloat(y),
            width: Math.max(parseFloat(width), 10),
            height: Math.max(parseFloat(height), 10),
            rotation: parseFloat(item.rotation || 0),
            type: 'door'
          });
          console.log('🚪 Found door (line format):', doors[doors.length - 1]);
        } else if (item.x !== undefined && item.width !== undefined && item.height !== undefined) {
          // Rectangle format
          doors.push({
            id: item.id || `door-${doors.length}`,
            x: parseFloat(item.x || 0),
            y: parseFloat(item.y || 0),
            width: parseFloat(item.width || 30),
            height: parseFloat(item.height || 80),
            rotation: parseFloat(item.rotation || 0),
            type: 'door'
          });
          console.log('🚪 Found door (rect format):', doors[doors.length - 1]);
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
    doors = data.doors.map((door, index) => {
      // Handle both line format (x1,y1,x2,y2) and rect format (x,y,width,height)
      if (door.x1 !== undefined && door.y1 !== undefined) {
        // Line format - convert to rect format
        const x = Math.min(door.x1, door.x2);
        const y = Math.min(door.y1, door.y2);
        const width = Math.abs(door.x2 - door.x1) || 30;
        const height = Math.abs(door.y2 - door.y1) || 80;
        
        return {
          id: door.id || `door-${index}`,
          x: parseFloat(x),
          y: parseFloat(y),
          width: Math.max(parseFloat(width), 10),
          height: Math.max(parseFloat(height), 10),
          rotation: 0,
          type: 'door'
        };
      } else if (door.points && Array.isArray(door.points) && door.points.length >= 4) {
        // Points array format [x1, y1, x2, y2]
        const x = Math.min(door.points[0], door.points[2]);
        const y = Math.min(door.points[1], door.points[3]);
        const width = Math.abs(door.points[2] - door.points[0]) || 30;
        const height = Math.abs(door.points[3] - door.points[1]) || 80;
        
        return {
          id: door.id || `door-${index}`,
          x: parseFloat(x),
          y: parseFloat(y),
          width: Math.max(parseFloat(width), 10),
          height: Math.max(parseFloat(height), 10),
          rotation: 0,
          type: 'door'
        };
      } else {
        // Standard rect format
        return {
          id: door.id || `door-${index}`,
          x: parseFloat(door.x || 0),
          y: parseFloat(door.y || 0),
          width: parseFloat(door.width || 30),
          height: parseFloat(door.height || 80),
          rotation: parseFloat(door.rotation || 0),
          type: 'door'
        };
      }
    });
  }
  
  // Check for walls array (from 2D editor)
  if (data && data.walls && Array.isArray(data.walls)) {
    console.log('🧱 Using direct walls array with', data.walls.length, 'walls:', data.walls);
    walls = data.walls.map((wall, idx) => {
      if (wall.points && Array.isArray(wall.points) && wall.points.length >= 4) {
        const wallData = {
          x1: parseFloat(wall.points[0]),
          y1: parseFloat(wall.points[1]),
          x2: parseFloat(wall.points[2]),
          y2: parseFloat(wall.points[3])
        };
        console.log(`  Wall ${idx}:`, wall.points, '→', wallData);
        return wallData;
      }
      return {
        x1: parseFloat(wall.x1 || 0),
        y1: parseFloat(wall.y1 || 0),
        x2: parseFloat(wall.x2 || 0),
        y2: parseFloat(wall.y2 || 0)
      };
    });
  }
  
  // Fallback 1: check for direct rooms array (from 2D editor)
  if (rooms.length === 0 && data && data.rooms && Array.isArray(data.rooms)) {
    console.log('📋 Using direct rooms array from 2D editor with', data.rooms.length, 'rooms');
    console.log('📋 Raw rooms data:', data.rooms);
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
      console.log(`  Room ${index}:`, room, '→', processedRoom);
      return processedRoom;
    });
  }
  
  // Fallback 2: check if data is directly a rooms array
  if (rooms.length === 0 && Array.isArray(data)) {
    console.log('📋 Data is directly a rooms array');
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
    console.log('⚠️ No room data found, creating demo rooms');
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
  
  console.log('✅ Final analysis:', { rooms: rooms.length, walls: walls.length, doors: doors.length });
  console.log('🏠 Room details:', rooms);
  console.log('🧱 Wall details:', walls);
  return { rooms, walls, doors };
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
  
  console.log('📏 Calculated bounds (no padding):', bounds);
  console.log('📐 Room positions:', rooms.map(r => ({ 
    name: r.name, 
    x: r.x, 
    y: r.y, 
    width: r.width, 
    height: r.height 
  })));
  
  return bounds;
};

// Standalone Wall Component - Renders custom walls from 2D editor
const Wall3D = ({ wall, bounds }) => {
  const wallHeight = 2.7; // Match room boundary walls
  const wallThickness = 0.08; // Match room boundary walls
  
  console.log('🧱 Rendering wall:', wall, 'bounds:', bounds);
  
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
      <meshStandardMaterial color="#FAFAFA" roughness={0.8} metalness={0.0} />
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
  
  console.log('🚪 Door input data:', { x, y, rectWidth, rectHeight });
  
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
  
  console.log('🚪 SimpleDoor3D:', { 
    center: [centerX.toFixed(2), centerZ.toFixed(2)], 
    angle: (angle * 180 / Math.PI).toFixed(1) + '°',
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
const Room3D = ({ room, bounds, showLabels = true, doors = [], windows = [], walls = [] }) => {
  const roomColors = {
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
  
  const roomColor = roomColors[normalizedType] || '#F5F5F5';
  
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
      {/* Floor with exact dimensions */}
      <mesh position={[0, floorThickness/2, 0]} receiveShadow>
        <boxGeometry args={[world.width, floorThickness, world.height]} />
        <meshLambertMaterial color={roomColor} />
      </mesh>
      
      {/* Floor surface for better visibility */}
      <mesh position={[0, floorThickness + 0.01, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[world.width - 0.02, world.height - 0.02]} />
        <meshLambertMaterial color={roomColor} transparent opacity={0.9} />
      </mesh>
      
      {/* Room boundary walls - check for overlaps with custom walls */}
      {(() => {
          const wallHeight = 2.7;
          const wallThickness = 0.08;
          
          // Function to check if a custom wall overlaps with a room boundary segment
          const customWallOverlaps = (segmentStart, segmentEnd, wallType) => {
            if (walls.length === 0) return false;
            
            // Get room boundaries in world coordinates
            const roomWorldX = world.x + world.width / 2;
            const roomWorldZ = world.z + world.height / 2;
            
            // Define the room boundary wall line based on wall type
            let boundaryLine = null;
            switch (wallType) {
              case 'north':
                boundaryLine = {
                  x1: roomWorldX - world.width/2 + segmentStart,
                  z1: roomWorldZ - world.height/2,
                  x2: roomWorldX - world.width/2 + segmentEnd,
                  z2: roomWorldZ - world.height/2
                };
                break;
              case 'south':
                boundaryLine = {
                  x1: roomWorldX - world.width/2 + segmentStart,
                  z1: roomWorldZ + world.height/2,
                  x2: roomWorldX - world.width/2 + segmentEnd,
                  z2: roomWorldZ + world.height/2
                };
                break;
              case 'east':
                boundaryLine = {
                  x1: roomWorldX + world.width/2,
                  z1: roomWorldZ - world.height/2 + segmentStart,
                  x2: roomWorldX + world.width/2,
                  z2: roomWorldZ - world.height/2 + segmentEnd
                };
                break;
              case 'west':
                boundaryLine = {
                  x1: roomWorldX - world.width/2,
                  z1: roomWorldZ - world.height/2 + segmentStart,
                  x2: roomWorldX - world.width/2,
                  z2: roomWorldZ - world.height/2 + segmentEnd
                };
                break;
            }
            
            if (!boundaryLine) return false;
            
            // Check each custom wall for overlap with this boundary segment
            return walls.some(wall => {
              const wallWorld = convertToWorld3D(
                wall.x1,
                wall.y1,
                Math.abs(wall.x2 - wall.x1),
                Math.abs(wall.y2 - wall.y1),
                bounds
              );
              
              const customWallLine = {
                x1: wallWorld.x,
                z1: wallWorld.z,
                x2: wallWorld.x + (wall.x2 > wall.x1 ? wallWorld.width : -wallWorld.width),
                z2: wallWorld.z + (wall.y2 > wall.y1 ? wallWorld.height : -wallWorld.height)
              };
              
              // Calculate distance between the two line segments
              const threshold = 0.3; // 30cm overlap threshold
              
              // Simple overlap check - if lines are close and parallel
              const dx1 = boundaryLine.x2 - boundaryLine.x1;
              const dz1 = boundaryLine.z2 - boundaryLine.z1;
              const dx2 = customWallLine.x2 - customWallLine.x1;
              const dz2 = customWallLine.z2 - customWallLine.z1;
              
              // Check if lines are roughly parallel (within 15 degrees)
              const len1 = Math.sqrt(dx1*dx1 + dz1*dz1);
              const len2 = Math.sqrt(dx2*dx2 + dz2*dz2);
              if (len1 === 0 || len2 === 0) return false;
              
              const dot = (dx1*dx2 + dz1*dz2) / (len1 * len2);
              const isParallel = Math.abs(Math.abs(dot) - 1) < 0.26; // cos(15°) ≈ 0.966
              
              if (!isParallel) return false;
              
              // Check if the lines are close to each other
              const dist1 = Math.sqrt(
                Math.pow(customWallLine.x1 - boundaryLine.x1, 2) + 
                Math.pow(customWallLine.z1 - boundaryLine.z1, 2)
              );
              const dist2 = Math.sqrt(
                Math.pow(customWallLine.x2 - boundaryLine.x2, 2) + 
                Math.pow(customWallLine.z2 - boundaryLine.z2, 2)
              );
              
              return (dist1 < threshold || dist2 < threshold);
            });
          };
          
          // Function to generate wall segments avoiding door cutouts AND custom wall overlaps
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
              // Check if entire wall is overlapped by custom walls
              const fullSegment = { start: -totalLength/2, end: totalLength/2, center: 0, length: totalLength };
              if (customWallOverlaps(fullSegment.start, fullSegment.end, wallType)) {
                return []; // Hide entire wall
              }
              return [fullSegment];
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
              
              // Add segment before door if there's space AND no custom wall overlap
              if (currentPos < doorStart - 0.05) { // 5cm clearance
                if (!customWallOverlaps(currentPos, doorStart - 0.05, wallType)) {
                  const segmentCenter = (currentPos + doorStart) / 2;
                  segments.push({ 
                    start: currentPos, 
                    end: doorStart - 0.05, 
                    center: segmentCenter,
                    length: doorStart - 0.05 - currentPos
                  });
                }
              }
              
              currentPos = doorEnd + 0.05; // 5cm clearance after door
            });
            
            // Add final segment after last door if no custom wall overlap
            if (currentPos < totalLength/2) {
              if (!customWallOverlaps(currentPos, totalLength/2, wallType)) {
                const segmentCenter = (currentPos + totalLength/2) / 2;
                segments.push({ 
                  start: currentPos, 
                  end: totalLength/2, 
                  center: segmentCenter,
                  length: totalLength/2 - currentPos
                });
              }
            }
            
            return segments.filter(seg => seg.length > 0.1); // Only include segments > 10cm
          };
          
          return (
            <>
              {/* North wall segments */}
              {generateWallSegments('north', world.width).map((segment, idx) => (
                <mesh 
                  key={`north-${idx}`}
                  position={[segment.center, wallHeight/2, -world.height/2 + wallThickness/2]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[segment.length, wallHeight, wallThickness]} />
                  <meshStandardMaterial color="#FAFAFA" roughness={0.8} metalness={0.0} />
                </mesh>
              ))}
              
              {/* South wall segments */}
              {generateWallSegments('south', world.width).map((segment, idx) => (
                <mesh 
                  key={`south-${idx}`}
                  position={[segment.center, wallHeight/2, world.height/2 - wallThickness/2]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[segment.length, wallHeight, wallThickness]} />
                  <meshStandardMaterial color="#FAFAFA" roughness={0.8} metalness={0.0} />
                </mesh>
              ))}
              
              {/* East wall segments */}
              {generateWallSegments('east', world.height).map((segment, idx) => (
                <mesh 
                  key={`east-${idx}`}
                  position={[world.width/2 - wallThickness/2, wallHeight/2, segment.center]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[wallThickness, wallHeight, segment.length]} />
                  <meshStandardMaterial color="#FAFAFA" roughness={0.8} metalness={0.0} />
                </mesh>
              ))}
              
              {/* West wall segments */}
              {generateWallSegments('west', world.height).map((segment, idx) => (
                <mesh 
                  key={`west-${idx}`}
                  position={[-world.width/2 + wallThickness/2, wallHeight/2, segment.center]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[wallThickness, wallHeight, segment.length]} />
                  <meshStandardMaterial color="#FAFAFA" roughness={0.8} metalness={0.0} />
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
    </group>
  );
};

// Professional lighting setup with improved realism
const Lighting3D = () => (
  <>
    {/* Ambient light for overall illumination */}
    <ambientLight intensity={0.3} color="#F5F5F5" />
    
    {/* Main directional light (sun) with warm color */}
    <directionalLight
      position={[25, 35, 20]}
      intensity={1.2}
      color="#FFF8DC"
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-near={0.1}
      shadow-camera-far={150}
      shadow-camera-left={-40}
      shadow-camera-right={40}
      shadow-camera-top={40}
      shadow-camera-bottom={-40}
      shadow-bias={-0.0001}
    />
    
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
  const playerHeight = 1.7;
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
      
      console.log('📷 Enhanced camera positioning:', {
        buildingCenter: [worldCenterX, worldCenterZ],
        cameraPosition: [cameraX, cameraHeight, cameraZ],
        viewDistance,
        angle: angle * (180 / Math.PI) + '°'
      });
    } else if (mode === 'walk') {
      // Position camera inside the first room at human height
      if (rooms && rooms.length > 0) {
        const firstRoom = rooms[0];
        const worldScale = 25 / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1);
        const roomCenterX = (firstRoom.x + firstRoom.width / 2) * worldScale;
        const roomCenterZ = (firstRoom.y + firstRoom.height / 2) * worldScale;
        
        camera.position.set(roomCenterX, 1.7, roomCenterZ);
        camera.lookAt(roomCenterX + 1, 1.7, roomCenterZ);
      } else {
        // Fallback position
        camera.position.set(0, 1.7, 0);
        camera.lookAt(1, 1.7, 0);
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
      minPolarAngle={Math.PI / 8} // 22.5° - prevent going too low (underground view)
      maxPolarAngle={Math.PI / 2.2} // ~82° - prevent going completely overhead
      minAzimuthAngle={-Infinity} // Unlimited horizontal rotation
      maxAzimuthAngle={Infinity} // Unlimited horizontal rotation
      minDistance={viewDistance * 0.3} // Closer minimum for detail views
      maxDistance={viewDistance * 2.5} // Reasonable maximum distance
      enableDamping={true}
      dampingFactor={0.08} // Smoother damping
      rotateSpeed={0.6} // Balanced rotation speed
      zoomSpeed={0.8} // Controlled zoom speed
      panSpeed={0.5} // Gentler panning
      autoRotate={false}
      autoRotateSpeed={0.3} // Slower auto-rotate when enabled
    />
  );
};

// Main 3D Scene Component - Enhanced with doors and windows
const FloorPlan3DScene = ({ floorPlanData, mode }) => {
  const [doorStates, setDoorStates] = useState({});
  const [playerPosition, setPlayerPosition] = useState([0, 1.7, 0]);
  
  // Analyze and extract data - memoized to prevent infinite loops
  const analysisData = useMemo(() => {
    console.log('🔍 Analyzing floor plan data for 3D rendering:', floorPlanData);
    console.log('🔍 Data structure check - has rooms?:', floorPlanData?.rooms?.length || 0);
    console.log('🔍 Data structure check - has walls?:', floorPlanData?.walls?.length || 0);
    console.log('🔍 Data structure check - has doors?:', floorPlanData?.doors?.length || 0);
    console.log('🔍 Data structure check - has mapData?:', floorPlanData?.mapData?.length || 0);
    console.log('🔍 Update timestamp:', floorPlanData?._updateTimestamp);
    
    if (floorPlanData?.rooms) {
      console.log('🏠 Direct rooms data for 3D:', floorPlanData.rooms.map(r => ({ id: r.id, name: r.name, source: r.source })));
    }
    
    const result = analyzeFloorPlanData(floorPlanData);
    console.log('🎯 Analysis result - rooms for 3D:', result.rooms.length, result.rooms.map(r => ({ id: r.id, name: r.name, source: r.source })));
    return result;
  }, [floorPlanData]);
  
  const { rooms, walls, doors } = analysisData;
  
  console.log('📊 Extracted data:', { 
    rooms: rooms.length, 
    walls: walls.length, 
    doors: doors.length,
    doorsData: doors 
  });
  
  // Calculate bounds - memoized
  const bounds = useMemo(() => {
    console.log('📏 Calculating bounds for rooms:', rooms.length);
    return calculateBounds(rooms);
  }, [rooms]);
  
  // Generate smart doors and windows using detected doors from 2D plan - memoized to prevent loops
  // Always generate smart doors for room connectivity
  const smartDoors = useMemo(() => {
    console.log('🚪 Generating smart doors for', rooms.length, 'rooms, detected 2D doors:', doors.length);
    return generateSmartDoors(rooms, bounds, doors);
  }, [rooms, bounds, doors]);
  
  const smartWindows = useMemo(() => {
    console.log('🪟 Generating smart windows for', rooms.length, 'rooms');
    return generateSmartWindows(rooms, bounds);
  }, [rooms, bounds]);
  
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
  
  console.log('🏗️ Building with doors and windows:', { 
    rooms: rooms.length,
    smartDoors: smartDoors.length,
    smartWindows: smartWindows.length,
    bounds
  });
  
  return (
    <group>
      {/* Enhanced ground plane positioned correctly */}
      <mesh position={[0, -0.15, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial 
          color="#90EE90" 
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>
      
      {/* Building foundation - positioned under the actual building */}
      <mesh 
        position={[
          buildingData.worldCenter.x + buildingData.worldSize.width/2, 
          -0.08, 
          buildingData.worldCenter.z + buildingData.worldSize.height/2
        ]} 
        rotation={[-Math.PI/2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[
          buildingData.worldSize.width + 2,
          buildingData.worldSize.height + 2
        ]} />
        <meshStandardMaterial 
          color="#D3D3D3" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Render standalone custom walls from 2D editor */}
      {console.log('🔧 About to render walls:', walls?.length, walls)}
      {walls && walls.length > 0 && walls.map((wall, index) => {
        console.log(`🧱 Rendering wall ${index}:`, wall);
        return (
          <Wall3D 
            key={`custom-wall-${index}`}
            wall={wall}
            bounds={bounds}
          />
        );
      })}
      
      {/* Render doors from 2D editor - DISABLED, using smart doors instead */}
      {/* SimpleDoor3D is only for user-placed doors in customization mode */}
      {false && walls.length > 0 && console.log('🔧 About to render user doors:', doors?.length, doors)}
      {false && walls.length > 0 && doors && doors.length > 0 && doors.map((door, index) => {
        console.log(`🚪 Rendering user door ${index}:`, door);
        return (
          <SimpleDoor3D 
            key={`2d-door-${index}`}
            door={door}
            bounds={bounds}
          />
        );
      })}
      
      {/* Render rooms with doors and windows */}
      {rooms.map((room, index) => (
        <Room3D 
          key={`room-${room.id || index}`} 
          room={room} 
          bounds={bounds}
          showLabels={mode === 'overview'}
          doors={smartDoors}
          windows={smartWindows}
          walls={walls}
        />
      ))}
      
      {/* Render smart doors globally - visible from both connected rooms */}
      {smartDoors.map((door) => {
        // Use global position for doors to ensure they're visible from both sides
        const position = door.globalPosition || door.position || [0, 0, 0];
        
        // For doors connecting multiple rooms, use the first room's rotation or calculate average
        let rotation = [0, 0, 0];
        if (door.roomPositions && door.roomPositions.length > 0) {
          rotation = door.roomPositions[0].rotation;
        } else if (door.rotation) {
          rotation = door.rotation;
        }
        
        return (
          <Door3D
            key={door.id}
            position={position}
            rotation={rotation}
            width={door.width}
            height={door.height}
            isOpen={doorStates[door.id] || door.isOpen}
            onToggle={(isOpen) => handleDoorToggle(door.id, isOpen)}
            playerPosition={playerPosition}
            autoOpen={mode === 'walk'} // Only auto-open in walk mode
          />
        );
      })}
      
      <Lighting3D />
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
const FloorPlan3D = ({ floorPlanData, className = "" }) => {
  const [viewMode, setViewMode] = useState('overview');
  const [autoRotate, setAutoRotate] = useState(false);
  const [walkModeStatus, setWalkModeStatus] = useState('inactive');
  
  // Handle empty or invalid data
  if (!floorPlanData) {
    console.warn('No floor plan data provided to FloorPlan3D');
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Enhanced Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              viewMode === 'overview'
                ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-102'
            }`}
          >
            🏗️ Overview
          </button>
          <button
            onClick={() => setViewMode('walk')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              viewMode === 'walk'
                ? 'bg-green-600 text-white shadow-lg transform scale-105'
                : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-102'
            }`}
          >
            🚶 Walk Through
          </button>
        </div>
        
        {/* Auto-rotate toggle for overview mode */}
        {viewMode === 'overview' && (
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-300 ${
              autoRotate
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            🔄 Auto Rotate
          </button>
        )}
      </div>



      {/* Quality indicator */}
      <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>3D Rendering Active</span>
        </div>
        {viewMode === 'walk' && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs">Walk Mode: Try WASD Keys!</span>
            </div>
          </div>
        )}
      </div>



      {/* Walk mode trigger with enhanced visual indicator */}
      {viewMode === 'walk' && (
        <div 
          id="walk-mode-trigger" 
          className="absolute inset-0 z-0 cursor-crosshair bg-gradient-to-br from-blue-900/10 to-purple-900/10"
          title="Try WASD keys to move, Arrow keys to look around if mouse doesn't work"
          onClick={() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              canvas.focus();
              if (canvas.requestPointerLock) {
                canvas.requestPointerLock();
              }
              setWalkModeStatus('active');
            }
          }}
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 0
          }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md rounded-2xl p-10 pointer-events-none border-2 border-blue-400/40 shadow-2xl">
            <div className="text-white text-center">
              <div className="text-5xl mb-4 animate-pulse">🎮</div>
              <div className="text-xl font-bold mb-3 text-blue-200">First Person Walk-Through</div>
              <div className="text-sm font-semibold mb-3 text-yellow-200">Click anywhere to start walking</div>
              <div className="text-xs opacity-90 space-y-2 bg-black/20 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-2">
                  <span>🖱️</span><span>Mouse: Look around</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>⌨️</span><span>WASD: Walk/Move</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>⚡</span><span>Shift: Sprint/Run</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>🏃</span><span>Arrow Keys: Look (backup)</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span>🚪</span><span>Doors open automatically</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced 3D Canvas with optimized camera settings */}
      <Canvas
        shadows
        camera={{ 
          position: [25, 18, 25], // Better initial positioning for architectural overview
          fov: 55, // Slightly tighter field of view for better perspective
          near: 0.1, 
          far: 1000 
        }}
        className="w-full h-full"
        tabIndex={0} // Make canvas focusable
        onCreated={({ scene, gl, camera }) => {
          // Enhanced scene settings for better visual quality
          scene.fog = new THREE.Fog('#87CEEB', 20, 150); // Extended fog range
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1; // Slightly adjusted exposure
          
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
          <Environment preset="city" background={false} intensity={0.4} />
          <FloorPlan3DScene floorPlanData={floorPlanData} mode={viewMode} autoRotate={autoRotate} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default FloorPlan3D;