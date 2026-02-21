import React, { useState } from "react";
import { Stage, Layer, Rect, Text, Line } from "react-konva";
import { Box, Button, TextField } from "@mui/material";

const colors = ["#6C63FF", "#FF6584", "#43E97B", "#FFD86E", "#FFB347", "#A3A1FB"];

function FloorPlanKonva() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selected, setSelected] = useState([]);
  const [roomType, setRoomType] = useState("");
  const [roomCount, setRoomCount] = useState(1);
  const [stageSize] = useState({ width: 900, height: 600 });

  // Add nodes based on user input
  const handleAddRooms = () => {
    let newNodes = [...nodes];
    for (let i = 0; i < roomCount; i++) {
      newNodes.push({
        id: `${roomType}-${newNodes.length + 1}`,
        x: 100 + (i * 100),
        y: 100 + (newNodes.length * 40),
        color: colors[newNodes.length % colors.length],
        label: `${roomType} ${newNodes.length + 1}`
      });
    }
    setNodes(newNodes);
  };

  // Handle node drag
  const handleDragMove = (e, idx) => {
    const newNodes = nodes.slice();
    newNodes[idx].x = e.target.x();
    newNodes[idx].y = e.target.y();
    setNodes(newNodes);
  };

  // Handle node selection for connection
  const handleNodeClick = (idx) => {
    if (selected.length === 0) {
      setSelected([idx]);
    } else if (selected.length === 1 && selected[0] !== idx) {
      setEdges([...edges, { from: selected[0], to: idx }]);
      setSelected([]);
    } else {
      setSelected([]);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box sx={{ width: 340, background: "#2F3D57", color: "#fff", p: 4 }}>
        <TextField
          label="Room Type"
          variant="outlined"
          fullWidth
          value={roomType}
          onChange={e => setRoomType(e.target.value)}
          sx={{ mb: 2, background: "#fff" }}
        />
        <TextField
          label="Room Count"
          type="number"
          variant="outlined"
          fullWidth
          value={roomCount}
          onChange={e => setRoomCount(Number(e.target.value))}
          sx={{ mb: 2, background: "#fff" }}
        />
        <Button
          variant="contained"
          color="warning"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleAddRooms}
        >
          Add Rooms
        </Button>
      </Box>
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
        <Stage width={stageSize.width} height={stageSize.height} style={{ border: "2px solid #ED7600", borderRadius: 12 }}>
          <Layer>
            {/* Draw edges */}
            {edges.map((edge, i) => (
              <Line
                key={i}
                points={[
                  nodes[edge.from].x,
                  nodes[edge.from].y,
                  nodes[edge.to].x,
                  nodes[edge.to].y
                ]}
                stroke="#ED7600"
                strokeWidth={3}
              />
            ))}
            {/* Draw nodes as rectangles */}
            {nodes.map((node, idx) => (
              <React.Fragment key={node.id}>
                <Rect
                  x={node.x - 40}
                  y={node.y - 25}
                  width={80}
                  height={50}
                  fill={node.color}
                  stroke={selected[0] === idx ? "#ED7600" : "#fff"}
                  strokeWidth={selected[0] === idx ? 6 : 3}
                  draggable
                  onDragMove={e => handleDragMove(e, idx)}
                  onClick={() => handleNodeClick(idx)}
                  shadowBlur={selected[0] === idx ? 10 : 0}
                  shadowColor="#ED7600"
                  cornerRadius={10}
                />
                <Text
                  x={node.x - 35}
                  y={node.y - 10}
                  text={node.label}
                  fontSize={16}
                  fill="#222"
                  width={70}
                  align="center"
                />
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </Box>
    </Box>
  );
}

export default FloorPlanKonva;
