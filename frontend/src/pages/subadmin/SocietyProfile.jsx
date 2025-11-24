import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Button, Paper, Alert, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getSocietyProfile, checkProfileCompleteness } from '../../services/apiService';
import PopupModal from '../../components/common/PopupModal';
import SocietyProfileEditModal from '../../components/subadmin/SocietyProfileEditModal';

const SocietyProfile = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
                      🏢
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
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '16px' }}>
                      {profile.location || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 1 }}>
                      Available Plots
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '16px' }}>
                      {profile.available_plots || 'Not specified'}
                    </Typography>
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
                </Grid>
              </Grid>
              
              {/* Action Buttons */}
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
