import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MATERIALS â€“ reusable PBR materials for realism
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const mat = {
  // Woods
  walnut:     { color: '#5C3317', roughness: 0.55, metalness: 0.05 },
  oak:        { color: '#C19A6B', roughness: 0.5,  metalness: 0.02 },
  darkWood:   { color: '#3B2314', roughness: 0.6,  metalness: 0.03 },
  lightWood:  { color: '#DEB887', roughness: 0.45, metalness: 0.02 },
  mahogany:   { color: '#4E1609', roughness: 0.5,  metalness: 0.04 },
  // Metals
  chrome:     { color: '#E8E8E8', roughness: 0.1,  metalness: 0.95 },
  brushedSteel: { color: '#B0B0B0', roughness: 0.35, metalness: 0.85 },
  brass:      { color: '#D4A843', roughness: 0.3,  metalness: 0.8 },
  blackMetal: { color: '#2A2A2A', roughness: 0.25, metalness: 0.9 },
  gold:       { color: '#FFD700', roughness: 0.2,  metalness: 0.9 },
  // Fabric
  fabricGray: { color: '#6B7B8D', roughness: 0.95, metalness: 0 },
  fabricNavy: { color: '#2C3E6B', roughness: 0.92, metalness: 0 },
  fabricCream:{ color: '#F5F0E1', roughness: 0.9,  metalness: 0 },
  fabricBeige:{ color: '#D2B48C', roughness: 0.9,  metalness: 0 },
  velvet:     { color: '#4A2545', roughness: 0.98, metalness: 0 },
  leather:    { color: '#6B4226', roughness: 0.7,  metalness: 0.05 },
  leatherBlk: { color: '#1A1A1A', roughness: 0.65, metalness: 0.08 },
  // Stone / ceramics
  marble:     { color: '#F0EDE5', roughness: 0.15, metalness: 0.05 },
  granite:    { color: '#707070', roughness: 0.35, metalness: 0.1 },
  ceramic:    { color: '#F8F6F0', roughness: 0.2,  metalness: 0.05 },
  ceramicBlue:{ color: '#A8C8E8', roughness: 0.2,  metalness: 0.05 },
  tile:       { color: '#E0DDD5', roughness: 0.3,  metalness: 0.05 },
  // Glass / screen
  glass:      { color: '#C8E8F8', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 },
  mirror:     { color: '#E8EEF2', roughness: 0.02, metalness: 0.98 },
  screenOff:  { color: '#0A0A0A', roughness: 0.1,  metalness: 0.3 },
  screenOn:   { color: '#1A2A40', roughness: 0.1,  metalness: 0.2, emissive: '#0A1520', emissiveIntensity: 0.3 },
  // Misc
  carpet:     { color: '#8B7D6B', roughness: 1.0,  metalness: 0 },
  rubber:     { color: '#1A1A1A', roughness: 0.85, metalness: 0 },
  white:      { color: '#FAFAFA', roughness: 0.4,  metalness: 0.02 },
  pillow:     { color: '#E8DDD0', roughness: 0.95, metalness: 0 },
  pillowAccent:{ color: '#B85C38', roughness: 0.92, metalness: 0 },
  bedSheet:   { color: '#F5F5F5', roughness: 0.85, metalness: 0 },
  blanket:    { color: '#4A6741', roughness: 0.9,  metalness: 0 },
  plant:      { color: '#2D6B30', roughness: 0.8,  metalness: 0 },
  plantDark:  { color: '#1B4D1E', roughness: 0.85, metalness: 0 },
  soil:       { color: '#4A3728', roughness: 0.95, metalness: 0 },
  terracotta: { color: '#C45A3C', roughness: 0.75, metalness: 0.02 },
  carBody:    { color: '#2C3E50', roughness: 0.3,  metalness: 0.7 },
  carWindow:  { color: '#1A3050', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.6 },
  tire:       { color: '#1C1C1C', roughness: 0.9,  metalness: 0 },
  hubcap:     { color: '#C0C0C0', roughness: 0.15, metalness: 0.95 },
  waterBlue:  { color: '#5BA3D9', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.5 },
  // Modern Low-Poly Kitchen Materials (flat matte colors)
  kitchenWhite:   { color: '#F5F5F5', roughness: 0.85, metalness: 0 },
  kitchenGray:    { color: '#E8E8E8', roughness: 0.8, metalness: 0 },
  kitchenDark:    { color: '#3A3A3C', roughness: 0.75, metalness: 0 },
  kitchenWood:    { color: '#C4A77D', roughness: 0.9, metalness: 0 },
  kitchenMint:    { color: '#98D4BB', roughness: 0.85, metalness: 0 },
  kitchenPeach:   { color: '#FFCBA4', roughness: 0.85, metalness: 0 },
  kitchenBlue:    { color: '#7FB3D5', roughness: 0.85, metalness: 0 },
  kitchenCounter: { color: '#F0ECE3', roughness: 0.7, metalness: 0.02 },
  kitchenSteel:   { color: '#C8C8C8', roughness: 0.6, metalness: 0.15 },
  kitchenHandle:  { color: '#B8B8B8', roughness: 0.5, metalness: 0.3 },
  kitchenSink:    { color: '#D0D0D0', roughness: 0.4, metalness: 0.25 },
  kitchenBlack:   { color: '#2C2C2E', roughness: 0.75, metalness: 0.05 },
  // â”€â”€ Updated kitchen materials to match target design â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  darkWalnutWood:    { color: '#2C1A0E', roughness: 0.7,  metalness: 0.1  }, // Dining table & chair frame (Dark Walnut/Black Oak)
  tanLeather:        { color: '#caa472', roughness: 0.4,  metalness: 0.05 }, // Chair cushions (Tan/Beige Leather)
  matteGrayUpper:    { color: '#cfcfcf', roughness: 0.8,  metalness: 0    }, // Upper kitchen cabinets (Matte Grey Laminate)
  darkWalnutCabinet: { color: '#5C2E0A', roughness: 0.75, metalness: 0.05 }, // Lower kitchen cabinets (Dark Walnut Wood)
  oakCountertop:     { color: '#C8A96E', roughness: 0.6,  metalness: 0    }, // Kitchen countertop (Oak/Butcher Block)
  glossyBlackFridge: { color: '#111111', roughness: 0.25, metalness: 0.8  }, // Refrigerator (Glossy Black Metal)
};

const M = (props) => <meshStandardMaterial {...props} />;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPER â€“ small repeated sub-shapes
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const Leg = ({ position, height = 0.12, radius = 0.025, material = mat.blackMetal }) => (
  <mesh position={position} castShadow>
    <cylinderGeometry args={[radius, radius, height, 8]} />
    <M {...material} />
  </mesh>
);

const BoxPart = ({ position, args, material, rotation }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={args} />
    <M {...material} />
  </mesh>
);

const CylPart = ({ position, args, material, rotation }) => (
  <mesh position={position} rotation={rotation} castShadow>
    <cylinderGeometry args={args} />
    <M {...material} />
  </mesh>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LIVING / DRAWING ROOM FURNITURE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const Sofa = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Frame base */}
    <BoxPart position={[0, 0.12, 0]}   args={[2.3, 0.08, 1.0]} material={mat.darkWood} />
    {/* Legs */}
    {[[-1.0, 0.04, 0.38], [1.0, 0.04, 0.38], [-1.0, 0.04, -0.38], [1.0, 0.04, -0.38]].map((p, i) =>
      <Leg key={i} position={p} height={0.08} radius={0.03} material={mat.blackMetal} />
    )}
    {/* Seat cushions (3 sections) */}
    {[-0.72, 0, 0.72].map((x, i) => (
      <mesh key={`seat-${i}`} position={[x, 0.26, 0.05]} castShadow>
        <boxGeometry args={[0.68, 0.18, 0.85]} />
        <M {...mat.fabricNavy} />
      </mesh>
    ))}
    {/* Back cushions (3) */}
    {[-0.72, 0, 0.72].map((x, i) => (
      <mesh key={`back-${i}`} position={[x, 0.52, -0.36]} castShadow>
        <boxGeometry args={[0.65, 0.35, 0.22]} />
        <M {...mat.fabricNavy} />
      </mesh>
    ))}
    {/* Backrest frame */}
    <BoxPart position={[0, 0.45, -0.48]} args={[2.3, 0.7, 0.08]} material={mat.darkWood} />
    {/* Armrests */}
    <BoxPart position={[-1.12, 0.35, 0]}  args={[0.12, 0.45, 1.0]} material={mat.fabricNavy} />
    <BoxPart position={[1.12, 0.35, 0]}   args={[0.12, 0.45, 1.0]} material={mat.fabricNavy} />
    {/* Armrest tops (rounded) */}
    <CylPart position={[-1.12, 0.58, 0]}  args={[0.06, 0.06, 1.0, 8]} rotation={[Math.PI/2, 0, 0]} material={mat.fabricNavy} />
    <CylPart position={[1.12, 0.58, 0]}   args={[0.06, 0.06, 1.0, 8]} rotation={[Math.PI/2, 0, 0]} material={mat.fabricNavy} />
    {/* Accent pillows */}
    <mesh position={[-0.85, 0.42, 0.15]} rotation={[0, 0, 0.2]} castShadow>
      <boxGeometry args={[0.28, 0.28, 0.08]} />
      <M {...mat.pillowAccent} />
    </mesh>
    <mesh position={[0.85, 0.42, 0.15]} rotation={[0, 0, -0.2]} castShadow>
      <boxGeometry args={[0.28, 0.28, 0.08]} />
      <M {...mat.pillow} />
    </mesh>
  </group>
);

const CoffeeTable = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Glass top */}
    <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.1, 0.025, 0.65]} />
      <M {...mat.glass} />
    </mesh>
    {/* Lower wooden shelf */}
    <BoxPart position={[0, 0.12, 0]} args={[0.95, 0.03, 0.55]} material={mat.walnut} />
    {/* Metal frame legs  */}
    {[[-0.45, 0.16, 0.25], [0.45, 0.16, 0.25], [-0.45, 0.16, -0.25], [0.45, 0.16, -0.25]].map((p, i) =>
      <Leg key={i} position={p} height={0.32} radius={0.018} material={mat.brass} />
    )}
    {/* Decorative items on top */}
    <CylPart position={[-0.3, 0.38, 0]} args={[0.06, 0.04, 0.1, 8]} material={mat.ceramic} />
    <mesh position={[0.25, 0.38, 0.1]} castShadow>
      <boxGeometry args={[0.2, 0.03, 0.14]} />
      <M {...mat.leather} />
    </mesh>
  </group>
);

const TVUnit = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* TV Cabinet */}
    <BoxPart position={[0, 0.22, 0]}      args={[2.0, 0.42, 0.45]} material={mat.walnut} />
    {/* Cabinet doors - left & right */}
    <BoxPart position={[-0.5, 0.22, 0.23]} args={[0.95, 0.38, 0.02]} material={mat.darkWood} />
    <BoxPart position={[0.5, 0.22, 0.23]}  args={[0.95, 0.38, 0.02]} material={mat.darkWood} />
    {/* Handles */}
    <CylPart position={[-0.05, 0.22, 0.25]} args={[0.01, 0.01, 0.08, 6]} rotation={[0, 0, Math.PI/2]} material={mat.brass} />
    <CylPart position={[0.05, 0.22, 0.25]}  args={[0.01, 0.01, 0.08, 6]} rotation={[0, 0, Math.PI/2]} material={mat.brass} />
    {/* TV legs on cabinet */}
    <BoxPart position={[-0.2, 0.46, 0]}    args={[0.04, 0.04, 0.2]} material={mat.blackMetal} />
    <BoxPart position={[0.2, 0.46, 0]}     args={[0.04, 0.04, 0.2]} material={mat.blackMetal} />
    {/* TV Panel */}
    <BoxPart position={[0, 0.92, 0]}       args={[1.6, 0.9, 0.06]} material={mat.screenOff} />
    {/* TV bezel */}
    <BoxPart position={[0, 0.92, 0.032]}   args={[1.64, 0.94, 0.005]} material={mat.blackMetal} />
    {/* Screen reflection strip */}
    <mesh position={[0, 0.92, 0.035]} castShadow>
      <boxGeometry args={[1.52, 0.82, 0.002]} />
      <M {...mat.screenOn} />
    </mesh>
    {/* Soundbar */}
    <mesh position={[0, 0.44, 0.15]} castShadow>
      <boxGeometry args={[1.2, 0.06, 0.08]} />
      <M {...mat.blackMetal} />
    </mesh>
    {/* Decorative speaker grilles */}
    {[-0.4, -0.13, 0.13, 0.4].map((x, i) => (
      <mesh key={i} position={[x, 0.44, 0.193]} castShadow>
        <circleGeometry args={[0.015, 8]} />
        <M color="#333" roughness={0.5} metalness={0.3} />
      </mesh>
    ))}
  </group>
);

const Bookshelf = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main frame â€“ back panel */}
    <BoxPart position={[0, 0.9, -0.13]} args={[0.9, 1.8, 0.03]} material={mat.mahogany} />
    {/* Side panels */}
    <BoxPart position={[-0.44, 0.9, 0]}  args={[0.03, 1.8, 0.3]} material={mat.walnut} />
    <BoxPart position={[0.44, 0.9, 0]}   args={[0.03, 1.8, 0.3]} material={mat.walnut} />
    {/* Shelves */}
    {[0.02, 0.38, 0.74, 1.1, 1.46, 1.8].map(y => (
      <BoxPart key={y} position={[0, y, 0]} args={[0.85, 0.03, 0.3]} material={mat.walnut} />
    ))}
    {/* Books on shelves (colored blocks) */}
    {[
      { y: 0.18, colors: ['#B83232','#2E5090','#2D7D46','#D4A843','#6B3FA0'], x: -0.3 },
      { y: 0.55, colors: ['#C0392B','#8E44AD','#2980B9','#27AE60'], x: -0.25 },
      { y: 0.92, colors: ['#E67E22','#1ABC9C','#3498DB','#9B59B6','#E74C3C'], x: -0.3 },
      { y: 1.28, colors: ['#16A085','#F39C12','#D35400'], x: -0.18 },
      { y: 1.64, colors: ['#2C3E50','#7F8C8D','#C0392B','#2980B9'], x: -0.25 },
    ].map((shelf, si) =>
      shelf.colors.map((c, bi) => (
        <mesh key={`${si}-${bi}`} position={[shelf.x + bi * 0.14, shelf.y, 0.02]} castShadow>
          <boxGeometry args={[0.08 + Math.random() * 0.04, 0.22 + Math.random() * 0.1, 0.18]} />
          <M color={c} roughness={0.7} metalness={0} />
        </mesh>
      ))
    )}
  </group>
);

const FloorLamp = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Base plate */}
    <CylPart position={[0, 0.02, 0]}  args={[0.15, 0.15, 0.04, 12]} material={mat.brushedSteel} />
    {/* Pole sections */}
    <CylPart position={[0, 0.5, 0]}   args={[0.018, 0.018, 1.0, 8]} material={mat.brushedSteel} />
    <CylPart position={[0, 0.95, 0]}  args={[0.022, 0.022, 0.08, 8]} material={mat.brass} />
    {/* Lamp shade â€“ cone */}
    <mesh position={[0, 1.1, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.2, 0.28, 12, 1, true]} />
      <M {...mat.fabricCream} side={THREE.DoubleSide} />
    </mesh>
    {/* Shade top cap */}
    <CylPart position={[0, 1.24, 0]} args={[0.065, 0.065, 0.01, 12]} material={mat.brass} />
    {/* Warm light glow */}
    <pointLight position={[0, 1.05, 0]} intensity={0.3} distance={2.5} color="#FFE4B5" />
  </group>
);

const Rug = ({ position, rotation = [0, 0, 0], scale = 1, color = '#8B7D6B' }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0, 0.005, 0]} receiveShadow>
      <boxGeometry args={[2.4, 0.01, 1.6]} />
      <M color={color} roughness={1} metalness={0} />
    </mesh>
    {/* Border stripe */}
    <mesh position={[0, 0.008, 0]} receiveShadow>
      <boxGeometry args={[2.2, 0.005, 1.4]} />
      <M color="#6B5B4B" roughness={1} metalness={0} />
    </mesh>
    {/* Inner border */}
    <mesh position={[0, 0.01, 0]} receiveShadow>
      <boxGeometry args={[2.0, 0.005, 1.2]} />
      <M color={color} roughness={1} metalness={0} />
    </mesh>
  </group>
);

const WallArt = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Frame - Light Brown Oak Wood */}
    <BoxPart position={[0, 0, 0]} args={[0.8, 0.6, 0.03]} material={mat.oak} />
    {/* Canvas - Glossy painting surface */}
    <mesh position={[0, 0, 0.018]}>
      <boxGeometry args={[0.7, 0.5, 0.005]} />
      <M color="#E8D5B7" roughness={0.2} metalness={0.05} />
    </mesh>
    {/* Abstract paint strokes */}
    <mesh position={[-0.12, 0.05, 0.022]}>
      <boxGeometry args={[0.25, 0.15, 0.003]} />
      <M color="#4A90A4" roughness={0.7} metalness={0} />
    </mesh>
    <mesh position={[0.15, -0.08, 0.022]}>
      <boxGeometry args={[0.18, 0.12, 0.003]} />
      <M color="#C45A3C" roughness={0.7} metalness={0} />
    </mesh>
  </group>
);

const ArmChair = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Legs */}
    {[[-0.28, 0.08, 0.22], [0.28, 0.08, 0.22], [-0.28, 0.08, -0.22], [0.28, 0.08, -0.22]].map((p, i) =>
      <Leg key={i} position={p} height={0.16} radius={0.025} material={mat.walnut} />
    )}
    {/* Seat */}
    <mesh position={[0, 0.24, 0.02]} castShadow>
      <boxGeometry args={[0.6, 0.12, 0.55]} />
      <M {...mat.leather} />
    </mesh>
    {/* Back */}
    <mesh position={[0, 0.52, -0.24]} castShadow>
      <boxGeometry args={[0.6, 0.45, 0.1]} />
      <M {...mat.leather} />
    </mesh>
    {/* Arms */}
    <BoxPart position={[-0.32, 0.38, 0]} args={[0.08, 0.2, 0.55]} material={mat.leather} />
    <BoxPart position={[0.32, 0.38, 0]}  args={[0.08, 0.2, 0.55]} material={mat.leather} />
    {/* Cushion */}
    <mesh position={[0, 0.32, 0.02]} castShadow>
      <boxGeometry args={[0.48, 0.06, 0.42]} />
      <M {...mat.pillow} />
    </mesh>
  </group>
);

// Additional Living Room Furniture

const SectionalSofa = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main section */}
    <BoxPart position={[0, 0.12, 0]} args={[2.8, 0.08, 1.0]} material={mat.darkWood} />
    {/* L-section */}
    <BoxPart position={[1.4, 0.12, 1.0]} args={[1.0, 0.08, 1.0]} material={mat.darkWood} />
    {/* Main seat cushions */}
    {[-1.0, -0.2, 0.6].map((x, i) => (
      <mesh key={`main-${i}`} position={[x, 0.26, 0.05]} castShadow>
        <boxGeometry args={[0.75, 0.18, 0.85]} />
        <M {...mat.fabricGray} />
      </mesh>
    ))}
    {/* L-section seat */}
    <mesh position={[1.4, 0.26, 1.05]} castShadow>
      <boxGeometry args={[0.85, 0.18, 0.85]} />
      <M {...mat.fabricGray} />
    </mesh>
    {/* Back cushions */}
    {[-1.0, -0.2, 0.6].map((x, i) => (
      <mesh key={`back-${i}`} position={[x, 0.52, -0.36]} castShadow>
        <boxGeometry args={[0.7, 0.35, 0.22]} />
        <M {...mat.fabricGray} />
      </mesh>
    ))}
    <mesh position={[1.4, 0.52, 0.64]} castShadow>
      <boxGeometry args={[0.22, 0.35, 0.7]} />
      <M {...mat.fabricGray} />
    </mesh>
  </group>
);

const Recliner = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Base */}
    <CylPart position={[0, 0.08, 0]} args={[0.35, 0.32, 0.16, 16]} material={mat.blackMetal} />
    {/* Seat */}
    <mesh position={[0, 0.35, 0]} castShadow>
      <boxGeometry args={[0.7, 0.15, 0.6]} />
      <M {...mat.leatherBlk} />
    </mesh>
    {/* Backrest */}
    <mesh position={[0, 0.65, -0.25]} castShadow>
      <boxGeometry args={[0.65, 0.45, 0.12]} />
      <M {...mat.leatherBlk} />
    </mesh>
    {/* Arms */}
    <BoxPart position={[-0.4, 0.45, 0]} args={[0.12, 0.25, 0.5]} material={mat.leatherBlk} />
    <BoxPart position={[0.4, 0.45, 0]} args={[0.12, 0.25, 0.5]} material={mat.leatherBlk} />
    {/* Footrest (extended) */}
    <mesh position={[0, 0.25, 0.45]} castShadow>
      <boxGeometry args={[0.55, 0.08, 0.4]} />
      <M {...mat.leatherBlk} />
    </mesh>
  </group>
);

const SideTable = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Legs */}
    {[[-0.18, 0.2, 0.15], [0.18, 0.2, 0.15], [-0.18, 0.2, -0.15], [0.18, 0.2, -0.15]].map((p, i) =>
      <Leg key={i} position={p} height={0.4} radius={0.02} material={mat.walnut} />
    )}
    {/* Top */}
    <BoxPart position={[0, 0.42, 0]} args={[0.45, 0.03, 0.4]} material={mat.walnut} />
    {/* Drawer */}
    <BoxPart position={[0, 0.32, -0.12]} args={[0.38, 0.08, 0.15]} material={mat.darkWood} />
    {/* Handle */}
    <CylPart position={[0, 0.32, 0.03]} args={[0.008, 0.008, 0.06, 6]} rotation={[0, 0, Math.PI/2]} material={mat.brass} />
  </group>
);

const Ottoman = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Legs */}
    {[[-0.22, 0.08, 0.16], [0.22, 0.08, 0.16], [-0.22, 0.08, -0.16], [0.22, 0.08, -0.16]].map((p, i) =>
      <Leg key={i} position={p} height={0.16} radius={0.018} material={mat.darkWood} />
    )}
    {/* Top cushion */}
    <mesh position={[0, 0.22, 0]} castShadow>
      <boxGeometry args={[0.5, 0.12, 0.38]} />
      <M {...mat.fabricBeige} />
    </mesh>
    {/* Button tufting */}
    {[[-0.12, 0.28, -0.08], [0.12, 0.28, -0.08], [-0.12, 0.28, 0.08], [0.12, 0.28, 0.08]].map((p, i) => (
      <mesh key={i} position={p}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <M {...mat.brass} />
      </mesh>
    ))}
  </group>
);

const DisplayCabinet = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Cabinet body */}
    <BoxPart position={[0, 0.8, 0]} args={[1.2, 1.6, 0.4]} material={mat.walnut} />
    {/* Glass doors */}
    <mesh position={[-0.3, 0.8, 0.21]} castShadow>
      <boxGeometry args={[0.55, 1.5, 0.02]} />
      <M {...mat.glass} />
    </mesh>
    <mesh position={[0.3, 0.8, 0.21]} castShadow>
      <boxGeometry args={[0.55, 1.5, 0.02]} />
      <M {...mat.glass} />
    </mesh>
    {/* Glass shelves */}
    {[0.3, 0.6, 0.9, 1.2].map(y => (
      <mesh key={y} position={[0, y, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.02, 0.35]} />
        <M {...mat.glass} />
      </mesh>
    ))}
    {/* Display items */}
    <CylPart position={[-0.3, 0.7, 0]} args={[0.04, 0.04, 0.12, 8]} material={mat.ceramic} />
    <mesh position={[0.25, 1.0, 0]} castShadow>
      <boxGeometry args={[0.08, 0.15, 0.06]} />
      <M color="#8B4513" roughness={0.8} metalness={0} />
    </mesh>
  </group>
);

const WallClock = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Clock face */}
    <CylPart position={[0, 0, 0]} args={[0.15, 0.15, 0.03, 16]} material={mat.ceramic} />
    {/* Clock rim */}
    <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.15, 0.01, 8, 24]} />
      <M {...mat.brass} />
    </mesh>
    {/* Hour hand */}
    <mesh position={[0.02, 0.06, 0.02]} rotation={[0, 0, Math.PI / 6]}>
      <boxGeometry args={[0.002, 0.08, 0.001]} />
      <M {...mat.blackMetal} />
    </mesh>
    {/* Minute hand */}
    <mesh position={[-0.04, 0.08, 0.02]} rotation={[0, 0, -Math.PI / 4]}>
      <boxGeometry args={[0.002, 0.11, 0.001]} />
      <M {...mat.blackMetal} />
    </mesh>
    {/* Center dot */}
    <CylPart position={[0, 0, 0.02]} args={[0.008, 0.008, 0.002, 8]} material={mat.blackMetal} />
  </group>
);

const WallMirror = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Frame */}
    <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.35, 0.03, 12, 24]} />
      <M {...mat.brass} />
    </mesh>
    {/* Mirror surface */}
    <CylPart position={[0, 0, -0.01]} args={[0.32, 0.32, 0.005, 24]} material={mat.mirror} />
  </group>
);

const TableLamp = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Base */}
    <CylPart position={[0, 0.08, 0]} args={[0.08, 0.06, 0.16, 12]} material={mat.ceramic} />
    {/* Stem */}
    <CylPart position={[0, 0.25, 0]} args={[0.015, 0.015, 0.25, 8]} material={mat.brass} />
    {/* Shade */}
    <mesh position={[0, 0.42, 0]} castShadow>
      <cylinderGeometry args={[0.04, 0.12, 0.16, 12]} />
      <M {...mat.fabricCream} />
    </mesh>
    {/* Warm light */}
    <pointLight position={[0, 0.38, 0]} intensity={0.2} distance={1.5} color="#FFE4B5" />
  </group>
);

const Chandelier = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Central chain */}
    <CylPart position={[0, 0.1, 0]} args={[0.01, 0.01, 0.2, 8]} material={mat.brass} />
    {/* Main body */}
    <CylPart position={[0, -0.15, 0]} args={[0.25, 0.15, 0.2, 12]} material={mat.brass} />
    {/* Crystal drops */}
    {[0, 1, 2, 3, 4, 5].map(i => {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 0.2;
      const z = Math.sin(angle) * 0.2;
      return (
        <CylPart key={i} position={[x, -0.28, z]} args={[0.008, 0.005, 0.04, 6]} material={mat.glass} />
      );
    })}
    {/* Light bulbs */}
    {[0, 1, 2, 3, 4, 5].map(i => {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 0.18;
      const z = Math.sin(angle) * 0.18;
      return (
        <CylPart key={i} position={[x, -0.2, z]} args={[0.015, 0.02, 0.05, 8]} material={{color: '#FFF8DC', roughness: 0.1, metalness: 0.1, emissive: '#FFFFAA', emissiveIntensity: 0.3}} />
      );
    })}
    {/* Ambient lighting */}
    <pointLight position={[0, -0.2, 0]} intensity={0.8} distance={6} color="#FFFACD" />
  </group>
);

const Curtains = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Curtain rod */}
    <CylPart position={[0, 0, 0]} args={[0.015, 0.015, 2.0, 8]} rotation={[0, 0, Math.PI/2]} material={mat.brushedSteel} />
    {/* Left curtain panel */}
    <mesh position={[-0.6, -0.8, 0]} castShadow>
      <boxGeometry args={[0.8, 1.6, 0.02]} />
      <M {...mat.fabricNavy} />
    </mesh>
    {/* Right curtain panel */}
    <mesh position={[0.6, -0.8, 0]} castShadow>
      <boxGeometry args={[0.8, 1.6, 0.02]} />
      <M {...mat.fabricNavy} />
    </mesh>
    {/* Curtain pleats */}
    {[-0.75, -0.65, -0.55, -0.45].map((x, i) => (
      <mesh key={`left-${i}`} position={[x, -0.8, 0.015]} castShadow>
        <boxGeometry args={[0.02, 1.58, 0.01]} />
        <M color="#1A237E" roughness={0.9} metalness={0} />
      </mesh>
    ))}
    {[0.45, 0.55, 0.65, 0.75].map((x, i) => (
      <mesh key={`right-${i}`} position={[x, -0.8, 0.015]} castShadow>
        <boxGeometry args={[0.02, 1.58, 0.01]} />
        <M color="#1A237E" roughness={0.9} metalness={0} />
      </mesh>
    ))}
  </group>
);

const Vase = ({ position, rotation = [0, 0, 0], scale = 1, variant = 0 }) => {
  const colors = ['#8B4513', '#4A4A4A', '#FFFFFF', '#2E5090'];
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Vase body */}
      <CylPart position={[0, 0.12, 0]} args={[0.06, 0.04, 0.24, 12]} material={{color: colors[variant], roughness: 0.2, metalness: 0.1}} />
      {/* Decorative flowers */}
      {[0, 1, 2].map(i => (
        <group key={i} position={[Math.cos(i * Math.PI * 2 / 3) * 0.02, 0.28 + i * 0.02, Math.sin(i * Math.PI * 2 / 3) * 0.02]}>
          {/* Stem */}
          <CylPart position={[0, 0, 0]} args={[0.002, 0.002, 0.15, 6]} material={{color: '#228B22', roughness: 0.8, metalness: 0}} />
          {/* Flower */}
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.015, 8, 6]} />
            <M color={['#FF69B4', '#FFD700', '#9370DB'][i]} roughness={0.3} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Speakers = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Left speaker */}
    <mesh position={[-0.15, 0.12, 0]} castShadow>
      <boxGeometry args={[0.12, 0.24, 0.15]} />
      <M {...mat.blackMetal} />
    </mesh>
    {/* Right speaker */}
    <mesh position={[0.15, 0.12, 0]} castShadow>
      <boxGeometry args={[0.12, 0.24, 0.15]} />
      <M {...mat.blackMetal} />
    </mesh>
    {/* Speaker grilles */}
    {[-0.15, 0.15].map((x, i) => (
      <mesh key={i} position={[x, 0.12, 0.076]} castShadow>
        <circleGeometry args={[0.04, 16]} />
        <M color="#333333" roughness={0.6} metalness={0.2} />
      </mesh>
    ))}
  </group>
);

const AirConditioner = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main unit */}
    <BoxPart position={[0, 0, 0]} args={[0.8, 0.25, 0.3]} material={{color: '#FFFFFF', roughness: 0.2, metalness: 0.1}} />
    {/* Front grille */}
    <BoxPart position={[0, -0.05, 0.16]} args={[0.75, 0.15, 0.02]} material={{color: '#E0E0E0', roughness: 0.3, metalness: 0.1}} />
    {/* Vents */}
    {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
      <BoxPart key={i} position={[x, -0.05, 0.17]} args={[0.02, 0.12, 0.005]} material={{color: '#CCCCCC', roughness: 0.4, metalness: 0.2}} />
    ))}
    {/* Display panel */}
    <BoxPart position={[0.25, 0.02, 0.16]} args={[0.15, 0.06, 0.01]} material={{color: '#000000', roughness: 0.1, metalness: 0.8}} />
  </group>
);

const StorageBench = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main body */}
    <BoxPart position={[0, 0.18, 0]} args={[1.0, 0.36, 0.4]} material={mat.walnut} />
    {/* Top cushion */}
    <mesh position={[0, 0.38, 0]} castShadow>
      <boxGeometry args={[0.95, 0.04, 0.38]} />
      <M {...mat.fabricBeige} />
    </mesh>
    {/* Legs */}
    {[[-0.4, 0.08, 0.15], [0.4, 0.08, 0.15], [-0.4, 0.08, -0.15], [0.4, 0.08, -0.15]].map((p, i) =>
      <Leg key={i} position={p} height={0.16} radius={0.02} material={mat.darkWood} />
    )}
  </group>
);

const MagazineRack = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Frame */}
    <BoxPart position={[0, 0.2, 0]} args={[0.4, 0.4, 0.1]} material={mat.walnut} />
    {/* Dividers */}
    {[-0.1, 0.1].map((x, i) => (
      <BoxPart key={i} position={[x, 0.2, 0]} args={[0.02, 0.35, 0.08]} material={mat.darkWood} />
    ))}
    {/* Magazines */}
    {[-0.15, 0, 0.15].map((x, i) => (
      <mesh key={i} position={[x, 0.25, 0]} rotation={[0, 0, 0.1]} castShadow>
        <boxGeometry args={[0.12, 0.18, 0.005]} />
        <M color={['#FF4444', '#4444FF', '#44FF44'][i]} roughness={0.7} metalness={0} />
      </mesh>
    ))}
  </group>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   BEDROOM FURNITURE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const Bed = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Bed frame feet */}
    {[[-0.95, 0.05, 0.6], [0.95, 0.05, 0.6], [-0.95, 0.05, -0.62], [0.95, 0.05, -0.62]].map((p, i) =>
      <Leg key={i} position={p} height={0.1} radius={0.04} material={mat.darkWood} />
    )}
    {/* Bed frame */}
    <BoxPart position={[0, 0.14, 0]}     args={[2.05, 0.08, 1.35]} material={mat.walnut} />
    {/* Slats */}
    {[-0.8, -0.4, 0, 0.4, 0.8].map(x => (
      <BoxPart key={x} position={[x, 0.12, 0]} args={[0.08, 0.02, 1.3]} material={mat.lightWood} />
    ))}
    {/* Mattress */}
    <mesh position={[0, 0.28, 0]} castShadow>
      <boxGeometry args={[1.95, 0.2, 1.3]} />
      <M {...mat.bedSheet} />
    </mesh>
    {/* Mattress quilting lines */}
    {[-0.6, -0.2, 0.2, 0.6].map(x => (
      <mesh key={x} position={[x, 0.385, 0]} castShadow>
        <boxGeometry args={[0.02, 0.005, 1.28]} />
        <M color="#E8E8E8" roughness={0.9} metalness={0} />
      </mesh>
    ))}
    {/* Headboard */}
    <mesh position={[0, 0.64, -0.69]} castShadow>
      <boxGeometry args={[2.1, 0.85, 0.08]} />
      <M {...mat.walnut} />
    </mesh>
    {/* Headboard panel detail */}
    <BoxPart position={[0, 0.64, -0.65]} args={[1.9, 0.65, 0.03]} material={mat.fabricBeige} />
    {/* Footboard */}
    <BoxPart position={[0, 0.32, 0.68]}  args={[2.1, 0.32, 0.06]} material={mat.walnut} />
    {/* Pillows â€“ pair */}
    <mesh position={[-0.42, 0.44, -0.4]} rotation={[-0.15, 0, 0]} castShadow>
      <boxGeometry args={[0.55, 0.12, 0.35]} />
      <M {...mat.pillow} />
    </mesh>
    <mesh position={[0.42, 0.44, -0.4]} rotation={[-0.15, 0, 0]} castShadow>
      <boxGeometry args={[0.55, 0.12, 0.35]} />
      <M {...mat.pillow} />
    </mesh>
    {/* Duvet / blanket */}
    <mesh position={[0, 0.42, 0.15]} castShadow>
      <boxGeometry args={[1.9, 0.08, 0.85]} />
      <M {...mat.blanket} />
    </mesh>
    {/* Blanket fold at top */}
    <mesh position={[0, 0.44, -0.22]} castShadow>
      <boxGeometry args={[1.9, 0.04, 0.12]} />
      <M {...mat.bedSheet} />
    </mesh>
  </group>
);

const Wardrobe = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main body */}
    <BoxPart position={[0, 1.0, 0]}     args={[1.3, 2.0, 0.6]} material={mat.walnut} />
    {/* Left door */}
    <BoxPart position={[-0.33, 1.0, 0.31]} args={[0.62, 1.92, 0.02]} material={mat.oak} />
    {/* Right door */}
    <BoxPart position={[0.33, 1.0, 0.31]}  args={[0.62, 1.92, 0.02]} material={mat.oak} />
    {/* Door line */}
    <BoxPart position={[0, 1.0, 0.325]} args={[0.01, 1.92, 0.008]} material={mat.darkWood} />
    {/* Handles */}
    <CylPart position={[-0.06, 1.1, 0.33]} args={[0.012, 0.012, 0.12, 6]} material={mat.brass} />
    <CylPart position={[0.06, 1.1, 0.33]}  args={[0.012, 0.012, 0.12, 6]} material={mat.brass} />
    {/* Crown molding */}
    <BoxPart position={[0, 2.02, 0]}    args={[1.36, 0.04, 0.65]} material={mat.darkWood} />
    {/* Baseboard */}
    <BoxPart position={[0, 0.03, 0.01]} args={[1.34, 0.06, 0.58]} material={mat.darkWood} />
  </group>
);

const NightStand = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Legs */}
    {[[-0.18, 0.08, 0.14], [0.18, 0.08, 0.14], [-0.18, 0.08, -0.14], [0.18, 0.08, -0.14]].map((p, i) =>
      <Leg key={i} position={p} height={0.16} radius={0.02} material={mat.walnut} />
    )}
    {/* Top */}
    <BoxPart position={[0, 0.36, 0]}    args={[0.45, 0.03, 0.38]} material={mat.walnut} />
    {/* Drawer */}
    <BoxPart position={[0, 0.26, 0]}    args={[0.42, 0.16, 0.35]} material={mat.oak} />
    {/* Drawer handle */}
    <CylPart position={[0, 0.26, 0.18]} args={[0.01, 0.01, 0.06, 6]} rotation={[0, 0, Math.PI/2]} material={mat.brass} />
    {/* Table lamp on top */}
    <CylPart position={[0, 0.4, 0]}     args={[0.06, 0.06, 0.04, 8]} material={mat.ceramic} />
    <CylPart position={[0, 0.5, 0]}     args={[0.012, 0.012, 0.18, 6]} material={mat.brass} />
    <mesh position={[0, 0.62, 0]} castShadow>
      <cylinderGeometry args={[0.04, 0.1, 0.16, 10, 1, true]} />
      <M {...mat.fabricCream} side={THREE.DoubleSide} />
    </mesh>
    <pointLight position={[0, 0.6, 0]} intensity={0.15} distance={1.5} color="#FFE4B5" />
  </group>
);

const Dresser = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Body */}
    <BoxPart position={[0, 0.42, 0]}   args={[1.0, 0.8, 0.45]} material={mat.walnut} />
    {/* Top surface */}
    <BoxPart position={[0, 0.83, 0]}   args={[1.04, 0.03, 0.48]} material={mat.darkWood} />
    {/* Drawers (3 rows Ã— 2 cols) */}
    {[0.2, 0.45, 0.7].map(y =>
      [-0.26, 0.26].map(x => (
        <group key={`${x}-${y}`}>
          <BoxPart position={[x, y, 0.23]} args={[0.46, 0.2, 0.02]} material={mat.oak} />
          <CylPart position={[x, y, 0.25]} args={[0.008, 0.008, 0.05, 6]} rotation={[0, 0, Math.PI/2]} material={mat.brass} />
        </group>
      ))
    )}
    {/* Mirror on top */}
    <BoxPart position={[0, 1.3, -0.18]} args={[0.7, 0.65, 0.03]} material={mat.darkWood} />
    <mesh position={[0, 1.3, -0.16]}>
      <boxGeometry args={[0.6, 0.55, 0.005]} />
      <M {...mat.mirror} />
    </mesh>
  </group>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   KITCHEN FURNITURE - Modern Low-Poly Isometric Style
   Minimalistic, flat colors, soft matte materials, rounded edges
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

// Rounded box helper for smooth edges (low-poly friendly)
const RoundedBox = ({ position, args, material, radius = 0.02, rotation }) => {
  const shape = useMemo(() => {
    const [w, h, d] = args;
    const r = Math.min(radius, w/4, h/4, d/4);
    const geometry = new THREE.BoxGeometry(w - r*2, h, d - r*2);
    return geometry;
  }, [args, radius]);
  
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <M {...material} />
    </mesh>
  );
};

const KitchenCounter = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Base cabinet - Dark Walnut Wood */}
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.2, 0.78, 0.58]} />
      <M {...mat.darkWalnutCabinet} />
    </mesh>
    
    {/* Countertop - Oak / Butcher Block Wood */}
    <mesh position={[0, 0.82, 0.02]} castShadow receiveShadow>
      <boxGeometry args={[2.3, 0.05, 0.62]} />
      <M {...mat.oakCountertop} />
    </mesh>
    
    {/* Cabinet doors - 4 modular units (Dark Walnut) */}
    {[-0.8, -0.27, 0.27, 0.8].map((x, i) => (
      <group key={i}>
        {/* Door panel */}
        <mesh position={[x, 0.4, 0.295]} castShadow>
          <boxGeometry args={[0.48, 0.7, 0.02]} />
          <M {...mat.darkWalnutCabinet} />
        </mesh>
        {/* Minimal handle - thin horizontal bar */}
        <mesh position={[x, 0.58, 0.32]} castShadow>
          <boxGeometry args={[0.12, 0.015, 0.015]} />
          <M {...mat.kitchenHandle} />
        </mesh>
      </group>
    ))}
    
    {/* Backsplash - clean minimal rectangle */}
    <mesh position={[0, 1.1, -0.28]} castShadow receiveShadow>
      <boxGeometry args={[2.3, 0.5, 0.03]} />
      <M {...mat.kitchenGray} />
    </mesh>
    
    {/* Sink - simple recessed basin */}
    <mesh position={[0.55, 0.78, 0.05]} castShadow>
      <boxGeometry args={[0.5, 0.08, 0.38]} />
      <M {...mat.kitchenSink} />
    </mesh>
    {/* Sink interior depression */}
    <mesh position={[0.55, 0.76, 0.05]}>
      <boxGeometry args={[0.44, 0.06, 0.32]} />
      <M {...mat.kitchenDark} />
    </mesh>
    
    {/* Faucet - minimalist geometric design */}
    <mesh position={[0.55, 0.94, -0.1]} castShadow>
      <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
      <M {...mat.kitchenSteel} />
    </mesh>
    <mesh position={[0.55, 1.02, -0.02]} castShadow>
      <boxGeometry args={[0.015, 0.015, 0.18]} />
      <M {...mat.kitchenSteel} />
    </mesh>
    <mesh position={[0.55, 0.98, 0.06]} castShadow>
      <cylinderGeometry args={[0.012, 0.008, 0.08, 6]} />
      <M {...mat.kitchenSteel} />
    </mesh>
    
    {/* Upper cabinet - Matte Grey Laminate */}
    <mesh position={[-0.5, 1.55, -0.12]} castShadow receiveShadow>
      <boxGeometry args={[1.1, 0.55, 0.32]} />
      <M {...mat.matteGrayUpper} />
    </mesh>
    {/* Upper cabinet doors - Matte Grey Laminate */}
    {[-0.78, -0.25].map((x, i) => (
      <group key={`upper-${i}`}>
        <mesh position={[x, 1.55, 0.05]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.02]} />
          <M {...mat.matteGrayUpper} />
        </mesh>
        <mesh position={[x, 1.42, 0.075]} castShadow>
          <boxGeometry args={[0.1, 0.015, 0.015]} />
          <M {...mat.kitchenHandle} />
        </mesh>
      </group>
    ))}
    
    {/* Small upper cabinet - Matte Grey Laminate */}
    <mesh position={[0.6, 1.55, -0.12]} castShadow receiveShadow>
      <boxGeometry args={[0.5, 0.55, 0.32]} />
      <M {...mat.matteGrayUpper} />
    </mesh>
    <mesh position={[0.6, 1.55, 0.05]} castShadow>
      <boxGeometry args={[0.45, 0.5, 0.02]} />
      <M {...mat.matteGrayUpper} />
    </mesh>
  </group>
);

const Refrigerator = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main body - Glossy Black Metal */}
    <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.7, 1.82, 0.65]} />
      <M {...mat.glossyBlackFridge} />
    </mesh>
    
    {/* Freezer section (top) - slightly lighter panel line */}
    <mesh position={[0, 1.6, 0.326]} castShadow>
      <boxGeometry args={[0.68, 0.48, 0.02]} />
      <M color="#1A1A1A" roughness={0.2} metalness={0.85} />
    </mesh>
    
    {/* Main section (bottom) */}
    <mesh position={[0, 0.7, 0.326]} castShadow>
      <boxGeometry args={[0.68, 1.08, 0.02]} />
      <M color="#1A1A1A" roughness={0.2} metalness={0.85} />
    </mesh>
    
    {/* Division line between freezer and fridge */}
    <mesh position={[0, 1.32, 0.33]}>
      <boxGeometry args={[0.7, 0.015, 0.01]} />
      <M {...mat.kitchenDark} />
    </mesh>
    
    {/* Handles - minimal vertical bars */}
    <mesh position={[0.28, 1.6, 0.36]} castShadow>
      <boxGeometry args={[0.02, 0.2, 0.025]} />
      <M {...mat.kitchenHandle} />
    </mesh>
    <mesh position={[0.28, 0.7, 0.36]} castShadow>
      <boxGeometry args={[0.02, 0.4, 0.025]} />
      <M {...mat.kitchenHandle} />
    </mesh>
    
    {/* Digital display panel */}
    <mesh position={[-0.1, 1.15, 0.335]}>
      <boxGeometry args={[0.18, 0.1, 0.01]} />
      <M {...mat.kitchenBlack} />
    </mesh>
    
    {/* Base kick plate */}
    <mesh position={[0, 0.03, 0.02]} castShadow>
      <boxGeometry args={[0.68, 0.05, 0.58]} />
      <M {...mat.kitchenDark} />
    </mesh>
  </group>
);

const DiningTable = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Table top - Dark Walnut/Black Oak slab */}
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.3, 0.045, 0.8]} />
      <M {...mat.darkWalnutWood} />
    </mesh>
    
    {/* Table edge detail */}
    <mesh position={[0, 0.375, 0]} receiveShadow>
      <boxGeometry args={[1.32, 0.015, 0.82]} />
      <M {...mat.darkWalnutWood} />
    </mesh>
    
    {/* Legs - clean cylindrical pillars */}
    {[[-0.52, 0.2, 0.28], [0.52, 0.2, 0.28], [-0.52, 0.2, -0.28], [0.52, 0.2, -0.28]].map((p, i) =>
      <mesh key={i} position={p} castShadow>
        <cylinderGeometry args={[0.035, 0.03, 0.38, 8]} />
        <M {...mat.darkWalnutWood} />
      </mesh>
    )}
    
    {/* Cross support - simple rectangle */}
    <mesh position={[0, 0.08, 0]} castShadow>
      <boxGeometry args={[0.9, 0.025, 0.025]} />
      <M {...mat.darkWalnutWood} />
    </mesh>
  </group>
);

const DiningChair = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Legs - slim cylindrical Dark Walnut */}
    {[[-0.16, 0.11, 0.15], [0.16, 0.11, 0.15], [-0.16, 0.11, -0.15], [0.16, 0.11, -0.15]].map((p, i) =>
      <mesh key={i} position={p} castShadow>
        <cylinderGeometry args={[0.018, 0.015, 0.22, 8]} />
        <M {...mat.darkWalnutWood} />
      </mesh>
    )}
    
    {/* Seat frame - Dark Walnut */}
    <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.4, 0.035, 0.38]} />
      <M {...mat.darkWalnutWood} />
    </mesh>
    
    {/* Seat cushion - Tan/Beige Leather */}
    <mesh position={[0, 0.275, 0]} castShadow>
      <boxGeometry args={[0.36, 0.035, 0.34]} />
      <M {...mat.tanLeather} />
    </mesh>
    
    {/* Backrest frame - Dark Walnut */}
    <mesh position={[0, 0.52, -0.17]} castShadow receiveShadow>
      <boxGeometry args={[0.36, 0.42, 0.03]} />
      <M {...mat.darkWalnutWood} />
    </mesh>
    
    {/* Backrest cushion - Tan/Beige Leather */}
    <mesh position={[0, 0.5, -0.155]} castShadow>
      <boxGeometry args={[0.32, 0.32, 0.025]} />
      <M {...mat.tanLeather} />
    </mesh>
  </group>
);

const Stove = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main body - clean cube */}
    <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.58, 0.82, 0.58]} />
      <M {...mat.kitchenWhite} />
    </mesh>
    
    {/* Stove top surface */}
    <mesh position={[0, 0.84, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.6, 0.02, 0.6]} />
      <M {...mat.kitchenBlack} />
    </mesh>
    
    {/* Burners - simple flat circles */}
    {[[-0.14, 0.86, -0.14], [0.14, 0.86, -0.14], [-0.14, 0.86, 0.14], [0.14, 0.86, 0.14]].map((p, i) =>
      <mesh key={i} position={p} rotation={[-Math.PI/2, 0, 0]} castShadow>
        <circleGeometry args={[0.08, 12]} />
        <M {...mat.kitchenDark} />
      </mesh>
    )}
    
    {/* Burner rings */}
    {[[-0.14, 0.865, -0.14], [0.14, 0.865, -0.14], [-0.14, 0.865, 0.14], [0.14, 0.865, 0.14]].map((p, i) =>
      <mesh key={`ring-${i}`} position={p} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.05, 0.065, 12]} />
        <M {...mat.kitchenSteel} />
      </mesh>
    )}
    
    {/* Oven door - clean rectangle with glass window */}
    <mesh position={[0, 0.32, 0.295]} castShadow>
      <boxGeometry args={[0.54, 0.52, 0.02]} />
      <M {...mat.kitchenBlack} />
    </mesh>
    
    {/* Oven window */}
    <mesh position={[0, 0.34, 0.305]}>
      <boxGeometry args={[0.4, 0.28, 0.008]} />
      <M color="#1A1A28" roughness={0.1} metalness={0.15} />
    </mesh>
    
    {/* Oven handle - minimal bar */}
    <mesh position={[0, 0.62, 0.32]} castShadow>
      <boxGeometry args={[0.32, 0.02, 0.02]} />
      <M {...mat.kitchenSteel} />
    </mesh>
    
    {/* Control knobs - simple cylinders */}
    {[-0.2, -0.07, 0.07, 0.2].map((x, i) => (
      <mesh key={i} position={[x, 0.82, 0.29]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.015, 8]} />
        <M {...mat.kitchenSteel} />
      </mesh>
    ))}
    
    {/* Base kick plate */}
    <mesh position={[0, 0.02, 0.02]} castShadow>
      <boxGeometry args={[0.56, 0.04, 0.54]} />
      <M {...mat.kitchenDark} />
    </mesh>
  </group>
);

// Modern Microwave - Low-poly minimalistic design
const Microwave = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main body */}
    <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.48, 0.26, 0.36]} />
      <M {...mat.kitchenWhite} />
    </mesh>
    
    {/* Door */}
    <mesh position={[-0.06, 0.12, 0.182]} castShadow>
      <boxGeometry args={[0.32, 0.22, 0.015]} />
      <M {...mat.kitchenBlack} />
    </mesh>
    
    {/* Window */}
    <mesh position={[-0.06, 0.12, 0.19]}>
      <boxGeometry args={[0.26, 0.16, 0.008]} />
      <M color="#1C1C28" roughness={0.15} metalness={0.1} />
    </mesh>
    
    {/* Control panel */}
    <mesh position={[0.16, 0.12, 0.182]} castShadow>
      <boxGeometry args={[0.12, 0.22, 0.012]} />
      <M {...mat.kitchenGray} />
    </mesh>
    
    {/* Buttons */}
    {[0.18, 0.14, 0.1, 0.06].map((y, i) => (
      <mesh key={i} position={[0.16, y, 0.19]}>
        <boxGeometry args={[0.08, 0.02, 0.005]} />
        <M {...mat.kitchenDark} />
      </mesh>
    ))}
    
    {/* Handle */}
    <mesh position={[0.08, 0.12, 0.2]} castShadow>
      <boxGeometry args={[0.015, 0.12, 0.015]} />
      <M {...mat.kitchenHandle} />
    </mesh>
  </group>
);

// Range Hood - Modern minimalistic exhaust hood
const RangeHood = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main hood body - clean trapezoid shape */}
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.65, 0.12, 0.45]} />
      <M {...mat.kitchenSteel} />
    </mesh>
    
    {/* Hood chimney */}
    <mesh position={[0, 0.25, -0.08]} castShadow>
      <boxGeometry args={[0.35, 0.38, 0.25]} />
      <M {...mat.kitchenSteel} />
    </mesh>
    
    {/* Vent grille */}
    <mesh position={[0, -0.055, 0.05]}>
      <boxGeometry args={[0.5, 0.015, 0.3]} />
      <M {...mat.kitchenDark} />
    </mesh>
    
    {/* LED strip */}
    <mesh position={[0, -0.04, 0.15]}>
      <boxGeometry args={[0.45, 0.008, 0.03]} />
      <M color="#FFFFFF" roughness={0.2} metalness={0.1} emissive="#FFFFFF" emissiveIntensity={0.3} />
    </mesh>
    
    {/* Control buttons */}
    {[-0.15, 0, 0.15].map((x, i) => (
      <mesh key={i} position={[x, 0.015, 0.22]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} rotation={[Math.PI/2, 0, 0]} />
        <M {...mat.kitchenHandle} />
      </mesh>
    ))}
  </group>
);

// Kitchen Island - Modern modular center piece
const KitchenIsland = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main body */}
    <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.4, 0.82, 0.7]} />
      <M {...mat.kitchenWhite} />
    </mesh>
    
    {/* Countertop */}
    <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.5, 0.05, 0.8]} />
      <M {...mat.kitchenCounter} />
    </mesh>
    
    {/* Cabinet doors - front */}
    {[-0.5, 0, 0.5].map((x, i) => (
      <group key={`front-${i}`}>
        <mesh position={[x, 0.42, 0.355]} castShadow>
          <boxGeometry args={[0.42, 0.74, 0.015]} />
          <M {...mat.kitchenWhite} />
        </mesh>
        <mesh position={[x, 0.58, 0.375]} castShadow>
          <boxGeometry args={[0.1, 0.012, 0.012]} />
          <M {...mat.kitchenHandle} />
        </mesh>
      </group>
    ))}
    
    {/* Cabinet doors - back (open shelving style) */}
    {[-0.5, 0, 0.5].map((x, i) => (
      <mesh key={`back-${i}`} position={[x, 0.42, -0.355]} castShadow>
        <boxGeometry args={[0.42, 0.74, 0.015]} />
        <M {...mat.kitchenWood} />
      </mesh>
    ))}
    
    {/* Overhang bar for seating */}
    <mesh position={[0, 0.78, 0.5]} castShadow>
      <boxGeometry args={[1.48, 0.06, 0.25]} />
      <M {...mat.kitchenCounter} />
    </mesh>
    
    {/* Base kick plate */}
    <mesh position={[0, 0.025, 0]} castShadow>
      <boxGeometry args={[1.36, 0.05, 0.65]} />
      <M {...mat.kitchenDark} />
    </mesh>
  </group>
);

// Bar Stool - Modern minimalist for kitchen island
const BarStool = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Seat */}
    <mesh position={[0, 0.65, 0]} castShadow>
      <cylinderGeometry args={[0.17, 0.15, 0.04, 12]} />
      <M {...mat.kitchenMint} />
    </mesh>
    
    {/* Seat cushion top */}
    <mesh position={[0, 0.68, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.16, 0.03, 12]} />
      <M {...mat.kitchenMint} />
    </mesh>
    
    {/* Central stem */}
    <mesh position={[0, 0.35, 0]} castShadow>
      <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
      <M {...mat.kitchenHandle} />
    </mesh>
    
    {/* Base ring */}
    <mesh position={[0, 0.25, 0]} castShadow>
      <torusGeometry args={[0.12, 0.012, 8, 16]} />
      <M {...mat.kitchenHandle} />
    </mesh>
    
    {/* Base */}
    <mesh position={[0, 0.02, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.22, 0.04, 12]} />
      <M {...mat.kitchenDark} />
    </mesh>
  </group>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   BATHROOM FURNITURE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const Toilet = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Base pedestal */}
    <mesh position={[0, 0.08, 0.05]} castShadow>
      <cylinderGeometry args={[0.18, 0.2, 0.16, 12]} />
      <M {...mat.ceramic} />
    </mesh>
    {/* Bowl */}
    <mesh position={[0, 0.22, 0.08]} castShadow>
      <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <M {...mat.ceramic} />
    </mesh>
    {/* Bowl rim */}
    <mesh position={[0, 0.22, 0.08]} castShadow>
      <torusGeometry args={[0.2, 0.025, 8, 16]} />
      <M {...mat.ceramic} />
    </mesh>
    {/* Tank */}
    <mesh position={[0, 0.38, -0.18]} castShadow>
      <boxGeometry args={[0.34, 0.38, 0.18]} />
      <M {...mat.ceramic} />
    </mesh>
    {/* Tank lid */}
    <BoxPart position={[0, 0.58, -0.18]} args={[0.36, 0.03, 0.2]} material={mat.ceramic} />
    {/* Flush handle */}
    <CylPart position={[0.16, 0.55, -0.08]} args={[0.01, 0.01, 0.06, 6]} rotation={[0, 0, Math.PI/4]} material={mat.chrome} />
    {/* Seat */}
    <mesh position={[0, 0.24, 0.05]} castShadow>
      <torusGeometry args={[0.16, 0.03, 6, 16, Math.PI * 1.6]} />
      <M {...mat.white} />
    </mesh>
  </group>
);

const BathroomSink = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Vanity cabinet */}
    <BoxPart position={[0, 0.28, 0]}    args={[0.7, 0.56, 0.45]} material={mat.oak} />
    {/* Cabinet doors */}
    <BoxPart position={[-0.18, 0.28, 0.23]} args={[0.3, 0.48, 0.02]} material={mat.lightWood} />
    <BoxPart position={[0.18, 0.28, 0.23]}  args={[0.3, 0.48, 0.02]} material={mat.lightWood} />
    {/* Knobs */}
    <CylPart position={[-0.06, 0.28, 0.25]} args={[0.01, 0.01, 0.02, 6]} rotation={[Math.PI/2, 0, 0]} material={mat.chrome} />
    <CylPart position={[0.06, 0.28, 0.25]}  args={[0.01, 0.01, 0.02, 6]} rotation={[Math.PI/2, 0, 0]} material={mat.chrome} />
    {/* Countertop */}
    <BoxPart position={[0, 0.58, 0]}    args={[0.74, 0.03, 0.48]} material={mat.marble} />
    {/* Basin (sunken) */}
    <mesh position={[0, 0.57, 0.04]} castShadow>
      <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <M {...mat.ceramic} />
    </mesh>
    {/* Faucet body */}
    <CylPart position={[0, 0.68, -0.12]} args={[0.015, 0.015, 0.18, 8]} material={mat.chrome} />
    {/* Faucet spout */}
    <mesh position={[0, 0.76, -0.04]} castShadow rotation={[0.4, 0, 0]}>
      <cylinderGeometry args={[0.01, 0.012, 0.18, 8]} />
      <M {...mat.chrome} />
    </mesh>
    {/* Mirror above */}
    <BoxPart position={[0, 1.15, -0.2]} args={[0.55, 0.65, 0.03]} material={mat.chrome} />
    <mesh position={[0, 1.15, -0.18]}>
      <boxGeometry args={[0.5, 0.6, 0.005]} />
      <M {...mat.mirror} />
    </mesh>
  </group>
);

const Bathtub = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Outer shell */}
    <mesh position={[0, 0.28, 0]} castShadow>
      <boxGeometry args={[1.6, 0.56, 0.75]} />
      <M {...mat.ceramic} />
    </mesh>
    {/* Inner hollow (darker to simulate depth) */}
    <mesh position={[0, 0.32, 0]}>
      <boxGeometry args={[1.45, 0.5, 0.6]} />
      <M color="#E0E6E8" roughness={0.15} metalness={0.05} />
    </mesh>
    {/* Rim */}
    <mesh position={[0, 0.56, 0]} castShadow>
      <boxGeometry args={[1.65, 0.04, 0.78]} />
      <M {...mat.ceramic} />
    </mesh>
    {/* Water surface */}
    <mesh position={[0, 0.46, 0]}>
      <boxGeometry args={[1.4, 0.02, 0.55]} />
      <M {...mat.waterBlue} />
    </mesh>
    {/* Faucet mount */}
    <CylPart position={[-0.65, 0.7, 0]} args={[0.025, 0.025, 0.2, 8]} material={mat.chrome} />
    {/* Faucet handles */}
    <CylPart position={[-0.65, 0.82, -0.08]} args={[0.015, 0.015, 0.04, 6]} rotation={[Math.PI/2, 0, 0]} material={mat.chrome} />
    <CylPart position={[-0.65, 0.82, 0.08]}  args={[0.015, 0.015, 0.04, 6]} rotation={[Math.PI/2, 0, 0]} material={mat.chrome} />
    {/* Drain */}
    <CylPart position={[0.55, 0.56, 0]} args={[0.025, 0.025, 0.01, 8]} material={mat.chrome} />
    {/* Feet / claw feet */}
    {[[-0.65, 0.04, 0.3], [0.65, 0.04, 0.3], [-0.65, 0.04, -0.3], [0.65, 0.04, -0.3]].map((p, i) =>
      <mesh key={i} position={p} castShadow>
        <sphereGeometry args={[0.05, 8, 6]} />
        <M {...mat.brass} />
      </mesh>
    )}
  </group>
);

const ShowerArea = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Shower base tray */}
    <BoxPart position={[0, 0.03, 0]}    args={[0.9, 0.06, 0.9]} material={mat.tile} />
    {/* Glass panel */}
    <mesh position={[0.45, 1.0, 0]}>
      <boxGeometry args={[0.02, 2.0, 0.88]} />
      <M {...mat.glass} />
    </mesh>
    {/* Shower pole */}
    <CylPart position={[-0.3, 1.1, -0.4]} args={[0.015, 0.015, 2.0, 8]} material={mat.chrome} />
    {/* Shower head */}
    <CylPart position={[-0.3, 2.05, -0.25]} args={[0.06, 0.03, 0.04, 10]} rotation={[0.5, 0, 0]} material={mat.chrome} />
    {/* Shower arm */}
    <BoxPart position={[-0.3, 2.05, -0.34]} args={[0.02, 0.02, 0.15]} material={mat.chrome} />
    {/* Knob / mixer */}
    <CylPart position={[-0.3, 1.2, -0.41]} args={[0.025, 0.025, 0.04, 8]} rotation={[Math.PI/2, 0, 0]} material={mat.chrome} />
    {/* Drain */}
    <CylPart position={[0, 0.06, 0]} args={[0.03, 0.03, 0.005, 8]} material={mat.brushedSteel} />
  </group>
);

const TowelRack = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Wall mounts */}
    <CylPart position={[-0.25, 0, 0]} args={[0.015, 0.015, 0.06, 6]} rotation={[Math.PI/2, 0, 0]} material={mat.chrome} />
    <CylPart position={[0.25, 0, 0]}  args={[0.015, 0.015, 0.06, 6]} rotation={[Math.PI/2, 0, 0]} material={mat.chrome} />
    {/* Bar */}
    <CylPart position={[0, 0, 0.04]} args={[0.01, 0.01, 0.55, 6]} rotation={[0, 0, Math.PI/2]} material={mat.chrome} />
    {/* Towel draped */}
    <mesh position={[0, -0.15, 0.06]} castShadow>
      <boxGeometry args={[0.45, 0.25, 0.03]} />
      <M color="#F0E6D8" roughness={0.9} metalness={0} />
    </mesh>
  </group>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CAR PORCH / GARAGE â€“ Land Cruiser SUV Style
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const suvBody = { color: '#1C1C1C', roughness: 0.25, metalness: 0.75 };
const suvTrim = { color: '#0F0F0F', roughness: 0.3, metalness: 0.6 };

const Car = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* â”€â”€ Chassis / underbody â”€â”€ */}
    <BoxPart position={[0, 0.15, 0]}   args={[4.9, 0.12, 1.95]} material={mat.blackMetal} />

    {/* â”€â”€ Main body â€“ tall SUV proportions â”€â”€ */}
    <mesh position={[0, 0.52, 0]} castShadow>
      <boxGeometry args={[4.85, 0.62, 1.95]} />
      <M {...suvBody} />
    </mesh>
    {/* Body side crease lines */}
    <BoxPart position={[0, 0.55, 0.979]}  args={[3.8, 0.02, 0.002]} material={{color: '#2A2A2A', roughness: 0.2, metalness: 0.8}} />
    <BoxPart position={[0, 0.55, -0.979]} args={[3.8, 0.02, 0.002]} material={{color: '#2A2A2A', roughness: 0.2, metalness: 0.8}} />
    <BoxPart position={[0, 0.42, 0.979]}  args={[4.6, 0.01, 0.002]} material={mat.chrome} />
    <BoxPart position={[0, 0.42, -0.979]} args={[4.6, 0.01, 0.002]} material={mat.chrome} />

    {/* â”€â”€ Cabin / roof â€“ taller for SUV stance â”€â”€ */}
    <mesh position={[0.05, 1.0, 0]} castShadow>
      <boxGeometry args={[2.9, 0.65, 1.85]} />
      <M {...suvBody} />
    </mesh>
    {/* Roof rails */}
    <BoxPart position={[-0.1, 1.34, 0.85]}  args={[2.4, 0.04, 0.04]} material={mat.chrome} />
    <BoxPart position={[-0.1, 1.34, -0.85]} args={[2.4, 0.04, 0.04]} material={mat.chrome} />
    {/* Roof rail feet */}
    {[-1.0, 0, 1.0].map(x => (
      <group key={`rf-${x}`}>
        <BoxPart position={[x - 0.1, 1.33, 0.85]}  args={[0.08, 0.02, 0.06]} material={mat.blackMetal} />
        <BoxPart position={[x - 0.1, 1.33, -0.85]} args={[0.08, 0.02, 0.06]} material={mat.blackMetal} />
      </group>
    ))}

    {/* â”€â”€ Windshield (raked) â”€â”€ */}
    <mesh position={[-1.32, 0.98, 0]} rotation={[0, 0, 0.22]} castShadow>
      <boxGeometry args={[0.75, 0.58, 1.72]} />
      <M {...mat.carWindow} />
    </mesh>
    {/* A-pillar trim */}
    <BoxPart position={[-1.32, 0.98, 0.87]}  args={[0.78, 0.04, 0.06]} material={suvBody} />
    <BoxPart position={[-1.32, 0.98, -0.87]} args={[0.78, 0.04, 0.06]} material={suvBody} />

    {/* â”€â”€ Rear window (slightly angled) â”€â”€ */}
    <mesh position={[1.38, 0.98, 0]} rotation={[0, 0, -0.15]}>
      <boxGeometry args={[0.55, 0.5, 1.68]} />
      <M {...mat.carWindow} />
    </mesh>
    {/* D-pillar trim */}
    <BoxPart position={[1.38, 0.98, 0.85]}  args={[0.58, 0.04, 0.06]} material={suvBody} />
    <BoxPart position={[1.38, 0.98, -0.85]} args={[0.58, 0.04, 0.06]} material={suvBody} />

    {/* â”€â”€ Side windows (front + rear per side) â”€â”€ */}
    {[0.93, -0.93].map(z => (
      <group key={`sw-${z}`}>
        {/* Front side window */}
        <mesh position={[-0.45, 1.02, z]}>
          <boxGeometry args={[0.95, 0.42, 0.01]} />
          <M {...mat.carWindow} />
        </mesh>
        {/* B-pillar */}
        <BoxPart position={[0.08, 0.9, z]} args={[0.06, 0.55, 0.04]} material={suvBody} />
        {/* Rear side window */}
        <mesh position={[0.65, 1.02, z]}>
          <boxGeometry args={[0.85, 0.42, 0.01]} />
          <M {...mat.carWindow} />
        </mesh>
      </group>
    ))}

    {/* â”€â”€ Front face â€“ bold grille â”€â”€ */}
    <BoxPart position={[-2.43, 0.46, 0]} args={[0.04, 0.42, 1.55]} material={mat.chrome} />
    {/* Grille slats (horizontal) */}
    {[0.34, 0.40, 0.46, 0.52, 0.58].map(y => (
      <BoxPart key={y} position={[-2.44, y, 0]} args={[0.02, 0.025, 1.2]} material={mat.chrome} />
    ))}
    {/* Grille surround */}
    <BoxPart position={[-2.44, 0.46, 0.62]}  args={[0.02, 0.35, 0.04]} material={mat.chrome} />
    <BoxPart position={[-2.44, 0.46, -0.62]} args={[0.02, 0.35, 0.04]} material={mat.chrome} />
    {/* Toyota emblem placeholder */}
    <CylPart position={[-2.46, 0.48, 0]} args={[0.06, 0.06, 0.02, 10]} rotation={[0, Math.PI / 2, 0]} material={mat.chrome} />

    {/* â”€â”€ LED Headlights (modern split design) â”€â”€ */}
    {[-0.72, 0.72].map(z => (
      <group key={`hl-${z}`}>
        {/* Main housing */}
        <mesh position={[-2.44, 0.52, z]} castShadow>
          <boxGeometry args={[0.06, 0.14, 0.32]} />
          <M color="#E8E8EE" roughness={0.05} metalness={0.8} />
        </mesh>
        {/* LED DRL strip */}
        <mesh position={[-2.46, 0.55, z]}>
          <boxGeometry args={[0.02, 0.03, 0.28]} />
          <M color="#FFFFFF" roughness={0.05} metalness={0.2} emissive="#FFFFDD" emissiveIntensity={0.25} />
        </mesh>
        {/* Projector lens */}
        <CylPart position={[-2.46, 0.49, z]} args={[0.04, 0.04, 0.02, 10]} rotation={[0, Math.PI / 2, 0]}
          material={{color: '#F0F0FF', roughness: 0.02, metalness: 0.5}} />
      </group>
    ))}

    {/* â”€â”€ Front bumper (muscular) â”€â”€ */}
    <BoxPart position={[-2.46, 0.22, 0]}  args={[0.1, 0.2, 1.9]} material={suvTrim} />
    {/* Bumper lower lip */}
    <BoxPart position={[-2.48, 0.14, 0]}  args={[0.06, 0.06, 1.6]} material={mat.blackMetal} />
    {/* Fog lights */}
    {[-0.7, 0.7].map(z => (
      <CylPart key={`fog-${z}`} position={[-2.48, 0.2, z]} args={[0.035, 0.035, 0.02, 8]} rotation={[0, Math.PI / 2, 0]}
        material={{color: '#F8F8FF', roughness: 0.05, metalness: 0.4}} />
    ))}
    {/* Skid plate (silver) */}
    <BoxPart position={[-2.46, 0.1, 0]}   args={[0.06, 0.04, 1.0]} material={mat.brushedSteel} />

    {/* â”€â”€ Rear styling â”€â”€ */}
    {/* Rear bumper */}
    <BoxPart position={[2.44, 0.22, 0]}   args={[0.1, 0.2, 1.9]} material={suvTrim} />
    <BoxPart position={[2.46, 0.1, 0]}    args={[0.06, 0.04, 1.0]} material={mat.brushedSteel} />
    {/* Rear panel */}
    <BoxPart position={[2.43, 0.52, 0]}   args={[0.04, 0.5, 1.88]} material={suvBody} />
    {/* LED Taillights (C-shape) */}
    {[-0.72, 0.72].map(z => (
      <group key={`tl-${z}`}>
        <mesh position={[2.45, 0.55, z]} castShadow>
          <boxGeometry args={[0.04, 0.2, 0.28]} />
          <M color="#CC1111" roughness={0.15} metalness={0.5} emissive="#880000" emissiveIntensity={0.15} />
        </mesh>
        {/* Tail LED accent */}
        <mesh position={[2.46, 0.58, z]}>
          <boxGeometry args={[0.02, 0.03, 0.24]} />
          <M color="#FF3333" roughness={0.1} metalness={0.3} emissive="#FF0000" emissiveIntensity={0.2} />
        </mesh>
      </group>
    ))}
    {/* Rear badge area */}
    <BoxPart position={[2.45, 0.62, 0]} args={[0.02, 0.06, 0.4]} material={mat.chrome} />
    {/* Exhaust tips */}
    <CylPart position={[2.46, 0.14, -0.55]} args={[0.04, 0.035, 0.08, 8]} rotation={[0, Math.PI / 2, 0]} material={mat.chrome} />
    <CylPart position={[2.46, 0.14, 0.55]}  args={[0.04, 0.035, 0.08, 8]} rotation={[0, Math.PI / 2, 0]} material={mat.chrome} />

    {/* â”€â”€ Wheels â€“ large SUV wheels with thick tires â”€â”€ */}
    {[[-1.55, 0.24, 0.95], [1.55, 0.24, 0.95], [-1.55, 0.24, -0.95], [1.55, 0.24, -0.95]].map((p, i) => (
      <group key={i} position={p}>
        {/* Tire */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.24, 0.1, 10, 20]} />
          <M {...mat.tire} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 10]} />
          <M color="#D8D8D8" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Rim spokes (5-spoke design) */}
        {[0, 1, 2, 3, 4].map(s => (
          <mesh key={s} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, (s * Math.PI * 2) / 5]} castShadow>
            <boxGeometry args={[0.03, 0.07, 0.14]} />
            <M color="#E0E0E0" roughness={0.1} metalness={0.9} />
          </mesh>
        ))}
        {/* Center cap */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.09, 8]} />
          <M {...mat.chrome} />
        </mesh>
        {/* Brake caliper (visible) */}
        <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.08, 0.04, 0.06]} />
          <M color="#333333" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
    ))}
    {/* Wheel arches / fender flares */}
    {[[-1.55, 0.38, 0.98], [1.55, 0.38, 0.98], [-1.55, 0.38, -0.98], [1.55, 0.38, -0.98]].map((p, i) => (
      <mesh key={`arch-${i}`} position={p} castShadow>
        <boxGeometry args={[0.7, 0.04, 0.06]} />
        <M {...suvTrim} />
      </mesh>
    ))}

    {/* â”€â”€ Side body details â”€â”€ */}
    {/* Running boards / side steps */}
    <BoxPart position={[0, 0.12, 0.92]}  args={[2.6, 0.04, 0.12]} material={mat.brushedSteel} />
    <BoxPart position={[0, 0.12, -0.92]} args={[2.6, 0.04, 0.12]} material={mat.brushedSteel} />
    {/* Side mirrors (modern folding style) */}
    <group position={[-1.15, 0.88, 0.98]}>
      <BoxPart position={[0, 0, 0]}      args={[0.08, 0.04, 0.06]} material={suvBody} />
      <BoxPart position={[0.02, 0, 0.06]} args={[0.1, 0.1, 0.06]} material={suvBody} />
      <mesh position={[0.02, 0, 0.095]}>
        <boxGeometry args={[0.08, 0.08, 0.003]} />
        <M {...mat.mirror} />
      </mesh>
      {/* Mirror turn signal */}
      <mesh position={[-0.02, -0.02, 0.08]}>
        <boxGeometry args={[0.06, 0.01, 0.02]} />
        <M color="#FFAA00" roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
    <group position={[-1.15, 0.88, -0.98]}>
      <BoxPart position={[0, 0, 0]}       args={[0.08, 0.04, 0.06]} material={suvBody} />
      <BoxPart position={[0.02, 0, -0.06]} args={[0.1, 0.1, 0.06]} material={suvBody} />
      <mesh position={[0.02, 0, -0.095]}>
        <boxGeometry args={[0.08, 0.08, 0.003]} />
        <M {...mat.mirror} />
      </mesh>
      <mesh position={[-0.02, -0.02, -0.08]}>
        <boxGeometry args={[0.06, 0.01, 0.02]} />
        <M color="#FFAA00" roughness={0.2} metalness={0.3} />
      </mesh>
    </group>

    {/* Door lines â€“ front */}
    {[0.979, -0.979].map(z => (
      <group key={`dl-${z}`}>
        <BoxPart position={[-0.5, 0.5, z]}  args={[1.0, 0.42, 0.002]} material={{color: '#141414', roughness: 0.3, metalness: 0.6}} />
        <BoxPart position={[0.55, 0.5, z]}  args={[0.95, 0.42, 0.002]} material={{color: '#141414', roughness: 0.3, metalness: 0.6}} />
      </group>
    ))}
    {/* Door handles (chrome) */}
    {[[-0.6, 0.56, 0.99], [-0.6, 0.56, -0.99], [0.45, 0.56, 0.99], [0.45, 0.56, -0.99]].map((p, i) =>
      <BoxPart key={`dh-${i}`} position={p} args={[0.1, 0.025, 0.025]} material={mat.chrome} />
    )}
  </group>
);

const BikeStand = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Stand frame  */}
    <BoxPart position={[0, 0.35, 0]}     args={[0.04, 0.7, 0.04]} material={mat.blackMetal} />
    <BoxPart position={[0, 0.02, 0]}     args={[0.5, 0.04, 0.04]} material={mat.blackMetal} />
    <BoxPart position={[-0.24, 0.02, 0]} args={[0.04, 0.04, 0.4]} material={mat.blackMetal} />
    <BoxPart position={[0.24, 0.02, 0]}  args={[0.04, 0.04, 0.4]} material={mat.blackMetal} />
    {/* Bike frame (simplified) */}
    <CylPart position={[0, 0.55, 0]}     args={[0.015, 0.015, 0.5, 6]} rotation={[0, 0, 0.5]} material={mat.brushedSteel} />
    <CylPart position={[0.15, 0.55, 0]}  args={[0.015, 0.015, 0.4, 6]} rotation={[0, 0, -0.5]} material={mat.brushedSteel} />
    {/* Wheels */}
    <mesh position={[-0.18, 0.45, 0]} rotation={[Math.PI/2, 0, 0]}>
      <torusGeometry args={[0.15, 0.01, 6, 16]} />
      <M {...mat.blackMetal} />
    </mesh>
    <mesh position={[0.35, 0.45, 0]} rotation={[Math.PI/2, 0, 0]}>
      <torusGeometry args={[0.15, 0.01, 6, 16]} />
      <M {...mat.blackMetal} />
    </mesh>
    {/* Handlebars */}
    <CylPart position={[-0.18, 0.7, 0]} args={[0.008, 0.008, 0.25, 6]} rotation={[Math.PI/2, 0, 0]} material={mat.chrome} />
    {/* Seat */}
    <mesh position={[0.2, 0.72, 0]} castShadow>
      <boxGeometry args={[0.1, 0.03, 0.08]} />
      <M {...mat.leatherBlk} />
    </mesh>
  </group>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   GARDEN / OUTDOOR
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const PlantPot = ({ position, rotation = [0, 0, 0], scale = 1, variant = 0 }) => {
  const colors = [mat.plant, mat.plantDark, mat.plant, mat.plantDark];
  const potMats = [mat.terracotta, mat.ceramic, mat.darkWood, mat.terracotta];
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Pot */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.1, 0.2, 10]} />
        <M {...potMats[variant % 4]} />
      </mesh>
      {/* Pot rim */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <torusGeometry args={[0.14, 0.015, 6, 12]} />
        <M {...potMats[variant % 4]} />
      </mesh>
      {/* Soil */}
      <CylPart position={[0, 0.19, 0]} args={[0.12, 0.12, 0.02, 10]} material={mat.soil} />
      {/* Foliage â€“ layered spheres */}
      <mesh position={[0, 0.36, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <M {...colors[variant % 4]} />
      </mesh>
      <mesh position={[0.06, 0.46, 0.04]} castShadow>
        <sphereGeometry args={[0.12, 8, 6]} />
        <M {...colors[(variant + 1) % 4]} />
      </mesh>
      <mesh position={[-0.06, 0.42, -0.04]} castShadow>
        <sphereGeometry args={[0.1, 7, 5]} />
        <M {...colors[(variant + 2) % 4]} />
      </mesh>
      {/* Stem */}
      <CylPart position={[0, 0.25, 0]} args={[0.01, 0.012, 0.12, 5]} material={{color: '#3D7A3D', roughness: 0.8, metalness: 0}} />
    </group>
  );
};

const GardenTree = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Trunk */}
    <CylPart position={[0, 0.4, 0]}  args={[0.06, 0.08, 0.8, 6]} material={mat.darkWood} />
    {/* Canopy layers */}
    <mesh position={[0, 0.9, 0]} castShadow>
      <sphereGeometry args={[0.4, 8, 6]} />
      <M {...mat.plant} />
    </mesh>
    <mesh position={[0.12, 1.1, 0.1]} castShadow>
      <sphereGeometry args={[0.28, 7, 5]} />
      <M {...mat.plantDark} />
    </mesh>
    <mesh position={[-0.1, 1.05, -0.08]} castShadow>
      <sphereGeometry args={[0.22, 7, 5]} />
      <M {...mat.plant} />
    </mesh>
  </group>
);

const GardenBench = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Legs */}
    {[[-0.45, 0.15, 0.14], [0.45, 0.15, 0.14], [-0.45, 0.15, -0.14], [0.45, 0.15, -0.14]].map((p, i) =>
      <Leg key={i} position={p} height={0.3} radius={0.025} material={mat.blackMetal} />
    )}
    {/* Seat slats */}
    {[-0.08, 0, 0.08].map(z => (
      <BoxPart key={z} position={[0, 0.31, z]} args={[1.1, 0.025, 0.08]} material={mat.oak} />
    ))}
    {/* Backrest slats */}
    {[0.4, 0.5, 0.6].map(y => (
      <BoxPart key={y} position={[0, y, -0.18]} args={[1.1, 0.025, 0.06]} material={mat.oak} />
    ))}
    {/* Armrests */}
    <BoxPart position={[-0.48, 0.38, 0.02]} args={[0.06, 0.04, 0.35]} material={mat.oak} />
    <BoxPart position={[0.48, 0.38, 0.02]}  args={[0.06, 0.04, 0.35]} material={mat.oak} />
  </group>
);

const Pathway = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Modern stone path with decorative edges */}
    {[[-0.4, 0], [-0.1, -0.25], [0.2, 0], [0.5, -0.25], [0.8, 0]].map(([x, z], i) => (
      <group key={i}>
        {/* Main stepping stone */}
        <mesh position={[x, 0.012, z]} receiveShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.024, 8]} />
          <M color="#C8C8C8" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Stone border detail */}
        <mesh position={[x, 0.008, z]} receiveShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.016, 8]} />
          <M color="#A8A8A8" roughness={0.5} metalness={0.05} />
        </mesh>
      </group>
    ))}
    {/* Gravel between stones */}
    <mesh position={[0.2, 0.004, -0.125]} receiveShadow>
      <boxGeometry args={[1.4, 0.008, 0.5]} />
      <M color="#D4C4B0" roughness={0.8} metalness={0.02} />
    </mesh>
  </group>
);

// Modern Flower Bed Component
const FlowerBed = ({ position, rotation = [0, 0, 0], scale = 1, variant = 0 }) => {
  const flowerColors = [
    ['#FF69B4', '#FFB6C1', '#FF1493'], // Pink roses
    ['#FF4500', '#FFA500', '#FF6347'], // Orange marigolds
    ['#9370DB', '#8A2BE2', '#DA70D6'], // Purple petunias
    ['#FFFF00', '#FFD700', '#F0E68C']  // Yellow sunflowers
  ];
  
  const colors = flowerColors[variant] || flowerColors[0];
  
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Modern raised planter box */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.16, 0.4]} />
        <M color="#8B4513" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Soil */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[0.75, 0.02, 0.35]} />
        <M color="#654321" roughness={0.9} metalness={0} />
      </mesh>
      
      {/* Flowers arranged in rows */}
      {[-0.25, 0, 0.25].map((x, i) => (
        [-0.12, 0.12].map((z, j) => (
          <group key={`${i}-${j}`} position={[x, 0.16, z]}>
            {/* Flower stem */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
              <M color="#228B22" roughness={0.8} metalness={0} />
            </mesh>
            
            {/* Flower petals */}
            {[0, 1, 2, 3, 4].map(petal => (
              <mesh 
                key={petal} 
                position={[
                  Math.cos(petal * Math.PI * 2 / 5) * 0.025, 
                  0.08, 
                  Math.sin(petal * Math.PI * 2 / 5) * 0.025
                ]}
                rotation={[Math.PI / 2, petal * Math.PI * 2 / 5, 0]}
              >
                <circleGeometry args={[0.02, 6]} />
                <M color={colors[Math.floor(Math.random() * colors.length)]} roughness={0.3} metalness={0} />
              </mesh>
            ))}
            
            {/* Flower center */}
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.012, 8, 6]} />
              <M color="#FFD700" roughness={0.4} metalness={0.1} />
            </mesh>
          </group>
        ))
      ))}
    </group>
  );
};

// Modern Garden Light
const GardenLight = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Base */}
    <mesh position={[0, 0.02, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.1, 0.04, 8]} />
      <M color="#2C2C2C" roughness={0.3} metalness={0.7} />
    </mesh>
    
    {/* Post */}
    <mesh position={[0, 0.4, 0]} castShadow>
      <cylinderGeometry args={[0.025, 0.025, 0.72, 8]} />
      <M color="#404040" roughness={0.2} metalness={0.8} />
    </mesh>
    
    {/* Light housing */}
    <mesh position={[0, 0.78, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.06, 0.12, 8]} />
      <M color="#E8E8E8" roughness={0.1} metalness={0.9} />
    </mesh>
    
    {/* LED light */}
    <mesh position={[0, 0.84, 0]}>
      <cylinderGeometry args={[0.06, 0.06, 0.02, 8]} />
      <M color="#FFFFCC" roughness={0.1} metalness={0.1} emissive="#FFFFAA" emissiveIntensity={0.3} />
    </mesh>
  </group>
);

// Modern Decorative Grass
const DecorativeGrass = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Grass clumps */}
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.08 + Math.random() * 0.04;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 0.12 + Math.random() * 0.08;
      
      return (
        <mesh 
          key={i} 
          position={[x, height / 2, z]} 
          rotation={[0, angle, Math.random() * 0.2]}
        >
          <cylinderGeometry args={[0.003, 0.001, height, 4]} />
          <M color="#4F7942" roughness={0.9} metalness={0} />
        </mesh>
      );
    })}
  </group>
);

const Fountain = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Base pool */}
    <mesh position={[0, 0.08, 0]} castShadow>
      <cylinderGeometry args={[0.45, 0.5, 0.16, 12]} />
      <M color="#808080" roughness={0.4} metalness={0.2} />
    </mesh>
    {/* Water in pool */}
    <mesh position={[0, 0.15, 0]}>
      <cylinderGeometry args={[0.4, 0.4, 0.02, 12]} />
      <M {...mat.waterBlue} />
    </mesh>
    {/* Central column */}
    <CylPart position={[0, 0.35, 0]} args={[0.06, 0.08, 0.4, 8]} material={mat.granite} />
    {/* Upper basin */}
    <mesh position={[0, 0.55, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.15, 0.08, 10]} />
      <M color="#909090" roughness={0.35} metalness={0.15} />
    </mesh>
    {/* Top spout */}
    <CylPart position={[0, 0.65, 0]} args={[0.02, 0.03, 0.12, 6]} material={mat.granite} />
  </group>
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ROOM ACCESSORY LAYOUTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export const getRoomAccessories = (roomType, roomWidth, roomHeight) => {
  const accessories = [];
  // Normalize: lowercase, strip digits/dashes/spaces, then determine base type
  const raw = roomType.toLowerCase().replace(/[-\d\s]/g, '');
  // Determine type by checking includes (order matters: check compound words first)
  let type = 'unknown';
  if (raw.includes('living') || raw.includes('drawing') || raw === 'lounge') type = 'living';
  else if (raw.includes('bed')) type = 'bedroom';
  else if (raw.includes('bath')) type = 'bathroom';
  else if (raw.includes('kitchen')) type = 'kitchen';
  else if (raw.includes('dining')) type = 'dining';
  else if (raw.includes('car') || raw.includes('porch') || raw.includes('garage')) type = 'carporch';
  else if (raw.includes('garden') || raw.includes('lawn') || raw.includes('yard')) type = 'garden';
  else if (raw.includes('store') || raw.includes('storage')) type = 'storage';
  else if (raw.includes('lounge')) type = 'lounge';
  else type = raw;

  const scale = Math.min(roomWidth / 4, roomHeight / 4, 1);
  const w = roomWidth;
  const h = roomHeight;

  switch (type) {
    case 'living':
    case 'drawing':
      accessories.push(
        // ðŸ§¶ Soft Furnishings
        { component: Rug,       position: [0, 0, 0],              rotation: [0, 0, 0], scale },
        
        // ðŸ›‹ï¸ Basic Furniture - Seating
        { component: Sofa,      position: [0, 0, h * 0.22],       rotation: [0, Math.PI, 0], scale },
        { component: ArmChair,  position: [w * 0.3, 0, h * 0.08], rotation: [0, -Math.PI / 3, 0], scale: scale * 0.9 },
        { component: Recliner,  position: [-w * 0.32, 0, h * 0.15], rotation: [0, Math.PI / 6, 0], scale: scale * 0.85 },
        
        // ðŸ›‹ï¸ Tables
        { component: CoffeeTable, position: [0, 0, 0],            rotation: [0, 0, 0], scale },
        { component: SideTable, position: [w * 0.38, 0, h * 0.25], rotation: [0, -Math.PI / 2, 0], scale: scale * 0.8 },
        { component: SideTable, position: [-w * 0.25, 0, h * 0.35], rotation: [0, Math.PI / 4, 0], scale: scale * 0.7 },
        
        // ðŸ›‹ï¸ Storage & Display
        { component: TVUnit,    position: [0, 0, -h * 0.38],      rotation: [0, 0, 0], scale },
        { component: Bookshelf, position: [-w * 0.38, 0, -h * 0.35], rotation: [0, Math.PI / 2, 0], scale: scale * 0.7 },
        { component: DisplayCabinet, position: [w * 0.35, 0, -h * 0.25], rotation: [0, -Math.PI / 2, 0], scale: scale * 0.6 },
        { component: StorageBench, position: [-w * 0.15, 0, h * 0.38], rotation: [0, 0, 0], scale: scale * 0.8 },
        { component: Ottoman,   position: [w * 0.15, 0, h * 0.12], rotation: [0, 0, 0], scale: scale * 0.8 },
        
        // ðŸ’¡ Lighting Accessories
        { component: FloorLamp, position: [w * 0.35, 0, h * 0.32], rotation: [0, 0, 0], scale },
        { component: TableLamp, position: [w * 0.38, 0.42, h * 0.25], rotation: [0, 0, 0], scale: scale * 0.9 },
        { component: Chandelier, position: [0, 2.4, h * 0.05], rotation: [0, 0, 0], scale: scale * 0.8 },
        
        // ðŸ–¼ï¸ Wall Accessories
        { component: WallArt,   position: [0, 1.4, -h * 0.48],   rotation: [0, 0, 0], scale: scale * 0.8 },
        { component: WallClock, position: [w * 0.4, 1.6, -h * 0.45], rotation: [0, -Math.PI / 2, 0], scale: scale * 0.9 },
        { component: WallMirror, position: [-w * 0.4, 1.5, h * 0.45], rotation: [0, Math.PI / 2, 0], scale: scale * 0.7 },
        
        //  Decorative Items
        { component: PlantPot,  position: [-w * 0.35, 0, h * 0.32], rotation: [0, 0, 0], scale },
        { component: Vase,      position: [-w * 0.25, 0.42, h * 0.35], rotation: [0, 0, 0], scale: scale * 0.8, props: { variant: 1 } },
        { component: Vase,      position: [0, 0.33, 0], rotation: [0, Math.PI / 4, 0], scale: scale * 0.7, props: { variant: 2 } },
        
        // ðŸ“º Electronics
        { component: Speakers,  position: [w * 0.28, 0, -h * 0.32], rotation: [0, Math.PI / 6, 0], scale: scale * 0.9 },
        { component: AirConditioner, position: [w * 0.45, 2.2, h * 0.15], rotation: [0, -Math.PI / 2, 0], scale: scale * 0.8 },
        
        // ðŸ—„ï¸ Additional Storage & Utility
        { component: MagazineRack, position: [-w * 0.18, 0, -h * 0.32], rotation: [0, Math.PI / 8, 0], scale: scale * 0.9 },
      );
      break;

    case 'bedroom':
      accessories.push(
        { component: Bed,        position: [0, 0, h * 0.05],       rotation: [0, 0, 0], scale },
        { component: NightStand, position: [-w * 0.35, 0, h * 0.05], rotation: [0, 0, 0], scale },
        { component: NightStand, position: [w * 0.35, 0, h * 0.05],  rotation: [0, 0, 0], scale },
        { component: Wardrobe,   position: [-w * 0.38, 0, -h * 0.3], rotation: [0, Math.PI / 2, 0], scale: scale * 0.85 },
        { component: Dresser,    position: [w * 0.3, 0, -h * 0.35],  rotation: [0, -Math.PI / 2, 0], scale: scale * 0.7 },
        { component: PlantPot,   position: [w * 0.38, 0, h * 0.35],  rotation: [0, 0, 0], scale: scale * 0.7, props: { variant: 1 } },
        { component: Rug,        position: [0, 0, h * 0.28],        rotation: [0, 0, 0], scale: scale * 0.6, props: { color: '#9B8B7B' } },
        { component: WallArt,    position: [0, 1.3, -h * 0.48],    rotation: [0, 0, 0], scale: scale * 0.6 },
      );
      break;

    case 'kitchen':
      accessories.push(
        { component: KitchenCounter, position: [0, 0, -h * 0.3],    rotation: [0, 0, 0], scale },
        { component: Refrigerator,   position: [w * 0.35, 0, -h * 0.25], rotation: [0, 0, 0], scale },
        { component: Stove,          position: [-w * 0.28, 0, -h * 0.28], rotation: [0, 0, 0], scale },
        { component: RangeHood,      position: [-w * 0.28, 1.8, -h * 0.28], rotation: [0, 0, 0], scale },
        { component: Microwave,      position: [w * 0.12, 0.9, -h * 0.3], rotation: [0, 0, 0], scale: scale * 0.9 },
        { component: DiningTable,    position: [0, 0, h * 0.2],     rotation: [0, 0, 0], scale: scale * 0.9 },
        { component: DiningChair,    position: [-0.45 * scale, 0, (h * 0.2 + 0.45) * 1], rotation: [0, Math.PI, 0], scale: scale * 0.9 },
        { component: DiningChair,    position: [0.45 * scale, 0, (h * 0.2 + 0.45) * 1],  rotation: [0, Math.PI, 0], scale: scale * 0.9 },
        { component: DiningChair,    position: [-0.45 * scale, 0, (h * 0.2 - 0.45) * 1], rotation: [0, 0, 0], scale: scale * 0.9 },
        { component: DiningChair,    position: [0.45 * scale, 0, (h * 0.2 - 0.45) * 1],  rotation: [0, 0, 0], scale: scale * 0.9 },
        { component: PlantPot,       position: [-w * 0.38, 0, h * 0.35], rotation: [0, 0, 0], scale: scale * 0.6, props: { variant: 2 } },
        { component: WallArt,        position: [w * 0.2, 1.4, -h * 0.48], rotation: [0, 0, 0], scale: scale * 0.6 },
      );
      break;

    case 'bathroom':
      accessories.push(
        { component: Toilet,      position: [-w * 0.28, 0, h * 0.28],  rotation: [0, -Math.PI / 2, 0], scale },
        { component: BathroomSink, position: [0, 0, -h * 0.35],        rotation: [0, 0, 0], scale },
        { component: Bathtub,     position: [w * 0.22, 0, h * 0.08],   rotation: [0, Math.PI / 2, 0], scale: scale * 0.85 },
        { component: ShowerArea,  position: [-w * 0.28, 0, -h * 0.12], rotation: [0, 0, 0], scale: scale * 0.7 },
        { component: TowelRack,   position: [w * 0.4, 0.9, -h * 0.3], rotation: [0, -Math.PI / 2, 0], scale },
      );
      break;

    case 'carporch':
      accessories.push(
        { component: Car,       position: [0, 0, 0],              rotation: [0, Math.PI / 2, 0], scale: scale * 0.65 },
        { component: BikeStand, position: [w * 0.32, 0, h * 0.32], rotation: [0, Math.PI / 4, 0], scale },
      );
      break;

    case 'garden':
      accessories.push(
        // Trees for natural shade and structure
        { component: GardenTree,  position: [-w * 0.28, 0, -h * 0.28], rotation: [0, 0.3, 0], scale: scale * 1.1 },
        { component: GardenTree,  position: [w * 0.26, 0, h * 0.25],    rotation: [0, -0.5, 0], scale: scale * 0.95 },
        
        // Colorful flower beds in corners and sides
        { component: FlowerBed,   position: [-w * 0.32, 0, h * 0.28],   rotation: [0, 0, 0], scale: scale * 0.9, props: { variant: 0 } },
        { component: FlowerBed,   position: [w * 0.35, 0, -h * 0.32],   rotation: [0, Math.PI / 4, 0], scale: scale * 0.8, props: { variant: 1 } },
        { component: FlowerBed,   position: [-w * 0.15, 0, -h * 0.35],  rotation: [0, -Math.PI / 6, 0], scale: scale * 0.85, props: { variant: 2 } },
        { component: FlowerBed,   position: [w * 0.15, 0, h * 0.32],    rotation: [0, Math.PI / 3, 0], scale: scale * 0.75, props: { variant: 3 } },
        
        // Decorative grass patches for natural touch
        { component: DecorativeGrass, position: [-w * 0.08, 0, h * 0.15], rotation: [0, 0.2, 0], scale: scale * 1.2 },
        { component: DecorativeGrass, position: [w * 0.12, 0, -h * 0.18], rotation: [0, -0.8, 0], scale: scale * 1.1 },
        { component: DecorativeGrass, position: [-w * 0.22, 0, -h * 0.08], rotation: [0, 1.2, 0], scale: scale * 0.9 },
        
        // Modern garden lighting for evening ambiance
        { component: GardenLight, position: [-w * 0.38, 0, h * 0.12],   rotation: [0, 0, 0], scale: scale * 0.8 },
        { component: GardenLight, position: [w * 0.38, 0, -h * 0.15],   rotation: [0, 0, 0], scale: scale * 0.8 },
        
        // Central seating and water feature
        { component: GardenBench, position: [w * 0.05, 0, h * 0.08],    rotation: [0, Math.PI / 8, 0], scale: scale * 1.1 },
        { component: Fountain,    position: [-w * 0.05, 0, -h * 0.12],  rotation: [0, 0, 0], scale: scale * 0.9 },
        
        // Modern pathway connecting elements
        { component: Pathway,     position: [w * 0.08, 0, -h * 0.02],   rotation: [0, Math.PI / 6, 0], scale: scale * 1.1 },
        
        // Container plants for modern touch
        { component: PlantPot,    position: [w * 0.28, 0, h * 0.12],    rotation: [0, 0.3, 0], scale: scale * 0.7, props: { variant: 2 } },
        { component: PlantPot,    position: [-w * 0.18, 0, h * 0.35],   rotation: [0, -0.5, 0], scale: scale * 0.6, props: { variant: 1 } },
      );
      break;

    case 'dining':
      accessories.push(
        { component: DiningTable, position: [0, 0, 0],               rotation: [0, 0, 0], scale },
        { component: DiningChair, position: [-0.5 * scale, 0, 0.5],  rotation: [0, Math.PI, 0], scale },
        { component: DiningChair, position: [0.5 * scale, 0, 0.5],   rotation: [0, Math.PI, 0], scale },
        { component: DiningChair, position: [-0.5 * scale, 0, -0.5], rotation: [0, 0, 0], scale },
        { component: DiningChair, position: [0.5 * scale, 0, -0.5],  rotation: [0, 0, 0], scale },
        { component: PlantPot,    position: [-w * 0.35, 0, h * 0.35], rotation: [0, 0, 0], scale: scale * 0.8, props: { variant: 2 } },
        { component: FloorLamp,   position: [w * 0.35, 0, -h * 0.35], rotation: [0, 0, 0], scale },
      );
      break;

    case 'storage':
      accessories.push(
        { component: Bookshelf, position: [-w * 0.3, 0, 0],  rotation: [0, Math.PI / 2, 0], scale: scale * 0.85 },
        { component: Bookshelf, position: [w * 0.3, 0, 0],   rotation: [0, -Math.PI / 2, 0], scale: scale * 0.85 },
      );
      break;

    case 'lounge':
      accessories.push(
        { component: Rug,       position: [0, 0, 0],               rotation: [0, 0, 0], scale },
        { component: Sofa,      position: [0, 0, h * 0.2],         rotation: [0, 0, 0], scale: scale * 0.85 },
        { component: ArmChair,  position: [-w * 0.3, 0, -h * 0.1], rotation: [0, Math.PI / 3, 0], scale },
        { component: ArmChair,  position: [w * 0.3, 0, -h * 0.1],  rotation: [0, -Math.PI / 3, 0], scale },
        { component: CoffeeTable, position: [0, 0, -h * 0.05],     rotation: [0, 0, 0], scale },
        { component: FloorLamp, position: [w * 0.35, 0, h * 0.3],  rotation: [0, 0, 0], scale },
        { component: PlantPot,  position: [-w * 0.35, 0, h * 0.3], rotation: [0, 0, 0], scale, props: { variant: 1 } },
      );
      break;

    default:
      // Generic room â€“ add a small plant and rug
      if (w > 1.5 && h > 1.5) {
        accessories.push(
          { component: PlantPot, position: [w * 0.3, 0, -h * 0.3], rotation: [0, 0, 0], scale: scale * 0.6, props: { variant: 0 } },
        );
      }
      break;
  }

  return accessories;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN EXPORT â€“ Render all accessories for a room
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export const RoomAccessories = ({ roomType, roomWidth, roomHeight, roomDoors, roomId }) => {
  const accessories = useMemo(() => {
    let items = getRoomAccessories(roomType, roomWidth, roomHeight);
    
    // Ensure no furniture blocks the doors
    if (roomDoors && roomDoors.length > 0 && roomId) {
      const doorPositions = roomDoors.map(d => {
        const rp = d.roomPositions?.find(p => p.roomId === roomId) || (d.roomId === roomId ? { wall: d.wall, wallPosition: d.wallPosition } : null);
        if (!rp) return null;
        
        let dx = 0, dz = 0;
        if (rp.wall === 'north') {
          dx = rp.wallPosition || 0;
          dz = -roomHeight / 2;
        } else if (rp.wall === 'south') {
          dx = rp.wallPosition || 0;
          dz = roomHeight / 2;
        } else if (rp.wall === 'east') {
          dx = roomWidth / 2;
          dz = rp.wallPosition || 0;
        } else if (rp.wall === 'west') {
          dx = -roomWidth / 2;
          dz = rp.wallPosition || 0;
        }
        return { x: dx, z: dz };
      }).filter(Boolean);

      items = items.map(item => {
        const [ix, iy, iz] = item.position;
        // Check if item is too close to any door (e.g., within 1.5 meters)
        let isNearDoor = false;
        for (const dp of doorPositions) {
          const dist = Math.hypot(ix - dp.x, iz - dp.z);
          // 1.5m threshold ensures clear pathway around the door
          if (dist < 1.5) {
            isNearDoor = true;
            break;
          }
        }

        if (isNearDoor) {
          // Relocate to the opposite side of the room to avoid the door
          const mirroredItem = { ...item };
          mirroredItem.position = [-ix, iy, -iz];
          
          if (mirroredItem.rotation) {
            mirroredItem.rotation = [
              mirroredItem.rotation[0],
              mirroredItem.rotation[1] + Math.PI,
              mirroredItem.rotation[2]
            ];
          }
          return mirroredItem;
        }
        return item;
      });
    }
    
    return items;
  }, [roomType, roomWidth, roomHeight, roomDoors, roomId]);

  return (
    <>
      {accessories.map((acc, i) => {
        const Component = acc.component;
        return (
          <Component
            key={`${roomType}-acc-${i}`}
            position={acc.position}
            rotation={acc.rotation}
            scale={acc.scale}
            {...(acc.props || {})}
          />
        );
      })}
    </>
  );
};

export default RoomAccessories;
