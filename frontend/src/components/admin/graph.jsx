import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Graph = ({ title, data }) => {
  const formattedData = data.map((item) => {
    if (typeof item === "string" && item.includes(":")) {
      const [name, value] = item.split(": ");
      return { name, value: Number(value) };
    }
    return { name: item, value: Math.floor(Math.random() * 1000) };
  });

  return (
    <div style={{ flex: 1, margin: "0 10px", backgroundColor: "#fff", padding: "20px", borderRadius: "8px" }}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#ff8f00" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Graph;
