import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import userAPI from '../services/userAPI';
import reviewAPI from '../services/reviewAPI';
import advertisementAPI from '../services/advertisementAPI';
import { getPlots } from '../services/plotService';

// API for Society Registrations
const societyRegistrationAPI = {
  getAll: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('$API_URL/society-registrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminDataContext] Society registrations loaded:', data.societies?.length || 0);
      
      return {
        success: true,
        data: data.societies || data.registrations || data.data || data || []
      };
    } catch (error) {
      console.error('[AdminDataContext] Error fetching society registrations:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
};

// Initial state for all admin data
const initialState = {
  // Data loading states
  loading: {
    users: false,
    societies: false,
    reviews: false,
    advertisements: false,
    plots: false,
    overall: false
  },
  
  // Error states
  errors: {
    users: null,
    societies: null,
    reviews: null,
    advertisements: null,
    plots: null
  },
  
  // Data
  users: [],
  societies: [],
  reviews: [],
  advertisements: [],
  plots: [],
  
  // Computed statistics
  stats: {
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
      rejected: 0,
      suspended: 0,
      complete: 0,
      incomplete: 0
    },
    reviews: {
      total: 0,
      averageRating: 0,
      positive: 0,
      negative: 0,
      published: 0
    },
    advertisements: {
      total: 0,
      active: 0,
      pending: 0,
      rejected: 0,
      totalViews: 0,
      totalContacts: 0
    },
    plots: {
      total: 0,
      available: 0,
      sold: 0,
      reserved: 0
    }
  },
  
  // Last updated timestamps
  lastUpdated: {
    users: null,
    societies: null,
    reviews: null,
    advertisements: null,
    plots: null
  },
  
  // Configuration
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  backgroundLoading: true
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USERS: 'SET_USERS',
  SET_SOCIETIES: 'SET_SOCIETIES',
  SET_REVIEWS: 'SET_REVIEWS',
  SET_ADVERTISEMENTS: 'SET_ADVERTISEMENTS',
  SET_PLOTS: 'SET_PLOTS',
  SET_STATS: 'SET_STATS',
  SET_LAST_UPDATED: 'SET_LAST_UPDATED',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_BACKGROUND_LOADING: 'SET_BACKGROUND_LOADING'
};

// Reducer function
const adminDataReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.loading,
          overall: action.payload.overall !== undefined ? action.payload.overall : state.loading.overall
        }
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.type]: action.payload.error
        }
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.type]: null
        }
      };
      
    case ActionTypes.SET_USERS:
      return {
        ...state,
        users: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          users: new Date().toISOString()
        }
      };
      
    case ActionTypes.SET_SOCIETIES:
      return {
        ...state,
        societies: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          societies: new Date().toISOString()
        }
      };
      
    case ActionTypes.SET_REVIEWS:
      return {
        ...state,
        reviews: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          reviews: new Date().toISOString()
        }
      };
      
    case ActionTypes.SET_ADVERTISEMENTS:
      return {
        ...state,
        advertisements: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          advertisements: new Date().toISOString()
        }
      };
      
    case ActionTypes.SET_PLOTS:
      return {
        ...state,
        plots: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          plots: new Date().toISOString()
        }
      };
      
    case ActionTypes.SET_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      };
      
    case ActionTypes.SET_BACKGROUND_LOADING:
      return {
        ...state,
        backgroundLoading: action.payload
      };
      
    default:
      return state;
  }
};

// Helper function to calculate statistics
const calculateStats = (users, societies, reviews, advertisements, plots = []) => {
  // User statistics
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  
  const userStats = {
    total: users.length,
    active: users.filter(user => user.status === 'active' || !user.status).length,
    newThisMonth: users.filter(user => {
      const userDate = new Date(user.created_at || user.createdAt || user.dateCreated);
      return userDate >= lastMonth;
    }).length,
    growthRate: users.length > 0 ? ((users.filter(user => {
      const userDate = new Date(user.created_at || user.createdAt || user.dateCreated);
      return userDate >= lastMonth;
    }).length / users.length) * 100) : 0
  };

  // Society statistics
  const societyStats = {
    total: societies.length,
    approved: societies.filter(society => 
      society.status === 'approved' || 
      society.registration_status === 'approved' ||
      society.verification_status === 'approved'
    ).length,
    pending: societies.filter(society => 
      society.status === 'pending' || 
      society.registration_status === 'pending' ||
      society.verification_status === 'pending'
    ).length,
    rejected: societies.filter(society => 
      society.status === 'rejected' || 
      society.registration_status === 'rejected' ||
      society.verification_status === 'rejected'
    ).length,
    suspended: societies.filter(society => 
      society.status === 'suspended' || 
      society.registration_status === 'suspended' ||
      society.verification_status === 'suspended'
    ).length,
    complete: societies.filter(society => 
      society.is_complete === true || 
      society.registration_complete === true ||
      society.status === 'approved'
    ).length,
    incomplete: societies.filter(society => 
      society.is_complete === false || 
      society.is_complete === null || 
      society.is_complete === undefined ||
      society.registration_complete === false ||
      society.status === 'pending'
    ).length
  };

  // Review statistics
  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const reviewStats = {
    total: reviews.length,
    averageRating: reviews.length > 0 ? (totalRating / reviews.length) : 0,
    positive: reviews.filter(review => (review.rating || 0) >= 4).length,
    negative: reviews.filter(review => (review.rating || 0) <= 2).length,
    published: reviews.filter(review => 
      review.status === 'published' || 
      review.status === 'approved' || 
      !review.status
    ).length
  };

  // Advertisement statistics
  const adStats = {
    total: advertisements.length,
    active: advertisements.filter(ad => ad.status === 'active').length,
    pending: advertisements.filter(ad => ad.status === 'pending').length,
    rejected: advertisements.filter(ad => ad.status === 'rejected').length,
    totalViews: advertisements.reduce((sum, ad) => sum + (ad.view_count || 0), 0),
    totalContacts: advertisements.reduce((sum, ad) => sum + (ad.contact_count || 0), 0)
  };

  // Plot statistics
  const plotStats = {
    total: plots.length,
    available: plots.filter(plot => 
      plot.status === 'Available' || 
      plot.status === 'available'
    ).length,
    sold: plots.filter(plot => 
      plot.status === 'Sold' || 
      plot.status === 'sold'
    ).length,
    reserved: plots.filter(plot => 
      plot.status === 'Reserved' || 
      plot.status === 'reserved'
    ).length
  };

  return {
    users: userStats,
    societies: societyStats,
    reviews: reviewStats,
    advertisements: adStats,
    plots: plotStats
  };
};

// Create context
const AdminDataContext = createContext();

// Custom hook to use the context
export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};

// Provider component
export const AdminDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminDataReducer, initialState);

  // Load users data
  const loadUsers = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'users', loading: true } });
    dispatch({ type: ActionTypes.CLEAR_ERROR, payload: { type: 'users' } });

    try {
      console.log('[AdminDataContext] Loading users...');
      const result = await userAPI.getAllUsers();
      
      if (result.success) {
        const users = Array.isArray(result.data) ? result.data : [];
        dispatch({ type: ActionTypes.SET_USERS, payload: users });
        console.log(`[AdminDataContext] Users loaded: ${users.length}`);
      } else {
        throw new Error(result.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('[AdminDataContext] Error loading users:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { type: 'users', error: error.message } });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'users', loading: false } });
    }
  }, []);

  // Load societies data
  const loadSocieties = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'societies', loading: true } });
    dispatch({ type: ActionTypes.CLEAR_ERROR, payload: { type: 'societies' } });

    try {
      console.log('[AdminDataContext] Loading societies...');
      const result = await societyRegistrationAPI.getAll();
      
      if (result.success) {
        const societies = Array.isArray(result.data) ? result.data : [];
        dispatch({ type: ActionTypes.SET_SOCIETIES, payload: societies });
        console.log(`[AdminDataContext] Societies loaded: ${societies.length}`);
      } else {
        throw new Error(result.error || 'Failed to load societies');
      }
    } catch (error) {
      console.error('[AdminDataContext] Error loading societies:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { type: 'societies', error: error.message } });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'societies', loading: false } });
    }
  }, []);

  // Load reviews data
  const loadReviews = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'reviews', loading: true } });
    dispatch({ type: ActionTypes.CLEAR_ERROR, payload: { type: 'reviews' } });

    try {
      console.log('[AdminDataContext] Loading reviews...');
      const result = await reviewAPI.getAllReviews();
      
      if (result.success) {
        const reviews = Array.isArray(result.data) ? result.data : [];
        dispatch({ type: ActionTypes.SET_REVIEWS, payload: reviews });
        console.log(`[AdminDataContext] Reviews loaded: ${reviews.length}`);
      } else {
        throw new Error(result.error || 'Failed to load reviews');
      }
    } catch (error) {
      console.error('[AdminDataContext] Error loading reviews:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { type: 'reviews', error: error.message } });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'reviews', loading: false } });
    }
  }, []);

  // Load advertisements data
  const loadAdvertisements = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'advertisements', loading: true } });
    dispatch({ type: ActionTypes.CLEAR_ERROR, payload: { type: 'advertisements' } });

    try {
      console.log('[AdminDataContext] Loading advertisements...');
      const result = await advertisementAPI.getAllAdvertisements();
      
      if (result.success) {
        const advertisements = Array.isArray(result.data) ? result.data : [];
        dispatch({ type: ActionTypes.SET_ADVERTISEMENTS, payload: advertisements });
        console.log(`[AdminDataContext] Advertisements loaded: ${advertisements.length}`);
      } else {
        throw new Error(result.error || 'Failed to load advertisements');
      }
    } catch (error) {
      console.error('[AdminDataContext] Error loading advertisements:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { type: 'advertisements', error: error.message } });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'advertisements', loading: false } });
    }
  }, []);

  // Load plots data
  const loadPlots = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'plots', loading: true } });
    dispatch({ type: ActionTypes.CLEAR_ERROR, payload: { type: 'plots' } });

    try {
      console.log('[AdminDataContext] Loading plots...');
      const result = await getPlots();
      
      if (result.success) {
        const plots = Array.isArray(result.data) ? result.data : [];
        dispatch({ type: ActionTypes.SET_PLOTS, payload: plots });
        console.log(`[AdminDataContext] Plots loaded: ${plots.length}`);
      } else {
        throw new Error(result.error || 'Failed to load plots');
      }
    } catch (error) {
      console.error('[AdminDataContext] Error loading plots:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { type: 'plots', error: error.message } });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { type: 'plots', loading: false } });
    }
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    console.log('[AdminDataContext] Starting background data load...');
    dispatch({ type: ActionTypes.SET_LOADING, payload: { overall: true } });

    try {
      // Load all data in parallel for better performance
      await Promise.allSettled([
        loadUsers(),
        loadSocieties(),
        loadReviews(),
        loadAdvertisements(),
        loadPlots()
      ]);

      console.log('[AdminDataContext] Background data load completed');
    } catch (error) {
      console.error('[AdminDataContext] Error in loadAllData:', error);
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { overall: false } });
    }
  }, [loadUsers, loadSocieties, loadReviews, loadAdvertisements, loadPlots]);

  // Refresh specific data type
  const refreshData = useCallback(async (dataType) => {
    switch (dataType) {
      case 'users':
        await loadUsers();
        break;
      case 'societies':
        await loadSocieties();
        break;
      case 'reviews':
        await loadReviews();
        break;
      case 'advertisements':
        await loadAdvertisements();
        break;
      case 'plots':
        await loadPlots();
        break;
      case 'all':
      default:
        await loadAllData();
        break;
    }
  }, [loadUsers, loadSocieties, loadReviews, loadAdvertisements, loadPlots, loadAllData]);

  // Calculate and update statistics whenever data changes
  useEffect(() => {
    const stats = calculateStats(state.users, state.societies, state.reviews, state.advertisements, state.plots);
    dispatch({ type: ActionTypes.SET_STATS, payload: stats });
  }, [state.users, state.societies, state.reviews, state.advertisements, state.plots]);

  // Auto-refresh data at intervals
  useEffect(() => {
    if (!state.backgroundLoading) return;

    console.log('[AdminDataContext] Setting up auto-refresh interval');
    const interval = setInterval(() => {
      console.log('[AdminDataContext] Auto-refreshing data...');
      loadAllData();
    }, state.autoRefreshInterval);

    return () => {
      console.log('[AdminDataContext] Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [state.backgroundLoading, state.autoRefreshInterval, loadAllData]);

  // Initial data load when provider mounts
  useEffect(() => {
    console.log('[AdminDataContext] Provider mounted, starting initial data load');
    loadAllData();
  }, [loadAllData]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    loadUsers,
    loadSocieties,
    loadReviews,
    loadAdvertisements,
    loadPlots,
    loadAllData,
    refreshData,
    
    // Utilities
    isDataStale: (dataType, maxAgeMinutes = 10) => {
      const lastUpdated = state.lastUpdated[dataType];
      if (!lastUpdated) return true;
      
      const maxAge = maxAgeMinutes * 60 * 1000;
      return Date.now() - new Date(lastUpdated).getTime() > maxAge;
    },
    
    hasData: (dataType) => {
      switch (dataType) {
        case 'users':
          return state.users.length > 0;
        case 'societies':
          return state.societies.length > 0;
        case 'reviews':
          return state.reviews.length > 0;
        case 'advertisements':
          return state.advertisements.length > 0;
        case 'plots':
          return state.plots.length > 0;
        default:
          return false;
      }
    },
    
    toggleBackgroundLoading: (enabled) => {
      dispatch({ type: ActionTypes.SET_BACKGROUND_LOADING, payload: enabled });
    }
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

export default AdminDataContext;
