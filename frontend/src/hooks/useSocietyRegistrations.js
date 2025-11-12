import { useState, useEffect } from 'react';
import { getSocietyRegistrations, getPendingSocietyRegistrations } from '../services/authService';

/**
 * Custom hook for fetching society registrations
 * @param {boolean} pendingOnly - Whether to fetch only pending registrations
 * @returns {Object} Hook state and functions
 */
export const useSocietyRegistrations = (pendingOnly = false) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = pendingOnly 
        ? await getPendingSocietyRegistrations()
        : await getSocietyRegistrations();
      
      // Handle different possible response structures
      const societyList = data.societies || data.registrations || data.data || data || [];
      setRegistrations(Array.isArray(societyList) ? societyList : []);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch registrations');
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [pendingOnly]);

  return { 
    registrations, 
    loading, 
    error, 
    refetch: fetchRegistrations,
    totalCount: registrations.length
  };
};

/**
 * Custom hook for filtering society registrations by status
 * @param {Array} registrations - Array of society registrations
 * @returns {Object} Filtered registrations by status
 */
export const useFilteredRegistrations = (registrations) => {
  const [filteredData, setFilteredData] = useState({
    all: [],
    pending: [],
    approved: [],
    rejected: []
  });

  useEffect(() => {
    if (!Array.isArray(registrations)) {
      setFilteredData({
        all: [],
        pending: [],
        approved: [],
        rejected: []
      });
      return;
    }

    setFilteredData({
      all: registrations,
      pending: registrations.filter(reg => !reg.status || reg.status.toLowerCase() === 'pending'),
      approved: registrations.filter(reg => reg.status && reg.status.toLowerCase() === 'approved'),
      rejected: registrations.filter(reg => reg.status && reg.status.toLowerCase() === 'rejected')
    });
  }, [registrations]);

  return filteredData;
};