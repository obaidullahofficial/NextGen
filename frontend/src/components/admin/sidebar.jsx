import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../..//assets/Images/logo.png";
import { AuthContext } from '../../context/AuthContext';

// Lucide icons
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "User Management",
      path: "/UserManagementDashboard",
      icon: <Users size={18} />,
    },
    {
      name: "Society Management",
      path: "/society-management",
      icon: <Building2 size={18} />,
    },
    {
      name: "Review Management",
      path: "/review-management",
      icon: <MessageSquare size={18} />,
    },
     {
      name: "Advertisement Management",
      path: "/advertisement-management",
      icon: <MessageSquare size={18} />,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <BarChart3 size={18} />,
    },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logoWrapper}>
            <img src={logo} alt="Logo" style={styles.logo} />
          </div>
          <p style={styles.architectTitle}>NextGenArchitect</p>
        </div>
      </div>
      <nav style={styles.navContainer}>
        <div>
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.name === "Dashboard" && location.pathname === "/");
            const isHovered = hoveredItem === item.name;

            return (
              <Link
                key={item.name}
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  ...styles.menuItem,
                  backgroundColor: isActive
                    ? "#ed7600"
                    : isHovered
                    ? "#ffc100"
                    : "transparent",
                  color: isActive || isHovered ? "#fff" : "#eee",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Bottom-aligned Logout Button */}
        <div style={styles.bottomSection}>
          <div style={styles.divider}></div>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

const styles = {
  sidebar: {
    width: "310px",
    height: "100vh",
    backgroundColor: "#2f3d57",
    padding: "20px",
    boxSizing: "border-box",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: 'sticky',
    top: 0,
    color: 'white',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: "30px",
    borderBottom: "1px solid #455a75",
    paddingBottom: "20px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoWrapper: {
    backgroundColor: "#ffffff",
    padding: "6px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "50px",
    height: "50px",
    boxShadow: "0 0 8px rgba(255, 255, 255, 0.2)",
  },
  logo: {
    width: "50px",
    height: "50px",
    objectFit: "contain",
  },
  architectTitle: {
    margin: 0,
    color: "#fff",
    fontWeight: "600",
    fontSize: "21px",
  },
  navContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
  },
  menuItem: {
    padding: "12px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "10px",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  bottomSection: {
    marginTop: 'auto',
  },
  divider: {
    borderTop: "1px solid #455a75",
    marginBottom: "10px",
  },
  logoutButton: {
    width: '100%',
    padding: "12px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
    backgroundColor: 'transparent',
    color: '#eee',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
};

export default Sidebar;
