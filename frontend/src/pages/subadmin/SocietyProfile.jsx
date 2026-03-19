<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Button, Paper, Alert, Avatar, TextField } from '@mui/material';
=======
﻿import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Button, Paper, Alert, Avatar } from '@mui/material';
>>>>>>> b2ed8bccabc69ee9803e8cc84be9d77832f9cba7
import { useNavigate } from 'react-router-dom';
import { getSocietyProfile, checkProfileCompleteness } from '../../services/apiService';
import PopupModal from '../../components/common/PopupModal';
import SocietyProfileEditModal from '../../components/subadmin/SocietyProfileEditModal';
import { calculateMarlaStandard } from '../../utils/marlaCalculator';

const SocietyProfile = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMarlaConfig, setShowMarlaConfig] = useState(false);
  const [marlaStandard, setMarlaStandard] = useState(272.25);
  const [marlaData, setMarlaData] = useState(null);
  const [savingMarla, setSavingMarla] = useState(false);
  
  // Popup modal state
  const [popup, setPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);

  // Load profile data on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Check if profile is complete first
      const completenessResult = await checkProfileCompleteness();
      
      if (!completenessResult.is_complete) {
        showPopup(
          'Profile Incomplete',
          'Your society profile is not complete. Please complete your profile first.',
          'warning'
        );
        
        setTimeout(() => {
          navigate('/society-profile-setup');
        }, 3000);
        return;
      }
      
      // Get profile data
      const result = await getSocietyProfile();
      
      if (result.success && result.profile) {
        setProfile(result.profile);
      } else {
        setError('Failed to load profile data');
        showPopup(
          'Error',
          'Failed to load your profile. Please try again.',
          'error'
        );
      }
    } catch (error) {
      setError('Error loading profile: ' + error.message);
      showPopup(
        'Error',
        'An error occurred while loading your profile.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Show popup modal
  const showPopup = (title, message, type = 'info') => {
    setPopup({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Close popup modal
  const closePopup = () => {
    setPopup({
      isOpen: false,
      title: '',
      message: '',
      type: 'info'
    });
  };

  const handleEditProfile = () => {
    // Show edit modal instead of navigating
    console.log('[SOCIETY PROFILE] Opening edit profile modal');
    setShowEditModal(true);
  };

  // Handle marla configuration load
  useEffect(() => {
    if (profile && profile.marla_data) {
      try {
        setMarlaStandard(profile.marla_data.marlaStandard || 272.25);
        setMarlaData(profile.marla_data);
        console.log('[MARLA CONFIG] Loaded marla data:', profile.marla_data);
      } catch (error) {
        console.error('[MARLA CONFIG] Error loading marla data:', error);
      }
    }
  }, [profile]);

  // Handle marla standard change
  const handleMarlaStandardChange = (e) => {
    const value = parseFloat(e.target.value) || 272.25;
    setMarlaStandard(value);
  };

  // Calculate and save marla configuration
  const handleSaveMarlaConfig = async () => {
    try {
      setSavingMarla(true);
      
      // Validate marla standard
      if (!marlaStandard || marlaStandard <= 0) {
        showPopup('Invalid Input', 'Marla standard must be greater than 0', 'error');
        setSavingMarla(false);
        return;
      }

      // Get available plot sizes from profile (set during registration)
      if (!profile.available_plots || !Array.isArray(profile.available_plots) || profile.available_plots.length === 0) {
        showPopup('No Plot Sizes', 'Please set available plot sizes in your society profile first', 'error');
        setSavingMarla(false);
        return;
      }

      // Calculate all dimensions
      let calculations;
      try {
        calculations = calculateMarlaStandard(marlaStandard, '5 Marla');
      } catch (error) {
        console.error('[MARLA CONFIG] Error in calculateMarlaStandard:', error);
        showPopup('Calculation Error', 'Failed to calculate marla dimensions: ' + error.message, 'error');
        setSavingMarla(false);
        return;
      }
      
      const marlaConfig = {
        ...calculations,  // Spread the calculations object directly (includes marlaStandard, baseMarla, calculations)
        available_plots: profile.available_plots,
        configured_at: new Date().toISOString()
      };

      console.log('[MARLA CONFIG] Saving configuration:', marlaConfig);

      // Save to backend (update society profile)
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/society-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          marla_data: marlaConfig,
          available_plots: profile.available_plots,
          updated_at: new Date().toISOString()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showPopup('Success', 'Marla configuration saved successfully!', 'success');
        setMarlaData(marlaConfig);
        setShowMarlaConfig(false);
        // Reload profile
        loadProfileData();
      } else {
        showPopup('Error', result.error || 'Failed to save marla configuration', 'error');
        console.error('[MARLA CONFIG] Backend error:', result);
      }
    } catch (error) {
      console.error('[MARLA CONFIG] Error saving:', error);
      showPopup('Error', 'Error saving marla configuration: ' + error.message, 'error');
    } finally {
      setSavingMarla(false);
    }
  };
  
  // Handle successful profile update
  const handleProfileUpdateSuccess = () => {
    console.log('[SOCIETY PROFILE] Profile updated successfully, reloading data');
    loadProfileData(); // Reload the profile data to show updates
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6" color="textSecondary">Loading profile...</Typography>
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#f5f5f5', p: 3 }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/society-profile-setup')}
            sx={{
              background: 'linear-gradient(45deg, #2F3D57 30%, #ED7600 90%)',
              color: 'white',
            }}
          >
            Set up Profile
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f5f5', p: 3 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h4" sx={{ color: '#2F3D57', fontWeight: 700, mb: 3, textAlign: 'center' }}>
            Society Profile
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          {profile ? (
            <Grid container spacing={4}>
              {/* Logo Section */}
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 2 }}>
                    Society Logo
                  </Typography>
                  {profile.society_logo ? (
                    <Avatar
                      src={profile.society_logo}
                      alt="Society Logo"
                      sx={{ 
                        width: 150, 
                        height: 150, 
                        mx: 'auto',
                        mb: 2,
                        border: '3px solid #ED7600',
                        boxShadow: '0 4px 12px rgba(237, 118, 0, 0.3)'
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{ 
                        width: 150, 
                        height: 150, 
                        mx: 'auto',
                        mb: 2,
                        bgcolor: '#f5f5f5',
                        color: '#666',
                        fontSize: '48px',
                        border: '2px dashed #ddd'
                      }}
                    >
                      ðŸ¢
                    </Avatar>
                  )}
                </Box>
              </Grid>
              
              {/* Profile Details */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Society Name
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '18px', mb: 2 }}>
                      {profile.name || 'Not specified'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                      From registration - cannot be changed
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '16px' }}>
                      {profile.location || 'Not specified'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                      From registration - cannot be changed
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Available Plots
                    </Typography>
                    {Array.isArray(profile.available_plots) && profile.available_plots.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {profile.available_plots.map((plotSize, index) => (
                          <Box
                            key={index}
                            sx={{
                              px: 2,
                              py: 0.5,
                              backgroundColor: '#ED7600',
                              color: 'white',
                              borderRadius: 1,
                              fontSize: '14px',
                              fontWeight: 500
                            }}
                          >
                            {plotSize}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body1" sx={{ color: '#666', fontSize: '16px' }}>
                        {profile.available_plots || 'Not specified'}
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Price Range
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '16px' }}>
                      {profile.price_range || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Contact Number
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '16px' }}>
                      {profile.contact_number || 'Not specified'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Head Office Address
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '16px' }}>
                      {profile.head_office_address || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '16px' }}>
                      {profile.email || profile.user_email || 'Not specified'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                      This is your login email and cannot be changed
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '16px', lineHeight: 1.6 }}>
                      {profile.description || 'No description provided'}
                    </Typography>
                  </Grid>

                  {/* Amenities Section */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 2 }}>
                      Society Amenities
                    </Typography>
                    {profile.amenities && profile.amenities.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {profile.amenities.map((amenity, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              border: '2px solid #ED7600',
                              backgroundColor: '#fff5ed',
                              color: '#ED7600',
                              fontWeight: 600
                            }}
                          >
                            <span style={{ fontSize: '18px' }}>âœ“</span>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#ED7600' }}>
                              {amenity}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body1" sx={{ color: '#999', fontSize: '16px', fontStyle: 'italic' }}>
                        No amenities specified
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Grid>

              {/* Marla Configuration Section */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, backgroundColor: '#fff5ed', border: '2px solid #ED7600' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#ED7600', fontWeight: 700 }}>
                      📏 Marla Standard Configuration
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setShowMarlaConfig(!showMarlaConfig)}
                      sx={{
                        backgroundColor: '#ED7600',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#d65c00' }
                      }}
                    >
                      {showMarlaConfig ? 'Hide' : 'Configure'}
                    </Button>
                  </Box>

                  {marlaData && !showMarlaConfig && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        <strong>✓ Configured:</strong> 1 Marla = {marlaData.marlaStandard} sq ft | Base: {marlaData.baseMarla}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Available plot sizes: {marlaData.available_plots?.join(', ') || 'None'}
                      </Typography>
                    </Box>
                  )}

                  {showMarlaConfig && (
                    <Box sx={{ pt: 2 }}>
                      {/* Step 1: Set Base Marla Standard */}
                      <Box sx={{ mb: 4, p: 2.5, backgroundColor: '#e8f5e9', borderRadius: 2, border: '2px solid #4caf50' }}>
                        <Typography variant="body2" sx={{ color: '#2F3D57', fontWeight: 700, mb: 2, fontSize: '16px' }}>
                          ✓ Step 1: Set Your Society's Marla Standard
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#555', display: 'block', mb: 2, fontSize: '13px', lineHeight: 1.6 }}>
                          Set how many square feet equal 1 Marla in your society. This is the ONLY value you need to set. All other plot sizes (which you defined during registration) will automatically calculate from this.
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={8}>
                            <Typography variant="body2" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                              1 Marla = ? Square Feet <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <TextField
                              type="number"
                              value={marlaStandard}
                              onChange={handleMarlaStandardChange}
                              placeholder="e.g., 272.25"
                              step="0.01"
                              inputProps={{ min: "1" }}
                              fullWidth
                              size="small"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'white',
                                  fontWeight: 600,
                                  fontSize: '16px'
                                }
                              }}
                            />
                          </Grid>
                        </Grid>

                        {marlaStandard > 0 && (
                          <Box sx={{ p: 1.5, backgroundColor: 'white', borderRadius: 1, border: '1px solid #4caf50' }}>
                            <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                              ✓ Your Marla Standard: <strong>{marlaStandard} sq ft per marla</strong>
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                              This automatically applies to all {profile?.available_plots?.length || 0} plot sizes you offer
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Step 2: Auto-Calculated Preview */}
                      {marlaStandard > 0 && profile?.available_plots && profile.available_plots.length > 0 && (
                        <Box sx={{ mb: 4, p: 2.5, backgroundColor: '#fff3e0', borderRadius: 2, border: '2px solid #ff9800' }}>
                          <Typography variant="body2" sx={{ color: '#2F3D57', fontWeight: 700, mb: 2, fontSize: '16px' }}>
                            ✓ Step 2: Your Plot Sizes (Auto-Calculated)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#555', display: 'block', mb: 2, fontSize: '13px', lineHeight: 1.6 }}>
                            Based on your marla standard of {marlaStandard} sq ft per marla, here are the calculated dimensions for your available plot sizes:
                          </Typography>

                          {(() => {
                            try {
                              const calc = calculateMarlaStandard(marlaStandard, '5 Marla');
                              if (!calc || typeof calc !== 'object' || Object.keys(calc).length === 0) {
                                return (
                                  <Typography variant="caption" sx={{ color: '#999' }}>
                                    No calculations available
                                  </Typography>
                                );
                              }
                              return (
                                <Grid container spacing={1.5}>
                                  {profile.available_plots.map((size) => {
                                    const dims = calc[size];
                                    if (!dims || !dims.x || !dims.y || !dims.sqft) {
                                      return null;
                                    }
                                    return (
                                      <Grid item xs={12} sm={6} md={4} key={size}>
                                        <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 1, border: '2px solid #ff9800', textAlign: 'center' }}>
                                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#ff9800', mb: 1 }}>
                                            {size}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: 600 }}>
                                            {dims.x.toFixed(1)}' × {dims.y.toFixed(1)}'
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                                            ({dims.sqft.toFixed(0)} sq ft)
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    );
                                  })}
                                </Grid>
                              );
                            } catch (error) {
                              console.error('[MARLA CONFIG] Error calculating dimensions:', error);
                              return (
                                <Typography variant="caption" sx={{ color: 'red' }}>
                                  Error calculating dimensions: {error.message}
                                </Typography>
                              );
                            }
                          })()}
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleSaveMarlaConfig}
                          disabled={savingMarla || marlaStandard <= 0}
                          sx={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': { backgroundColor: '#45a049' },
                            '&:disabled': { backgroundColor: '#ccc' }
                          }}
                        >
                          {savingMarla ? '⏳ Saving...' : '✓ Save Configuration'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setShowMarlaConfig(false)}
                          disabled={savingMarla}
                          sx={{
                            color: '#ED7600',
                            borderColor: '#ED7600',
                            fontWeight: 600,
                            '&:hover': { backgroundColor: '#fff5ed' }
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleEditProfile}
                    sx={{
                      background: 'linear-gradient(45deg, #2F3D57 30%, #ED7600 90%)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 16,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1a2332 30%, #d65c00 90%)',
                      }
                    }}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                No profile data found
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/society-profile-setup')}
                sx={{
                  background: 'linear-gradient(45deg, #2F3D57 30%, #ED7600 90%)',
                  color: 'white',
                }}
              >
                Set up Profile
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Popup Modal */}
      <PopupModal 
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />
      
      {/* Society Profile Edit Modal */}
      <SocietyProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleProfileUpdateSuccess}
      />
    </Box>
  );
};

export default SocietyProfile;
