import React, { useState, useEffect } from "react";
import { Box, Grid, TextField, Button, MenuItem, Typography, Alert, Paper, Divider, Card, CardContent, InputAdornment, FormControlLabel, Checkbox } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PopupModal from '../../components/common/PopupModal';
import { societySignup } from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext';

const authorityOptions = [
  "CDA (Capital Development Authority)",
  "LDA (Lahore Development Authority)",
  "RDA (Rawalpindi Development Authority)",
  "KDA (Karachi Development Authority)",
  "SBCA (Sindh Building Control Authority)",
  "PDA (Peshawar Development Authority)",
  "FGEHA (Federal Government Employees Housing Authority)",
  "Cantonment Boards (CBs)",
  "DHA (Defence Housing Authority)",
  "Bahria Group"
];

const cityOptions = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
  "Sargodha",
  "Bahawalpur",
  "Sukkur",
  "Other"
];

const typeOptions = ["Private", "Public"];

const RegistrationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get user data from location.state (signup flow) or AuthContext (login redirect)
  const userData = location.state || {
    userEmail: user?.email,
    userName: user?.username,
    userPassword: '' // Not needed for already logged-in users
  };
  
  const [form, setForm] = useState({
    name: "",
    type: "",
    regNo: "",
    established: "",
    authority: "",
    contact: "",
    website: "",
    city: "",
    customCity: "",
    noc_issued: false,
    land_acquisition_status: "",
    procurement_status: ""
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  
  // Popup modal state with navigation callback
  const [popup, setPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onOk: null // Callback function to execute when user clicks OK
  });
  
  // Check if user data is available
  useEffect(() => {
    if (!userData.userEmail && !user?.email) {
      // If no user data from signup or login, redirect to login
      navigate('/login');
    }
  }, [userData, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation and formatting
    if (name === 'contact') {
      // Remove all non-digit characters
      const cleaned = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      const limited = cleaned.substring(0, 10);
      
      // Format with dashes: XXX-XXXXXXX
      let formatted = limited;
      if (limited.length > 3) {
        formatted = limited.substring(0, 3) + '-' + limited.substring(3);
      }
      
      // Validate phone number length
      if (limited.length > 0 && limited.length < 10) {
        setPhoneError('Phone number must be 10 digits');
      } else if (limited.length === 10) {
        setPhoneError('');
      } else if (limited.length === 0) {
        setPhoneError('');
      }
      
      setForm({ ...form, [name]: formatted });
    } 
    // Website URL validation
    else if (name === 'website') {
      // Validate URL format: https://www.domain.com
      const urlPattern = /^https:\/\/www\..+\..+$/;
      
      if (value.length > 0 && !urlPattern.test(value)) {
        setWebsiteError('Website must be in format: https://www.example.com');
      } else {
        setWebsiteError('');
      }
      
      setForm({ ...form, [name]: value });
    } 
    else {
      setForm({ ...form, [name]: value });
    }
  };

  // Show popup modal with optional callback
  const showPopup = (title, message, type = 'info', onOk = null) => {
    setPopup({
      isOpen: true,
      title,
      message,
      type,
      onOk
    });
  };

  // Close popup modal and execute callback if provided
  const closePopup = () => {
    const currentOnOk = popup.onOk;
    setPopup({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
      onOk: null
    });
    
    // Execute callback after closing popup
    if (currentOnOk && typeof currentOnOk === 'function') {
      currentOnOk();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    // Validate phone number before submission
    if (phoneError) {
      showPopup(
        'Validation Error',
        'Please enter a valid phone number (10 digits required)',
        'error'
      );
      return;
    }

    // Check if phone number has correct length
    const phoneDigits = form.contact.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      showPopup(
        'Validation Error',
        'Phone number must be exactly 10 digits',
        'error'
      );
      return;
    }

    // Validate website URL before submission
    if (websiteError) {
      showPopup(
        'Validation Error',
        'Please enter a valid website URL in format: https://www.example.com',
        'error'
      );
      return;
    }

    // Check if website URL is provided and valid
    if (form.website && form.website.trim().length > 0) {
      const urlPattern = /^https:\/\/www\..+\..+$/;
      if (!urlPattern.test(form.website)) {
        showPopup(
          'Validation Error',
          'Website must be in format: https://www.example.com',
          'error'
        );
        return;
      }
    }

    try {
      // Prepare data for society signup (includes both user and society info)
      const societyData = {
        // User information
        userName: userData.userName,
        userEmail: userData.userEmail,
        userPassword: userData.userPassword,
        // Society information
        ...form,
        // Use customCity if 'Other' is selected, otherwise use selected city
        city: form.city === 'Other' ? form.customCity : form.city,
        // Add country code to contact number
        contact: '+92' + phoneDigits
      };

      const data = await societySignup(societyData);

      if (data.success || data.message) {
        const handleRegistrationSuccess = () => {
          navigate('/login');
        };
        
        showPopup(
          'Registration Successful!',
          'Your society registration has been submitted successfully! Your account has been created and is pending admin approval. Click OK to continue to login.',
          'success',
          handleRegistrationSuccess
        );
      } else {
        showPopup(
          'Registration Failed',
          data.error || 'Failed to register society. Please try again.',
          'error'
        );
      }
    } catch (error) {
      showPopup(
        'Connection Error',
        'Error connecting to server. Please check your internet connection and try again.',
        error
      );
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #2F3D57 0%, #1a2532 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      p: 3,
      py: 4
    }}>
      <Paper 
        elevation={20} 
        sx={{ 
          maxWidth: 900, 
          width: '100%', 
          borderRadius: 3, 
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header Section */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #ED7600 0%, #c76100 100%)', 
          p: 4, 
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-30%',
            left: '-5%',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
          }
        }}>
          <Typography variant="h3" sx={{ 
            color: "#fff", 
            fontWeight: 800, 
            letterSpacing: 1.5,
            mb: 1,
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            position: 'relative',
            zIndex: 1
          }}>
            ðŸ¢ Society Registration
          </Typography>
          <Typography sx={{ 
            color: "#fff", 
            fontWeight: 500, 
            fontSize: 16,
            opacity: 0.95,
            position: 'relative',
            zIndex: 1
          }}>
            Complete your society profile to get started
          </Typography>
          {userData.userEmail && (
            <Box sx={{ 
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
              px: 3,
              py: 1,
              mt: 2,
              position: 'relative',
              zIndex: 1
            }}>
              <Typography sx={{ 
                color: "#fff", 
                fontWeight: 600, 
                fontSize: 14 
              }}>
                ðŸ“§ {userData.userEmail}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Instructions Card */}
        <Box sx={{ p: 4, pb: 2, background: '#f8f9fa' }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%)', 
            borderRadius: 2,
            border: '2px solid #ED7600',
            boxShadow: '0 4px 12px rgba(237, 118, 0, 0.15)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ 
                color: '#2F3D57', 
                fontWeight: 700,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                ðŸ“‹ How to Fill This Form
              </Typography>
              <Divider sx={{ mb: 2, borderColor: '#ED7600', opacity: 0.3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      ðŸ·ï¸ Society Name
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Enter the official registered name of your society
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      ðŸ›ï¸ Type & Authority
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Select society type (Private/Public) and regulatory authority
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      ðŸ”¢ Registration Number
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Your official society registration number
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      ðŸ“… Established Date
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Select when your society was officially established
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      ðŸ“ž Contact & Website
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Primary contact number and official website URL
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      ðŸ™ï¸ City Location
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Select the city where society is located
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Form Section */}
        <Box sx={{ px: 4, pb: 4, background: '#f8f9fa' }}>
          {message && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Society Name */}
              <Grid item xs={12}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Society Name <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="name"
                  placeholder="e.g., Bahria Town Lahore"
                  value={form.name} 
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Registration Number */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Registration Number <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="regNo"
                  placeholder="e.g., REG-2024-12345"
                  value={form.regNo} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Established Date */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Established Date <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="established" 
                  type="date" 
                  value={form.established} 
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Society Type */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Society Type <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  select 
                  name="type" 
                  value={form.type} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  placeholder="Select type"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  {typeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>

              {/* City Location */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  City <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  select
                  name="city"
                  value={form.city} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  placeholder="Select city"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  {cityOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>

              {/* Custom City Name (shown when Other is selected) */}
              {form.city === 'Other' && (
                <Grid item xs={12}>
                  <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                    City Name <span style={{ color: '#ED7600' }}>*</span>
                  </Typography>
                  <TextField 
                    name="customCity"
                    placeholder="Enter city name"
                    value={form.customCity} 
                    onChange={handleChange} 
                    fullWidth 
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        height: 56,
                        background: '#fff',
                        '&:hover fieldset': {
                          borderColor: '#ED7600',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ED7600',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Grid>
              )}

              {/* Regulatory Authority */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Regulatory Authority <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  select 
                  name="authority" 
                  value={form.authority} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  placeholder="Select authority"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  {authorityOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>

              {/* NOC Issued Checkbox */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  NOC Status
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  height: 56,
                  background: '#fff',
                  borderRadius: 2,
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  px: 2,
                  '&:hover': {
                    borderColor: '#ED7600',
                  }
                }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.noc_issued}
                        onChange={(e) => setForm({ ...form, noc_issued: e.target.checked })}
                        sx={{
                          color: '#2F3D57',
                          '&.Mui-checked': {
                            color: '#ED7600',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: '#2F3D57', fontWeight: 500, fontSize: 15 }}>
                        NOC Issued by Authority
                      </Typography>
                    }
                  />
                </Box>
              </Grid>

              {/* Land Acquisition Status */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Land Acquisition Status <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  select 
                  name="land_acquisition_status" 
                  value={form.land_acquisition_status} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  <MenuItem value="">Select Status</MenuItem>
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="not_applicable">Not Applicable</MenuItem>
                </TextField>
              </Grid>

              {/* Procurement Status */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Procurement Status <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  select 
                  name="procurement_status" 
                  value={form.procurement_status} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  <MenuItem value="">Select Status</MenuItem>
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="not_applicable">Not Applicable</MenuItem>
                </TextField>
              </Grid>

              {/* Contact Number */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Contact Number <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="contact"
                  placeholder="3XX-XXXXXXX"
                  value={form.contact} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  error={!!phoneError}
                  helperText={phoneError || 'Enter 10 digits (e.g., 300-1234567)'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          px: 1,
                          py: 0.5,
                          background: '#f5f5f5',
                          borderRadius: 1,
                          border: '1px solid #e0e0e0'
                        }}>
                          <Typography sx={{ fontSize: 18 }}>ðŸ‡µðŸ‡°</Typography>
                          <Typography sx={{ 
                            fontWeight: 700, 
                            color: '#2F3D57',
                            fontSize: 15
                          }}>
                            +92
                          </Typography>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      minHeight: 56,
                      background: '#fff',
                      paddingLeft: 1,
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                      '&.Mui-error fieldset': {
                        borderColor: '#d32f2f',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: 12,
                      mt: 0.5,
                    },
                  }}
                />
              </Grid>

              {/* Website URL */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Website URL <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="website"
                  placeholder="https://www.yoursociety.com"
                  value={form.website} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  error={!!websiteError}
                  helperText={websiteError}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: 56,
                      background: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#ED7600',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ED7600',
                        borderWidth: 2,
                      },
                      '&.Mui-error fieldset': {
                        borderColor: '#d32f2f',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: 12,
                      mt: 0.5,
                    },
                  }}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  <Button type="submit" variant="contained" size="large" sx={{
                    background: 'linear-gradient(135deg, #ED7600 0%, #c76100 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: 2,
                    py: 1.8,
                    px: 6,
                    boxShadow: '0 8px 20px rgba(237, 118, 0, 0.35)',
                    textTransform: 'none',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #c76100 0%, #a85100 100%)',
                      boxShadow: '0 12px 28px rgba(237, 118, 0, 0.45)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease'
                    }
                  }}>
                    Submit Registration
                  </Button>
                </Box>
                <Typography sx={{ 
                  textAlign: 'center', 
                  mt: 3, 
                  color: '#666', 
                  fontSize: 13,
                  fontStyle: 'italic' 
                }}>
                  * All fields are required â€¢ Your registration will be reviewed by admin
                </Typography>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Paper>
      
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

export default RegistrationForm;
