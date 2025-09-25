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
import userAPI from "../../services/userAPI";
import { societyProfileAPI } from "../../services/societyProfileAPI";
import reviewAPI from "../../services/reviewAPI";
import advertisementAPI from "../../services/advertisementAPI";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    users: {
      total: 0,
      active: 0,
      newThisMonth: 0,
      growthRate: 0
    },
    societies: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    },
    reviews: {
      total: 0,
      averageRating: 0,
      positive: 0,
      negative: 0
    },
    advertisements: {
      total: 0,
      active: 0,
      featured: 0,
      totalViews: 0,
      totalContacts: 0
    },
    recentActivity: []
  });
  const [error, setError] = useState(null);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from all APIs in parallel
      const [usersResult, societiesResult, reviewsResult, advertisementsResult] = await Promise.allSettled([
        userAPI.getAllUsers(),
        societyProfileAPI.getAllSocieties(),
        reviewAPI.getAllReviews(),
        advertisementAPI.getAllAdvertisements()
      ]);

      // Process users data
      let usersData = { total: 0, active: 0, newThisMonth: 0, growthRate: 0 };
      if (usersResult.status === 'fulfilled' && usersResult.value.success) {
        const users = usersResult.value.data || [];
        const currentDate = new Date();
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        
        usersData = {
          total: users.length,
          active: users.filter(user => user.status === 'active' || !user.status).length,
          newThisMonth: users.filter(user => {
            const userDate = new Date(user.created_at || user.createdAt || user.dateCreated);
            return userDate >= lastMonth;
          }).length,
          growthRate: users.length > 0 ? ((users.filter(user => {
            const userDate = new Date(user.created_at || user.createdAt || user.dateCreated);
            return userDate >= lastMonth;
          }).length / users.length) * 100).toFixed(1) : 0
        };
      }

      // Process societies data
      let societiesData = { total: 0, approved: 0, pending: 0, rejected: 0 };
      if (societiesResult.status === 'fulfilled' && societiesResult.value.success) {
        const societies = societiesResult.value.data || [];
        societiesData = {
          total: societies.length,
          approved: societies.filter(society => society.status === 'approved').length,
          pending: societies.filter(society => society.status === 'pending').length,
          rejected: societies.filter(society => society.status === 'rejected').length
        };
      }

      // Process reviews data
      let reviewsData = { total: 0, averageRating: 0, positive: 0, negative: 0 };
      if (reviewsResult.status === 'fulfilled' && reviewsResult.value.success) {
        const reviews = reviewsResult.value.data || [];
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        reviewsData = {
          total: reviews.length,
          averageRating: reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0,
          positive: reviews.filter(review => (review.rating || 0) >= 4).length,
          negative: reviews.filter(review => (review.rating || 0) <= 2).length
        };
      }

      // Process advertisements data
      let advertisementsData = { total: 0, active: 0, featured: 0, totalViews: 0, totalContacts: 0 };
      if (advertisementsResult.status === 'fulfilled' && advertisementsResult.value.success) {
        const advertisements = advertisementsResult.value.data || [];
        advertisementsData = {
          total: advertisements.length,
          active: advertisements.filter(ad => ad.status === 'active').length,
          featured: advertisements.filter(ad => ad.is_featured).length,
          totalViews: advertisements.reduce((sum, ad) => sum + (ad.view_count || 0), 0),
          totalContacts: advertisements.reduce((sum, ad) => sum + (ad.contact_count || 0), 0)
        };
      }

      // Generate recent activity from all data
      const recentActivity = generateRecentActivity(
        usersResult.value?.data || [],
        societiesResult.value?.data || [],
        reviewsResult.value?.data || [],
        advertisementsResult.value?.data || []
      );

      setDashboardData({
        users: usersData,
        societies: societiesData,
        reviews: reviewsData,
        advertisements: advertisementsData,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate recent activity from all data sources
  const generateRecentActivity = (users, societies, reviews, advertisements) => {
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
      const societyDate = new Date(society.created_at || society.createdAt);
      const timeDiff = Math.floor((currentTime - societyDate) / (1000 * 60));
      activities.push({
        message: `Society ${society.status === 'approved' ? 'approved' : 'registered'}: ${society.society_name}`,
        time: timeDiff < 60 ? `${timeDiff} min ago` : `${Math.floor(timeDiff / 60)} hours ago`,
        user: society.status === 'approved' ? 'Admin' : society.contact_person || 'Society Manager',
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

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateApprovalRate = () => {
    const total = dashboardData.societies.total;
    const approved = dashboardData.societies.approved;
    return total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <AlertTriangle size={48} color="#ff6b6b" />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} style={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Admin Dashboard</h1>
         
        </div>
        <button onClick={fetchDashboardData} style={styles.refreshButton}>
          <Activity size={16} />
          Refresh Data
        </button>
      </div>

      {/* Overview Cards */}
      <div style={styles.cardsGrid}>
        <Card 
          title="Total Users" 
          value={dashboardData.users.total.toLocaleString()} 
          change={`+${dashboardData.users.growthRate}%`}
          icon={Users}
          color="#4CAF50"
          subtitle={`${dashboardData.users.active} active users`}
        />
        <Card 
          title="Societies" 
          value={dashboardData.societies.total.toLocaleString()} 
          change={`${calculateApprovalRate()}% approved`}
          icon={Building}
          color="#2196F3"
          subtitle={`${dashboardData.societies.pending} pending approval`}
        />
        <Card 
          title="Reviews" 
          value={dashboardData.reviews.total.toLocaleString()} 
          change={`${dashboardData.reviews.averageRating}⭐ avg rating`}
          icon={Star}
          color="#FF9800"
          subtitle={`${dashboardData.reviews.positive} positive reviews`}
        />
        <Card 
          title="Advertisements" 
          value={dashboardData.advertisements.total.toLocaleString()} 
          change={`${dashboardData.advertisements.totalViews} total views`}
          icon={FileText}
          color="#9C27B0"
          subtitle={`${dashboardData.advertisements.active} active listings`}
        />
      </div>

      {/* Detailed Stats Grid */}
      <div style={styles.statsGrid}>
        <StatsCard title="User Statistics" data={[
          { label: "Total Users", value: dashboardData.users.total, icon: Users },
          { label: "Active Users", value: dashboardData.users.active, icon: CheckCircle },
          { label: "New This Month", value: dashboardData.users.newThisMonth, icon: TrendingUp }
        ]} />
        
        <StatsCard title="Society Management" data={[
          { label: "Total Societies", value: dashboardData.societies.total, icon: Building },
          { label: "Approved", value: dashboardData.societies.approved, icon: CheckCircle },
          { label: "Pending Review", value: dashboardData.societies.pending, icon: Clock }
        ]} />
        
        <StatsCard title="Review Analytics" data={[
          { label: "Total Reviews", value: dashboardData.reviews.total, icon: MessageSquare },
          { label: "Positive Reviews", value: dashboardData.reviews.positive, icon: Star },
          { label: "Average Rating", value: `${dashboardData.reviews.averageRating}/5`, icon: BarChart3 }
        ]} />
        
        <StatsCard title="Advertisement Metrics" data={[
          { label: "Total Ads", value: dashboardData.advertisements.total, icon: FileText },
          { label: "Total Views", value: dashboardData.advertisements.totalViews, icon: Eye },
          { label: "Total Contacts", value: dashboardData.advertisements.totalContacts, icon: Phone }
        ]} />
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
    <p style={{ 
      color: change.startsWith("+") ? "#4CAF50" : change.includes("⭐") ? "#FF9800" : "#666",
      fontSize: "14px",
      margin: "8px 0 0 0"
    }}>
      {change}
    </p>
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
    backgroundColor: "#f8f9fa",
    minHeight: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px"
  },
  heading: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 8px 0"
  },
  subheading: {
    margin: "0",
    color: "#666",
    fontSize: "16px"
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "32px"
  },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  cardTitle: {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 8px 0",
    fontWeight: "500",
    textTransform: "uppercase"
  },
  cardValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0"
  },
  cardSubtitle: {
    fontSize: "12px",
    color: "#888",
    margin: "4px 0 0 0"
  },
  cardIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "32px"
  },
  statsCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  statsCardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: "0 0 16px 0"
  },
  statsCardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  statIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "#f1f3f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#495057"
  },
  statLabel: {
    fontSize: "14px",
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
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  sectionTitle: {
    fontSize: "20px",
    marginBottom: "16px",
    fontWeight: "600",
    color: "#1a1a1a"
  },
  activityContainer: {
    maxHeight: "400px",
    overflowY: "auto"
  },
  activityItem: {
    background: "#f8f9fa",
    padding: "16px",
    marginBottom: "12px",
    borderRadius: "8px",
    transition: "background-color 0.2s ease"
  },
  activityHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px"
  },
  activityIconContainer: {
    width: "32px",
    height: "32px",
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
    margin: "0 0 8px 0",
    fontSize: "14px",
    color: "#1a1a1a",
    fontWeight: "500"
  },
  activityMeta: {
    display: "flex",
    gap: "12px",
    fontSize: "12px",
    color: "#666"
  },
  activityTime: {
    fontWeight: "500"
  },
  activityUser: {},
  noActivity: {
    textAlign: "center",
    padding: "40px",
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
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #007bff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px"
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
    padding: "12px 24px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "16px"
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
