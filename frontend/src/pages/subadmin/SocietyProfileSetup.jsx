import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Button, Typography, Alert, Paper, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getSocietyProfile, updateSocietyProfile } from '../../services/apiService';
import PopupModal from '../../components/common/PopupModal';

const SocietyProfileSetup = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: '',
    description: '',
    location: '',
    available_plots: [],
    price_range: '',
    contact_number: '',
    contact_name: '',
    head_office_address: '',
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
  
  const [societyName, setSocietyName] = useState(''); // Store the original society name from registration

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [plotError, setPlotError] = useState('');
  
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
      console.log('[DEBUG] Profile loaded:', result);
      if (result.success && result.profile) {
        // Store the original society name from registration (this should be read-only)
        const originalSocietyName = result.profile.name || '';
        setSocietyName(originalSocietyName);
        
        console.log('[DEBUG] Setting location:', result.profile.location);
        
        setProfile({
          name: originalSocietyName, // Use original name from registration
          description: result.profile.description || '',
          location: result.profile.location || '',
          available_plots: Array.isArray(result.profile.available_plots) 
            ? result.profile.available_plots 
            : [],
          price_range: result.profile.price_range || '',
          contact_number: result.profile.contact_number || '',
          contact_name: result.profile.contact_name || '',
          head_office_address: result.profile.head_office_address || '',
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
    
    // Validate phone number for Pakistan
    if (field === 'contact_number') {
      validatePakistanPhone(value);
    }
  };

  const validatePakistanPhone = (phone) => {
    if (!phone || phone.length === 0) {
      setPhoneError('');
      return true;
    }
    
    // Remove all spaces, dashes, and parentheses
    const cleaned = phone.replace(/[https://nextgen-ta95.onrender.com/apishttps://nextgen-ta95.onrender.com/api-()]/g, '');
    
    // Pakistani phone number patterns:
    // +92XXXXXXXXXX (13 digits with +92)
    // 92XXXXXXXXXX (12 digits starting with 92)
    // 03XXXXXXXXX (11 digits starting with 0)
    const patterns = [
      /^https://nextgen-ta95.onrender.com/api+92[0-9]{10}$/, // +92XXXXXXXXXX
      /^92[0-9]{10}$/, // 92XXXXXXXXXX
      /^0[0-9]{10}$/ // 0XXXXXXXXXX
    ];
    
    const isValid = patterns.some(pattern => pattern.test(cleaned));
    
    if (!isValid) {
      if (cleaned.length < 10) {
        setPhoneError('Invalid format or length (too short)');
      } else if (cleaned.length > 13) {
        setPhoneError('Invalid format or length (too long)');
      } else {
        setPhoneError('Invalid format');
      }
    } else {
      setPhoneError('');
    }
    
    return isValid;
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

  const handlePlotSizeChange = (plotSize) => {
    setProfile(prev => {
      const currentPlots = prev.available_plots;
      if (currentPlots.includes(plotSize)) {
        return {
          ...prev,
          available_plots: currentPlots.filter(p => p !== plotSize)
        };
      } else {
        setPlotError(''); // Clear error when selecting a plot
        return {
          ...prev,
          available_plots: [...currentPlots, plotSize]
        };
      }
    });
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
      .filter(([, value]) => value)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Simple validation - location is auto-populated from registration, no need to validate
      const requiredFields = ['name', 'description', 'price_range', 'contact_number', 'contact_name', 'head_office_address'];
      for (let field of requiredFields) {
        if (!profile[field].trim()) {
          setMessage(`Please fill in ${field.replace('_', ' ')}`);
          setLoading(false);
          return;
        }
      }
      
      // Check if at least one plot size is selected
      if (!profile.available_plots || profile.available_plots.length === 0) {
        setMessage('Please select at least one plot size');
        setPlotError('Please select at least one plot size');
        setLoading(false);
        return;
      }
      
      setPlotError(''); // Clear error if validation passes
      
      // Validate Pakistani phone number
      if (!validatePakistanPhone(profile.contact_number)) {
        setMessage('Please enter a valid Pakistani phone number');
        setLoading(false);
        return;
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
        } else if (key === 'amenities') {
          // Handle amenities as array
          const selectedAmenities = getSelectedAmenities();
          if (selectedAmenities.length > 0) {
            formData.append('amenities[]', '');
            selectedAmenities.forEach((amenity, index) => {
              formData.append(`amenities[${index}]`, amenity);
            });
          }
        } else if (key === 'available_plots') {
          // Handle available_plots as array
          if (profile.available_plots.length > 0) {
            formData.append('available_plots[]', '');
            profile.available_plots.forEach((plotSize, index) => {
              formData.append(`available_plots[${index}]`, plotSize);
            });
          }
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
        // Location is auto-populated from registration, so not checked here
        const allFieldsFilled = profile.name && profile.description && 
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
                  fullWidth
                  disabled
                  InputProps={{
                    readOnly: true,
                    style: { 
                      backgroundColor: '#f5f5f5',
                      color: '#666'
                    },
                    sx: {
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#666',
                        color: '#666'
                      }
                    }
                  }}
                  helperText="This location is from your approved registration and cannot be changed"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ mb: 1, color: plotError ? '#d32f2f' : '#2F3D57', fontWeight: 600, fontSize: '16px' }}>
                  Available Plots *
                </Typography>
                <Box sx={{ 
                  border: '2px solid', 
                  borderColor: plotError ? '#d32f2f' : '#ddd',
                  borderRadius: 2, 
                  p: 2,
                  backgroundColor: plotError ? '#ffebee' : '#fafafa',
                  minHeight: 200
                }}>
                  <Grid container spacing={2}>
                    {[
                      '5 Marla', '6 Marla', '7 Marla', '8 Marla', '9 Marla', '10 Marla',
                      '11 Marla', '12 Marla', '13 Marla', '14 Marla', '15 Marla', '16 Marla',
                      '17 Marla', '18 Marla', '19 Marla', '20 Marla (1 Kanal)'
                    ].map((plotSize) => (
                      <Grid item xs={6} sm={4} md={3} key={plotSize}>
                        <Box
                          onClick={() => handlePlotSizeChange(plotSize)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            p: 1.5,
                            borderRadius: 1.5,
                            border: '2px solid',
                            borderColor: profile.available_plots.includes(plotSize) ? '#ED7600' : '#ddd',
                            backgroundColor: profile.available_plots.includes(plotSize) ? '#FFF5EB' : 'white',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#ED7600',
                              backgroundColor: '#FFF5EB'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: 0.5,
                              border: '2px solid',
                              borderColor: profile.available_plots.includes(plotSize) ? '#ED7600' : '#ddd',
                              backgroundColor: profile.available_plots.includes(plotSize) ? '#ED7600' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {profile.available_plots.includes(plotSize) && (
                              <Typography sx={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>âœ“</Typography>
                            )}
                          </Box>
                          <Typography sx={{ fontSize: '14px', color: '#2F3D57', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {plotSize}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ mt: 2, minHeight: 20 }}>
                    {profile.available_plots.length > 0 && (
                      <Typography sx={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                        Selected: {profile.available_plots.join(', ')}
                      </Typography>
                    )}
                    {plotError && (
                      <Typography sx={{ fontSize: '13px', color: '#d32f2f', fontWeight: 500 }}>
                        {plotError}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Price Range"
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

              <Grid item xs={12} md={6}>
                <TextField
                  label="Contact Person Name"
                  value={profile.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. John Doe"
                  InputProps={{
                    style: { borderRadius: 8 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone Number"
                  value={profile.contact_number}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  fullWidth
                  required
                  error={!!phoneError}
                  helperText={phoneError}
                  placeholder="XXX-XXXXXXX"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, borderRight: '1px solid #ddd', pr: 1.5, gap: 0.5 }}>
                        <Box
                          component="img"
                          src="https://flagcdn.com/w40/pk.png"
                          alt="PK"
                          sx={{ width: 24, height: 16, objectFit: 'cover' }}
                        />
                        <Typography sx={{ color: '#666', fontSize: '14px', fontWeight: 500 }}>+92</Typography>
                      </Box>
                    ),
                    style: { borderRadius: 8 }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Head Office Address"
                  value={profile.head_office_address}
                  onChange={(e) => handleInputChange('head_office_address', e.target.value)}
                  fullWidth
                  required
                  placeholder="e.g. Office #123, Building Name, City"
                  InputProps={{
                    style: { borderRadius: 8 }
                  }}
                />
              </Grid>
            </Grid>
            
            {/* Amenities Section */}
            <Box sx={{ mt: 4, mb: 4 }}>
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

            {/* Logo Upload Section */}
            <Box sx={{ mt: 4, mb: 4 }}>
              {/* Society Logo Heading with Upload Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, borderBottom: '2px solid #ED7600', pb: 1 }}>
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
                    âœ… Logo Preview - Ready for submission
                  </Typography>
                </Box>
              )}
            </Box>

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
