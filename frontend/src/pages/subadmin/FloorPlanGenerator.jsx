import React, { useState } from "react";
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
} from "reactflow"; // âœ… updated import
import "reactflow/dist/style.css"; // âœ… required for styles

const initialNodes = [];
const initialEdges = [];

const roomColors = {
  Bedroom: "#ED7600",      // Orange (primary theme color)
  Bathroom: "#2F3D57",     // Dark blue (secondary theme color)
  Kitchen: "#ED7600",      // Orange (primary theme color)
  LivingRoom: "#2F3D57"    // Dark blue (secondary theme color)
};

function FloorPlanGenerator() {
  const [plotX, setPlotX] = useState(0);
  const [plotY, setPlotY] = useState(0);
  const [roomCounts, setRoomCounts] = useState({
    Bedroom: 0,
    Bathroom: 0,
    Kitchen: 0,
    LivingRoom: 0
  });
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "plotX") setPlotX(Number(value));
    else if (name === "plotY") setPlotY(Number(value));
    else setRoomCounts({ ...roomCounts, [name]: Number(value) });
  };

  const generateNodes = () => {
    let newNodes = [];
    let id = 1;
    Object.entries(roomCounts).forEach(([room, count]) => {
      for (let i = 0; i < count; i++) {
        newNodes.push({
          id: `${room}-${i + 1}`,
          data: { label: `${room} ${i + 1}` },
          position: { x: 100 + (i * 120), y: 100 + (id * 80) },
          style: {
            background: roomColors[room],
            color: "#222",
            fontWeight: "bold",
            boxShadow: selectedNode === `${room}-${i + 1}` ? "0 0 0 4px #ED7600" : "0 2px 8px rgba(0,0,0,0.1)",
            cursor: "pointer"
          }
        });
        id++;
      }
    });
    setNodes(newNodes);
    setEdges([]);
    setSelectedNode(null);
  };

  // Manual connection mode: click one node, then another to connect
  const onNodeClick = (event, node) => {
    if (!selectedNode) {
      setSelectedNode(node.id);
    } else if (selectedNode !== node.id) {
      setEdges((eds) => addEdge({ source: selectedNode, target: node.id }, eds));
      setSelectedNode(null);
    }
  };

  const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, background: "#f8f9fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "95%", height: "90vh", background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "2px solid #ED7600", marginBottom: 24 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            onConnect={onConnect}
            fitView
            nodesDraggable={true}
            panOnDrag={true}
          >
            <MiniMap />
            <Controls />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </div>
      </div>
      <div style={{ width: 340, background: "#2F3D57", color: "#fff", padding: 32, height: "100vh", boxSizing: "border-box" }}>
        <h2 style={{ marginBottom: 24 }}>Map Constraints</h2>
        <label>Plot X Dimension (in feet)</label>
        <input
          type="number"
          name="plotX"
          value={plotX}
          onChange={handleInputChange}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <label>Plot Y Dimension (in feet)</label>
        <input
          type="number"
          name="plotY"
          value={plotY}
          onChange={handleInputChange}
          style={{ width: "100%", marginBottom: 12 }}
        />
        {Object.keys(roomCounts).map((room) => (
          <div key={room}>
            <label>{room}</label>
            <input
              type="number"
              name={room}
              value={roomCounts[room]}
              onChange={handleInputChange}
              style={{ width: "100%", marginBottom: 12 }}
            />
          </div>
        ))}
        <button
          style={{ width: "100%", background: "#ED7600", color: "#fff", padding: 12, border: "none", borderRadius: 4, marginTop: 16 }}
          onClick={generateNodes}
        >
          Generate Floorplan
        </button>
      </div>
    </div>
  );
}

export default FloorPlanGenerator;
