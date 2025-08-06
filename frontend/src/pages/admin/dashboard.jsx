import React from "react";
import Graph from "../../components/admin/graph.jsx"; 

const Dashboard = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Dashboard</h1>
      <p style={styles.subheading}>Welcome back! Here's an overview of your platform.</p>

      {/* Overview Cards */}
      <div style={styles.cardsGrid}>
        <Card title="Total Users" value="12,483" change="+12.5%" />
        <Card title="Societies" value="532" change="+8.2%" />
        <Card title="Reviews" value="4,781" change="+24.3%" />
        <Card title="Approval Rate" value="94%" change="-2.1%" />
      </div>

      {/* Graph Sections */}
      <div style={styles.graphsContainer}>
        <Graph title="User Registration Trend" data={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]} />
        <Graph
          title="Society Distribution"
          data={[
            "Residential: 65",
            "Commercial: 40",
            "Mixed Use: 35",
            "Gated: 50",
            "Township: 25",
          ]}
        />
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <Activity message="New user registered" time="5 min ago" user="John Smith" />
        <Activity message="Society registration approved" time="15 min ago" user="Admin User" />
        <Activity
          message="New review submitted for Green Valley Society"
          time="42 min ago"
          user="Sarah Johnson"
        />
        <Activity
          message="Multiple negative reviews reported for Mountain View Apartments"
          time="1 hour ago"
          user="System"
        />
        <Activity
          message="New society registration request"
          time="2 hours ago"
          user="Michael Brown"
        />
      </div>
    </div>
  );
};

// Reusable Components
const Card = ({ title, value, change }) => (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>{title}</h3>
    <p style={styles.cardValue}>{value}</p>
    <p style={{ color: change.startsWith("+") ? "green" : "red" }}>
      {change} from last month
    </p>
  </div>
);

const Activity = ({ message, time, user }) => (
  <div style={styles.activityItem}>
    <p style={styles.activityMessage}>
      <strong>{message}</strong>
    </p>
    <p style={styles.activityTime}>{time}</p>
    <p style={styles.activityUser}>{user}</p>
  </div>
);

// Styles
const styles = {
  container: {
    padding: "20px",
    fontFamily: "Segoe UI, sans-serif",
    color: "#333",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "bold",
  },
  subheading: {
    marginBottom: "20px",
    color: "#666",
  },
  cardsGrid: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  card: {
    background: "#f7f7f7",
    padding: "15px 20px",
    borderRadius: "10px",
    flex: "1 1 200px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: "16px",
    marginBottom: "5px",
    color: "#777",
  },
  cardValue: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  graphsContainer: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: "20px",
    marginBottom: "10px",
    fontWeight: "bold",
  },
  activityItem: {
    background: "#fff",
    padding: "15px",
    borderLeft: "4px solid #007bff",
    marginBottom: "10px",
    borderRadius: "5px",
  },
  activityMessage: {
    margin: "0 0 5px 0",
  },
  activityTime: {
    fontSize: "12px",
    color: "#777",
  },
  activityUser: {
    fontSize: "14px",
    color: "#555",
  },
};

export default Dashboard;
