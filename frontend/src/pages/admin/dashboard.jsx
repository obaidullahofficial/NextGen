import React, { useState, useEffect } from "react";
import { 
  Users, 
  Building, 
  Star, 
  MessageSquare, 
  TrendingUp, 
  Activity, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Phone,
  BarChart3
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";

const Dashboard = () => {
  const {
    users,
    societies,
    reviews,
    advertisements,
    stats,
    loading,
    errors,
    refreshData,
    lastUpdated,
    hasData
  } = useAdminData();

  const [error, setError] = useState(null);

  // Check if we have any critical errors
  useEffect(() => {
    const criticalErrors = Object.values(errors).filter(err => err !== null);
    if (criticalErrors.length > 0) {
      setError(`Failed to load some data: ${criticalErrors.join(', ')}`);
    } else {
      setError(null);
    }
  }, [errors]);

  // Generate recent activity from global data
  const generateRecentActivity = () => {
    const activities = [];
    const currentTime = new Date();

    // Recent users (last 5)
    users.slice(-5).forEach(user => {
      const userDate = new Date(user.created_at || user.createdAt || user.dateCreated);
      const timeDiff = Math.floor((currentTime - userDate) / (1000 * 60));
      activities.push({
        message: `New user registered: ${user.full_name || user.name || user.email}`,
        time: timeDiff < 60 ? `${timeDiff} min ago` : `${Math.floor(timeDiff / 60)} hours ago`,
        user: user.full_name || user.name || 'New User',
        type: 'user',
        icon: Users
      });
    });

    // Recent societies (last 3)
    societies.slice(-3).forEach(society => {
      const societyDate = new Date(society.created_at || society.createdAt || society.registration_date);
      const timeDiff = Math.floor((currentTime - societyDate) / (1000 * 60));
      const status = society.status || society.registration_status || society.verification_status || 'registered';
      const societyName = society.society_name || society.name || 'Unknown Society';
      
      activities.push({
        message: `Society ${status === 'approved' ? 'approved' : 'registered'}: ${societyName}`,
        time: timeDiff < 60 ? `${timeDiff} min ago` : `${Math.floor(timeDiff / 60)} hours ago`,
        user: status === 'approved' ? 'Admin' : society.contact_person || society.representative_name || 'Society Manager',
        type: 'society',
        icon: Building
      });
    });

    // Recent reviews (last 3)
    reviews.slice(-3).forEach(review => {
      const reviewDate = new Date(review.created_at || review.createdAt);
      const timeDiff = Math.floor((currentTime - reviewDate) / (1000 * 60));
      activities.push({
        message: `New review (${review.rating}⭐): ${review.comment?.substring(0, 50) || 'Review submitted'}...`,
        time: timeDiff < 60 ? `${timeDiff} min ago` : `${Math.floor(timeDiff / 60)} hours ago`,
        user: review.user_email || 'Anonymous User',
        type: 'review',
        icon: Star
      });
    });

    // Recent advertisements (last 2)
    advertisements.slice(-2).forEach(ad => {
      const adDate = new Date(ad.created_at || ad.createdAt);
      const timeDiff = Math.floor((currentTime - adDate) / (1000 * 60));
      activities.push({
        message: `New advertisement: ${ad.society_name}`,
        time: timeDiff < 60 ? `${timeDiff} min ago` : `${Math.floor(timeDiff / 60)} hours ago`,
        user: ad.created_by || 'Property Owner',
        type: 'advertisement',
        icon: FileText
      });
    });

    // Sort by most recent and return top 10
    return activities.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 10);
  };

  const calculateApprovalRate = () => {
    return stats.societies.total > 0 ? 
      ((stats.societies.approved / stats.societies.total) * 100).toFixed(1) : 0;
  };

  // Manual refresh function
  const handleRefresh = async () => {
    console.log('[Dashboard] Manual refresh requested');
    await refreshData('all');
  };

  if (loading.overall) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard data...</p>
        <p style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>
          Loading all admin data in background...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <AlertTriangle size={48} color="#ff6b6b" />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={handleRefresh} style={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Overview Cards */}
      <div style={styles.cardsGrid}>
        <Card 
          title="Total Users" 
          value={stats.users.total.toLocaleString()} 
          icon={Users}
          color="#4CAF50"
          subtitle={`${stats.users.active} active users`}
        />
        <Card 
          title="Society Registrations" 
          value={stats.societies.total.toLocaleString()} 
          icon={Building}
          color="#2196F3"
          subtitle={`${stats.societies.pending} pending approval`}
        />
        <Card 
          title="Reviews" 
          value={stats.reviews.total.toLocaleString()} 
          icon={Star}
          color="#FF9800"
          subtitle={`${stats.reviews.positive} positive reviews`}
        />
        <Card 
          title="Advertisements" 
          value={stats.advertisements.total.toLocaleString()} 
          icon={FileText}
          color="#9C27B0"
          subtitle={`${stats.advertisements.active} active listings`}
        />
      </div>

      {/* Detailed Stats Grid */}
      <div style={styles.statsGrid}>
        <StatsCard title="User Statistics" data={[
          { label: "Total Users", value: stats.users.total, icon: Users },
          { label: "Active Users", value: stats.users.active, icon: CheckCircle },
          { label: "New This Month", value: stats.users.newThisMonth, icon: TrendingUp }
        ]} />
        
        <StatsCard title="Society Registration Management" data={[
          { label: "Total Registrations", value: stats.societies.total, icon: Building },
          { label: "Approved", value: stats.societies.approved, icon: CheckCircle },
          { label: "Pending Review", value: stats.societies.pending, icon: Clock }
        ]} />
        
        <StatsCard title="Review Analytics" data={[
          { label: "Total Reviews", value: stats.reviews.total, icon: MessageSquare },
          { label: "Positive Reviews", value: stats.reviews.positive, icon: Star },
          { label: "Average Rating", value: `${stats.reviews.averageRating.toFixed(1)}/5`, icon: BarChart3 }
        ]} />
        
        <StatsCard title="Advertisement Metrics" data={[
          { label: "Total Ads", value: stats.advertisements.total, icon: FileText },
          { label: "Total Views", value: stats.advertisements.totalViews, icon: Eye },
          { label: "Total Contacts", value: stats.advertisements.totalContacts, icon: Phone }
        ]} />
      </div>

      {/* Recent Activity Section */}
      {hasData('users') || hasData('societies') || hasData('reviews') || hasData('advertisements') ? (
        <div style={styles.activitySection}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <div style={styles.activityContainer}>
            {generateRecentActivity().length > 0 ? (
              generateRecentActivity().map((activity, index) => (
                <ActivityItem
                  key={index}
                  message={activity.message}
                  time={activity.time}
                  user={activity.user}
                  icon={activity.icon}
                  type={activity.type}
                />
              ))
            ) : (
              <div style={styles.noActivity}>
                <Activity size={48} color="#ccc" />
                <p>No recent activity to display</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Data Freshness Indicator */}
      <div style={styles.dataFreshness}>
        <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>
          Last updated: {lastUpdated.users ? new Date(lastUpdated.users).toLocaleTimeString() : 'Loading...'}
          {' | '}
          <button 
            onClick={handleRefresh} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#007bff', 
              cursor: 'pointer',
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            Refresh now
          </button>
        </p>
      </div>
    </div>
  );
};

// Enhanced Card Component
const Card = ({ title, value, change, icon: Icon, color, subtitle }) => (
  <div style={{...styles.card, borderLeft: `4px solid ${color}`}}>
    <div style={styles.cardHeader}>
      <div>
        <h3 style={styles.cardTitle}>{title}</h3>
        <p style={styles.cardValue}>{value}</p>
        {subtitle && <p style={styles.cardSubtitle}>{subtitle}</p>}
      </div>
      <div style={{...styles.cardIcon, backgroundColor: `${color}20`}}>
        <Icon size={24} color={color} />
      </div>
    </div>
    {change && (
      <p style={{ 
        color: change.startsWith("+") ? "#4CAF50" : change.includes("⭐") ? "#FF9800" : "#666",
        fontSize: "14px",
        margin: "8px 0 0 0"
      }}>
        {change}
      </p>
    )}
  </div>
);

// Stats Card Component
const StatsCard = ({ title, data }) => (
  <div style={styles.statsCard}>
    <h3 style={styles.statsCardTitle}>{title}</h3>
    <div style={styles.statsCardContent}>
      {data.map((item, index) => (
        <div key={index} style={styles.statItem}>
          <div style={styles.statIcon}>
            <item.icon size={16} />
          </div>
          <div>
            <p style={styles.statLabel}>{item.label}</p>
            <p style={styles.statValue}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced Activity Component
const ActivityItem = ({ message, time, user, icon: Icon, type }) => (
  <div style={{...styles.activityItem, borderLeft: `3px solid ${getTypeColor(type)}`}}>
    <div style={styles.activityHeader}>
      <div style={styles.activityIconContainer}>
        <Icon size={16} color={getTypeColor(type)} />
      </div>
      <div style={styles.activityContent}>
        <p style={styles.activityMessage}>{message}</p>
        <div style={styles.activityMeta}>
          <span style={styles.activityTime}>{time}</span>
          <span style={styles.activityUser}>by {user}</span>
        </div>
      </div>
    </div>
  </div>
);

// Helper function to get color by activity type
const getTypeColor = (type) => {
  const colors = {
    user: '#4CAF50',
    society: '#2196F3',
    review: '#FF9800',
    advertisement: '#9C27B0'
  };
  return colors[type] || '#666';
};

// Styles
const styles = {
  container: {
    padding: "24px",
    fontFamily: "Segoe UI, sans-serif",
    color: "#333",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    maxWidth: "1280px",
    margin: "0 auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px"
  },
  heading: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 6px 0"
  },
  subheading: {
    margin: "0",
    color: "#666",
    fontSize: "14px"
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500"
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
    marginBottom: "24px"
  },
  card: {
    background: "white",
    padding: "18px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  cardTitle: {
    fontSize: "13px",
    color: "#666",
    margin: "0 0 6px 0",
    fontWeight: "500",
    textTransform: "uppercase"
  },
  cardValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0"
  },
  cardSubtitle: {
    fontSize: "11px",
    color: "#888",
    margin: "3px 0 0 0"
  },
  cardIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "24px"
  },
  statsCard: {
    background: "white",
    padding: "18px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
  },
  statsCardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: "0 0 12px 0"
  },
  statsCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  statIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    backgroundColor: "#f1f3f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#495057"
  },
  statLabel: {
    fontSize: "12px",
    color: "#666",
    margin: "0"
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: "2px 0 0 0"
  },
  activitySection: {
    background: "white",
    padding: "18px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
  },
  sectionTitle: {
    fontSize: "18px",
    marginBottom: "14px",
    fontWeight: "600",
    color: "#1a1a1a"
  },
  activityContainer: {
    maxHeight: "350px",
    overflowY: "auto"
  },
  activityItem: {
    background: "#f8f9fa",
    padding: "12px",
    marginBottom: "10px",
    borderRadius: "6px",
    transition: "background-color 0.2s ease"
  },
  activityHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px"
  },
  activityIconContainer: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  activityContent: {
    flex: 1
  },
  activityMessage: {
    margin: "0 0 6px 0",
    fontSize: "13px",
    color: "#1a1a1a",
    fontWeight: "500"
  },
  activityMeta: {
    display: "flex",
    gap: "10px",
    fontSize: "11px",
    color: "#666"
  },
  activityTime: {
    fontWeight: "500"
  },
  activityUser: {},
  noActivity: {
    textAlign: "center",
    padding: "30px",
    color: "#666"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "#666"
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #007bff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "12px"
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    textAlign: "center",
    color: "#666"
  },
  retryButton: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "12px"
  },
  dataFreshness: {
    marginTop: "18px",
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    border: "1px solid #e9ecef"
  }
};

// Add CSS keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;
