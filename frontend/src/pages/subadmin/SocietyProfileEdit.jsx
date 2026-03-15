import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getSocietyProfile, updateSocietyProfile } from '../../services/apiService';
import PopupModal from '../../components/common/PopupModal';

const SocietyProfileEdit = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: '',
    description: '',
    location: '',
    available_plots: '',
    price_range: '',
    amenities: {
      gatedCommunity: false,
      security: false,
      electricity: false,
      waterSupply: false,
      parks: false,
      mosque: false,
      gym: false,
      swimmingPool: false,
      communityCenter: false,
      playground: false,
      hospital: false,
      school: false,
      shoppingCenter: false,
      restaurant: false,
      cctv: false,
      fireAlarm: false
    }
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  
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
    
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      setInitialLoading(true);
      console.log('[PROFILE EDIT] Loading existing profile for editing...');
      
      const result = await getSocietyProfile();
      console.log('[PROFILE EDIT] Profile data loaded:', result);
      
      if (result.success && result.profile) {
        setProfile({
          name: result.profile.name || '',
          description: result.profile.description || '',
          location: result.profile.location || '',
          available_plots: result.profile.available_plots || '',
          price_range: result.profile.price_range || '',
          amenities: {
            gatedCommunity: result.profile.amenities?.includes('Gated Community') || false,
            security: result.profile.amenities?.includes('Security') || false,
            electricity: result.profile.amenities?.includes('Electricity') || false,
            waterSupply: result.profile.amenities?.includes('Water Supply') || false,
            parks: result.profile.amenities?.includes('Parks') || false,
            mosque: result.profile.amenities?.includes('Mosque') || false,
            gym: result.profile.amenities?.includes('Gym') || false,
            swimmingPool: result.profile.amenities?.includes('Swimming Pool') || false,
            communityCenter: result.profile.amenities?.includes('Community Center') || false,
            playground: result.profile.amenities?.includes('Playground') || false,
            hospital: result.profile.amenities?.includes('Hospital') || false,
            school: result.profile.amenities?.includes('School') || false,
            shoppingCenter: result.profile.amenities?.includes('Shopping Center') || false,
            restaurant: result.profile.amenities?.includes('Restaurant') || false,
            cctv: result.profile.amenities?.includes('CCTV') || false,
            fireAlarm: result.profile.amenities?.includes('Fire Alarm') || false
          }
        });
        
        // Set logo if exists
        if (result.profile.society_logo) {
          setLogoPreview(result.profile.society_logo);
        }
        
        console.log('[PROFILE EDIT] Profile data set for editing');
      } else {
        setMessage('Failed to load profile data for editing');
        showPopup(
          'Error',
          'Could not load your profile data. Please try again.',
          'error'
        );
      }
    } catch (error) {
      console.error('[PROFILE EDIT] Error loading profile:', error);
      
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
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityChange = (amenity) => {
    setProfile(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
  };

  const getSelectedAmenities = () => {
    const amenityMap = {
      gatedCommunity: "Gated Community",
      security: "Security",
      electricity: "Electricity",
      waterSupply: "Water Supply",
      parks: "Parks",
      mosque: "Mosque",
      gym: "Gym",
      swimmingPool: "Swimming Pool",
      communityCenter: "Community Center",
      playground: "Playground",
      hospital: "Hospital",
      school: "School",
      shoppingCenter: "Shopping Center",
      restaurant: "Restaurant",
      cctv: "CCTV",
      fireAlarm: "Fire Alarm"
    };
    
    return Object.entries(profile.amenities)
      .filter(([key, value]) => value)
      .map(([key]) => amenityMap[key]);
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

  // Handle cancel - go back to profile view
  const handleCancel = () => {
    console.log('[PROFILE EDIT] User cancelled editing, returning to profile view');
    navigate('/subadmin/society-profile');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('[PROFILE EDIT] Submitting profile updates...');
      
      // Simple validation
      const requiredFields = ['name', 'description', 'available_plots', 'price_range'];
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
        if (key === 'amenities') {
          // Handle amenities as array
          const selectedAmenities = getSelectedAmenities();
          if (selectedAmenities.length > 0) {
            formData.append('amenities[]', '');
            selectedAmenities.forEach((amenity, index) => {
              formData.append(`amenities[${index}]`, amenity);
            });
          }
        } else {
          formData.append(key, profile[key]);
        }
      });
      
      if (logo) {
        formData.append('society_logo', logo);
      }
      
      const result = await updateSocietyProfile(formData);
      
      console.log('[PROFILE EDIT] Update response:', {
        success: result.success,
        is_complete: result.is_complete,
        message: result.message,
        error: result.error
      });
      
      if (result.success) {
        console.log('[PROFILE EDIT] Profile updated successfully, returning to profile view');
        
        showPopup(
          'Profile Updated!',
          'Your society profile has been updated successfully.',
          'success'
        );
        
        // Always return to society profile page after editing
        setTimeout(() => {
          console.log('[PROFILE EDIT] Navigating back to /subadmin/society-profile');
          closePopup();
          navigate('/subadmin/society-profile');
        }, 2000);
        
      } else {
        setMessage(result.error || 'Failed to update profile');
      }
      
    } catch (error) {
      console.error('[PROFILE EDIT] Update error:', error);
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

  // Show loading screen while loading profile data
  if (initialLoading) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6" color="textSecondary">Loading profile for editing...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#2F3D57', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ maxWidth: 900, width: '100%' }}>
        
        {/* Single Card with Side-by-Side Layout */}
        <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          
          {/* Header */}
          <Box sx={{ p: 3, textAlign: 'center', background: '#f8f9fa' }}>
            <Typography variant="h4" sx={{ color: '#2F3D57', fontWeight: 700, letterSpacing: 1 }}>
              Edit Society Profile
            </Typography>
            <Typography sx={{ color: '#ED7600', fontWeight: 500, mt: 1 }}>
              Update your society information below
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {message && <Alert severity="info" sx={{ mb: 3 }}>{message}</Alert>}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                
                {/* Left Side - Logo Upload Section */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', pr: { md: 2 } }}>
                    <Typography variant="h6" sx={{ color: '#2F3D57', fontWeight: 600, mb: 3 }}>
                      Society Logo
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <input
                        accept="image/png,image/jpeg,image/jpg"
                        style={{ display: 'none' }}
                        id="logo-upload"
                        type="file"
                        onChange={handleLogoChange}
                      />
                      <label htmlFor="logo-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          sx={{ 
                            borderColor: '#ED7600',
                            color: '#ED7600',
                            borderRadius: 3,
                            fontWeight: 600,
                            py: 1.5,
                            mb: 1,
                            '&:hover': {
                              borderColor: '#d65c00',
                              backgroundColor: '#fff3e6'
                            }
                          }}
                        >
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                      </label>
                      
                      <Typography variant="caption" color="textSecondary" display="block">
                        PNG, JPG, or JPEG format (max 5MB)
                      </Typography>
                    </Box>
                    
                    {logoPreview && (
                      <Box>
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          style={{
                            width: '100%',
                            maxWidth: '200px',
                            height: 'auto',
                            maxHeight: '200px',
                            border: '2px solid #ED7600',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(237, 118, 0, 0.3)',
                            objectFit: 'cover'
                          }}
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: '#666' }}>
                          {logo ? 'New Logo Preview' : 'Current Logo'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Right Side - Form Fields */}
                <Grid item xs={12} md={8}>
                  <Box sx={{ pl: { md: 2 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Grid container spacing={3}>
                      
                      {/* First Row - Society Name and Location */}
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Society Name</Typography>
                        <TextField
                          value={profile.name}
                          fullWidth
                          disabled
                          variant="outlined"
                          InputProps={{ 
                            readOnly: true,
                            style: { 
                              borderRadius: 12,
                              backgroundColor: '#f5f5f5',
                              color: '#666'
                            }
                          }}
                          sx={{
                            '& .MuiInputBase-input.Mui-disabled': {
                              WebkitTextFillColor: '#666',
                              color: '#666'
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                          From registration - cannot be changed
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Location</Typography>
                        <TextField
                          value={profile.location}
                          fullWidth
                          disabled
                          variant="outlined"
                          InputProps={{ 
                            readOnly: true,
                            style: { 
                              borderRadius: 12,
                              backgroundColor: '#f5f5f5',
                              color: '#666',
                              cursor: 'not-allowed'
                            }
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              backgroundColor: '#f5f5f5'
                            },
                            '& .MuiInputBase-input.Mui-disabled': {
                              WebkitTextFillColor: '#666',
                              color: '#666',
                              cursor: 'not-allowed'
                            },
                            '& .MuiOutlinedInput-root.Mui-disabled': {
                              backgroundColor: '#f5f5f5'
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                          From registration - cannot be changed
                        </Typography>
                      </Grid>

                      {/* Second Row - Available Plots and Price Range */}
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Available Plots</Typography>
                        <TextField
                          value={profile.available_plots}
                          onChange={(e) => handleInputChange('available_plots', e.target.value)}
                          fullWidth
                          required
                          InputProps={{ style: { borderRadius: 12 } }}
                          placeholder="e.g. 5 Marla, 10 Marla, 1 Kanal"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Price Range</Typography>
                        <TextField
                          select
                          value={profile.price_range}
                          onChange={(e) => handleInputChange('price_range', e.target.value)}
                          fullWidth
                          required
                          SelectProps={{
                            displayEmpty: true,
                            renderValue: (selected) => {
                              if (!selected) {
                                return <span style={{ color: '#999' }}>Select price range</span>;
                              }
                              return selected;
                            }
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              borderRadius: 3,
                              height: 56,
                              minWidth: '100%'
                            },
                            '& .MuiSelect-select': {
                              height: '56px !important',
                              display: 'flex',
                              alignItems: 'center',
                              paddingTop: '0 !important',
                              paddingBottom: '0 !important'
                            }
                          }}
                        >
                          <MenuItem value="5 Lakh - 10 Lakh">PKR 5 Lakh - 10 Lakh</MenuItem>
                          <MenuItem value="10 Lakh - 20 Lakh">PKR 10 Lakh - 20 Lakh</MenuItem>
                          <MenuItem value="20 Lakh - 30 Lakh">PKR 20 Lakh - 30 Lakh</MenuItem>
                          <MenuItem value="30 Lakh - 50 Lakh">PKR 30 Lakh - 50 Lakh</MenuItem>
                          <MenuItem value="50 Lakh - 75 Lakh">PKR 50 Lakh - 75 Lakh</MenuItem>
                          <MenuItem value="75 Lakh - 1 Crore">PKR 75 Lakh - 1 Crore</MenuItem>
                          <MenuItem value="1 Crore - 1.5 Crore">PKR 1 Crore - 1.5 Crore</MenuItem>
                          <MenuItem value="1.5 Crore - 2 Crore">PKR 1.5 Crore - 2 Crore</MenuItem>
                          <MenuItem value="2 Crore - 3 Crore">PKR 2 Crore - 3 Crore</MenuItem>
                          <MenuItem value="3 Crore - 5 Crore">PKR 3 Crore - 5 Crore</MenuItem>
                          <MenuItem value="5 Crore - 10 Crore">PKR 5 Crore - 10 Crore</MenuItem>
                          <MenuItem value="10 Crore+">PKR 10 Crore+</MenuItem>
                        </TextField>
                      </Grid>

                      {/* Third Row - Description (Full Width) */}
                      <Grid item xs={12}>
                        <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Description</Typography>
                        <TextField
                          value={profile.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          fullWidth
                          required
                          multiline
                          rows={3}
                          InputProps={{ style: { borderRadius: 12 } }}
                          placeholder="Describe your society, its features, and what makes it special..."
                        />
                      </Grid>
                    </Grid>
                    
                    {/* Amenities Section */}
                    <Box sx={{ mt: 4 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2,
                          color: '#2F3D57',
                          fontWeight: 600
                        }}
                      >
                        Society Amenities
                      </Typography>
                      <Grid container spacing={2}>
                        {[
                          { id: "gatedCommunity", label: "Gated Community" },
                          { id: "security", label: "Security" },
                          { id: "cctv", label: "CCTV" },
                          { id: "fireAlarm", label: "Fire Alarm" },
                          { id: "electricity", label: "Electricity" },
                          { id: "waterSupply", label: "Water Supply" },
                          { id: "parks", label: "Parks" },
                          { id: "playground", label: "Playground" },
                          { id: "mosque", label: "Mosque" },
                          { id: "gym", label: "Gym" },
                          { id: "swimmingPool", label: "Swimming Pool" },
                          { id: "communityCenter", label: "Community Center" },
                          { id: "hospital", label: "Hospital" },
                          { id: "school", label: "School" },
                          { id: "shoppingCenter", label: "Shopping Center" },
                          { id: "restaurant", label: "Restaurant" }
                        ].map((amenity) => (
                          <Grid item xs={12} sm={6} key={amenity.id}>
                            <Box
                              onClick={() => handleAmenityChange(amenity.id)}
                              sx={{
                                p: 2,
                                border: `2px solid ${profile.amenities[amenity.id] ? '#ED7600' : '#e0e0e0'}`,
                                borderRadius: 2,
                                backgroundColor: profile.amenities[amenity.id] ? '#fff5ed' : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                  borderColor: '#ED7600',
                                  backgroundColor: '#fff5ed'
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  border: `2px solid ${profile.amenities[amenity.id] ? '#ED7600' : '#bdbdbd'}`,
                                  borderRadius: 1,
                                  backgroundColor: profile.amenities[amenity.id] ? '#ED7600' : 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 2,
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {profile.amenities[amenity.id] && (
                                  <Typography sx={{ color: 'white', fontSize: 18, fontWeight: 700 }}>âœ“</Typography>
                                )}
                              </Box>
                              <Typography 
                                sx={{ 
                                  fontWeight: profile.amenities[amenity.id] ? 600 : 400,
                                  color: profile.amenities[amenity.id] ? '#ED7600' : '#2F3D57'
                                }}
                              >
                                {amenity.label}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                </Grid>

                {/* Action Buttons - Full Width */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, borderTop: '1px solid #eee', pt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={loading}
                      sx={{
                        color: '#2F3D57',
                        borderColor: '#2F3D57',
                        fontWeight: 600,
                        fontSize: 16,
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        '&:hover': {
                          borderColor: '#1a2332',
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        background: '#ED7600',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 18,
                        borderRadius: 3,
                        py: 1.5,
                        px: 6,
                        boxShadow: 2,
                        '&:hover': {
                          background: '#d65c00',
                        }
                      }}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Box>
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

export default SocietyProfileEdit;
