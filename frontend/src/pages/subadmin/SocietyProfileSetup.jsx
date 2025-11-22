import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getSocietyProfile, updateSocietyProfile } from '../../services/apiService';
import PopupModal from '../../components/common/PopupModal';

const SocietyProfileSetup = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: '',
    description: '',
    location: '',
    available_plots: '',
    price_range: ''
  });
  
  const [societyName, setSocietyName] = useState(''); // Store the original society name from registration

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Popup modal state
  const [popup, setPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Check authentication and load existing profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setMessage('Please log in to access this page');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    // Try to load existing profile
    loadProfile();
  }, [navigate]);


  const loadProfile = async () => {
    try {
      const result = await getSocietyProfile();
      if (result.success && result.profile) {
        // Store the original society name from registration (this should be read-only)
        const originalSocietyName = result.profile.name || '';
        setSocietyName(originalSocietyName);
        
        setProfile({
          name: originalSocietyName, // Use original name from registration
          description: result.profile.description || '',
          location: result.profile.location || '',
          available_plots: result.profile.available_plots || '',
          price_range: result.profile.price_range || ''
        });
        
        // Set logo if exists
        if (result.profile.society_logo) {
          setLogoPreview(result.profile.society_logo);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      
      if (error.message.includes('Authentication failed')) {
        showPopup(
          'Session Expired',
          'Your session has expired. Please log in again.',
          'warning'
        );
        
        setTimeout(() => {
          closePopup();
          navigate('/login');
        }, 3000);
      } else {
        setMessage('Failed to load profile data: ' + error.message);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle logo file selection
  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate image format (PNG, JPG, JPEG)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('Please select a PNG, JPG, or JPEG file for the logo');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Logo file size must be less than 5MB');
        return;
      }
      
      setLogo(file);
      setMessage(''); // Clear any previous errors
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Simple validation
      const requiredFields = ['name', 'description', 'location', 'available_plots', 'price_range'];
      for (let field of requiredFields) {
        if (!profile[field].trim()) {
          setMessage(`Please fill in ${field.replace('_', ' ')}`);
          setLoading(false);
          return;
        }
      }
      
      if (!logo && !logoPreview) {
        setMessage('Please upload a logo');
        setLoading(false);
        return;
      }
      
      // Create FormData
      const formData = new FormData();
      Object.keys(profile).forEach(key => {
        if (key === 'name') {
          // Always use the original society name from registration
          formData.append(key, societyName || profile[key]);
        } else {
          formData.append(key, profile[key]);
        }
      });
      
      if (logo) {
        formData.append('society_logo', logo);
      }
      
      console.log('Submitting profile...');
      const result = await updateSocietyProfile(formData);
      
      console.log('Profile update response:', {
        success: result.success,
        is_complete: result.is_complete,
        message: result.message,
        error: result.error,
        fullResult: result
      });
      
      if (result.success) {
        // Check if profile is complete OR if all required fields are filled
        const allFieldsFilled = profile.name && profile.description && profile.location && 
                               profile.available_plots && profile.price_range && 
                               (logo || logoPreview);
        
        console.log('[PROFILE SETUP] Profile completion check:', {
          backend_is_complete: result.is_complete,
          all_fields_filled: allFieldsFilled,
          will_navigate: result.is_complete || allFieldsFilled
        });
        
        if (result.is_complete || allFieldsFilled) {
          console.log('[PROFILE SETUP] Profile setup complete, navigating to dashboard');
          
          // Create navigation callback for popup
          const handleNavigationSuccess = () => {
            console.log('[PROFILE SETUP] User clicked OK, navigating to /subadmin dashboard');
            navigate('/subadmin');
          };
          
          showPopup(
            'Profile Complete!',
            'Your society profile has been completed successfully. Click OK to access your dashboard!',
            'success'
          );
          
          // Also add automatic fallback navigation in case popup doesn't work
          setTimeout(() => {
            console.log('[PROFILE SETUP] Auto-fallback navigation to /subadmin dashboard');
            closePopup();
            navigate('/subadmin');
          }, 3000);
          
        } else {
          console.log('[PROFILE SETUP] Profile incomplete, showing update message');
          showPopup(
            'Profile Updated!',
            `Profile updated successfully. Missing fields: ${result.missing_fields ? result.missing_fields.join(', ') : 'Please check all required fields'}`,
            'success'
          );
        }
      } else {
        console.log('[PROFILE SETUP] Profile update failed:', result.error);
        setMessage(result.error || 'Failed to update profile');
      }
      
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('Authentication')) {
        setMessage('Session expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(error.message || 'Update failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f5f5', p: 3 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h4" sx={{ color: '#2F3D57', fontWeight: 700, mb: 2, textAlign: 'center' }}>
            Complete Your Society Profile
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', mb: 3, textAlign: 'center' }}>
            Please fill in all required information to access your dashboard
          </Typography>

          {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 2, borderBottom: '2px solid #ED7600', pb: 1 }}>
                  Society Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Society Name"
                  value={societyName || profile.name}
                  fullWidth
                  required
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                    style: { 
                      backgroundColor: '#f5f5f5',
                      color: '#666'
                    }
                  }}
                  helperText="This name is from your approved registration and cannot be changed"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Location"
                  value={profile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Available Plots"
                  value={profile.available_plots}
                  onChange={(e) => handleInputChange('available_plots', e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. 5 Marla, 10 Marla, 1 Kanal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Price Range"
                  value={profile.price_range}
                  onChange={(e) => handleInputChange('price_range', e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. 50L - 1Cr"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={profile.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  placeholder="Describe your society, its features, and what makes it special..."
                />
              </Grid>

              {/* Logo Upload Section */}
              <Grid item xs={12}>
                {/* Society Logo Heading with Upload Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, borderBottom: '2px solid #ED7600', pb: 1, mt: 2 }}>
                  <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600 }}>
                    Society Logo
                  </Typography>
                  
                  {/* Upload Button aligned with heading */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      accept="image/png,image/jpeg,image/jpg"
                      style={{ display: 'none' }}
                      id="logo-upload"
                      type="file"
                      onChange={handleLogoChange}
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        variant="contained"
                        component="span"
                        sx={{ 
                          background: 'linear-gradient(45deg, #2F3D57 30%, #ED7600 90%)',
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1a2332 30%, #d65c00 90%)',
                          }
                        }}
                      >
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    </label>
                  </Box>
                </Box>
                
                {/* Format requirements */}
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                  Required: PNG, JPG, or JPEG format (max 5MB)
                </Typography>
                
                {/* Logo Preview */}
                {logoPreview && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      style={{
                        maxWidth: '250px',
                        maxHeight: '250px',
                        border: '2px solid #ED7600',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 1, color: '#2F3D57', fontWeight: 500 }}>
                      ✅ Logo Preview - Ready for submission
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
            
            {/* Submit Button - Outside main grid, positioned at bottom-right */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(45deg, #2F3D57 30%, #ED7600 90%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 18,
                  px: 6,
                  py: 2,
                  borderRadius: 3,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1a2332 30%, #d65c00 90%)',
                  }
                }}
              >
                {loading ? 'Updating Profile...' : 'Complete Profile'}
              </Button>
            </Box>
          </form>
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
    </Box>
  );
};

export default SocietyProfileSetup;
