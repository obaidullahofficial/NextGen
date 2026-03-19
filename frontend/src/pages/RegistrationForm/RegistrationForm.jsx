<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { Box, Grid, TextField, Button, MenuItem, Typography, Alert, Paper, Divider, InputAdornment, FormControlLabel, Checkbox, CircularProgress } from "@mui/material";
=======
﻿import React, { useState, useEffect } from "react";
import { Box, Grid, TextField, Button, MenuItem, Typography, Alert, Paper, Divider, Card, CardContent, InputAdornment, FormControlLabel, Checkbox } from "@mui/material";
>>>>>>> b2ed8bccabc69ee9803e8cc84be9d77832f9cba7
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
  const [nocDocument, setNocDocument] = useState(null);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [regNoError, setRegNoError] = useState('');
  const [establishedDateError, setEstablishedDateError] = useState('');
  const [selectErrors, setSelectErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const getHelperText = (field, hint, error = '') => {
    if (error) return error;
    return focusedField === field ? hint : ' ';
  };

  const getSelectHelperText = (field, hint) => {
    if (selectErrors[field]) return selectErrors[field];
    return hint;
  };
  
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

    const optionFields = ['type', 'city', 'authority', 'land_acquisition_status', 'procurement_status'];
    if (optionFields.includes(name)) {
      setSelectErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'customCity') {
      setSelectErrors(prev => ({ ...prev, customCity: '' }));
    }

    // Established date validation - no future date allowed
    if (name === 'established') {
      if (value && value > today) {
        setEstablishedDateError('Future date is not allowed');
      } else {
        setEstablishedDateError('');
      }

      setForm({ ...form, established: value });
      return;
    }


    // Registration number validation - exactly 6 digits
    if (name === 'regNo') {
      const cleaned = value.replace(/\D/g, '').substring(0, 6);

      if (cleaned.length > 0 && cleaned.length < 6) {
        setRegNoError('Registration number must be exactly 6 digits');
      } else {
        setRegNoError('');
      }

      setForm({ ...form, regNo: cleaned });
      return;
    }
    
    // Phone number validation and formatting
    if (name === 'contact') {
      // Remove all non-digit characters
      const cleaned = value.replace(/https://nextgen-ta95.onrender.com/apiD/g, '');
      
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
      const urlPattern = /^https:\/\/.+$/;
      
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
        if (establishedDateError || (form.established && form.established > today)) {
          showPopup(
            'Validation Error',
            'Established date cannot be a future date.',
            'error'
          );
          return;
        }

    e.preventDefault();
    setMessage(null);
    setError(null);

    const newSelectErrors = {};
    const requiredOptions = [
      { key: 'type', label: 'society type' },
      { key: 'city', label: 'city' },
      { key: 'authority', label: 'regulatory authority' },
      { key: 'land_acquisition_status', label: 'land acquisition status' },
      { key: 'procurement_status', label: 'procurement status' }
    ];

    requiredOptions.forEach(({ key, label }) => {
      if (!form[key]) {
        newSelectErrors[key] = `Please select ${label}`;
      }
    });

    if (form.city === 'Other' && !form.customCity.trim()) {
      newSelectErrors.customCity = 'Please enter city name';
    }

    if (Object.keys(newSelectErrors).length > 0) {
      setSelectErrors(newSelectErrors);
      showPopup(
        'Validation Error',
        'Please select all required options and complete highlighted fields.',
        'error'
      );
      return;
    }

    setSelectErrors({});

    // Validate registration number
    if (regNoError || !/^\d{6}$/.test(form.regNo || '')) {
      showPopup(
        'Validation Error',
        'Registration number must be exactly 6 digits.',
        'error'
      );
      return;
    }

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
    const phoneDigits = form.contact.replace(/https://nextgen-ta95.onrender.com/apiD/g, '');
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
      const urlPattern = /^https:\/\/.+$/;
      if (!urlPattern.test(form.website)) {
        showPopup(
          'Validation Error',
          'Website must be in format: https://www.example.com',
          'error'
        );
        return;
      }
    }

    if (form.noc_issued && !nocDocument) {
      showPopup(
        'Validation Error',
        'Please upload NOC document (PDF or image) when NOC Issued is checked.',
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare multipart form data to support NOC document upload
      const societyData = new FormData();
      societyData.append('userName', userData.userName || '');
      societyData.append('userEmail', userData.userEmail || '');
      societyData.append('userPassword', userData.userPassword || '');
      societyData.append('name', form.name || '');
      societyData.append('type', form.type || '');
      societyData.append('regNo', form.regNo || '');
      societyData.append('established', form.established || '');
      societyData.append('authority', form.authority || '');
      societyData.append('website', form.website || '');
      societyData.append('land_acquisition_status', form.land_acquisition_status || '');
      societyData.append('procurement_status', form.procurement_status || '');
      societyData.append('noc_issued', String(form.noc_issued));
      societyData.append('city', form.city === 'Other' ? form.customCity : form.city);
      societyData.append('contact', '+92' + phoneDigits);

      if (form.noc_issued && nocDocument) {
        societyData.append('noc_document', nocDocument);
      }

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
    } finally {
      setIsSubmitting(false);
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
          maxWidth: 1500,
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
            Ã°Å¸ÂÂ¢ Society Registration
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
                Ã°Å¸â€œÂ§ {userData.userEmail}
              </Typography>
            </Box>
          )}
        </Box>

<<<<<<< HEAD
=======
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
                Ã°Å¸â€œâ€¹ How to Fill This Form
              </Typography>
              <Divider sx={{ mb: 2, borderColor: '#ED7600', opacity: 0.3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      Ã°Å¸ÂÂ·Ã¯Â¸Â Society Name
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Enter the official registered name of your society
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      Ã°Å¸Ââ€ºÃ¯Â¸Â Type & Authority
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Select society type (Private/Public) and regulatory authority
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      Ã°Å¸â€Â¢ Registration Number
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Your official society registration number
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      Ã°Å¸â€œâ€¦ Established Date
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Select when your society was officially established
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      Ã°Å¸â€œÅ¾ Contact & Website
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: 13, pl: 2.5 }}>
                      Primary contact number and official website URL
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography sx={{ color: '#2F3D57', fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      Ã°Å¸Ââ„¢Ã¯Â¸Â City Location
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

>>>>>>> b2ed8bccabc69ee9803e8cc84be9d77832f9cba7
        {/* Form Section */}
        <Box sx={{
          px: 4,
          pt: 4,
          pb: 4,
          background: '#f8f9fa',
          maxWidth: 1460,
          mx: 'auto',
          '& .MuiGrid-item': {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          },
          '& .MuiFormControl-root': {
            width: '420px !important',
            minWidth: '420px',
            maxWidth: '420px',
          },
          '& .MuiInputBase-root': {
            height: 56,
            minHeight: 56,
            maxHeight: 56,
            boxSizing: 'border-box',
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            height: 56,
            minHeight: 56,
            maxHeight: 56,
            background: '#fff',
            boxSizing: 'border-box',
          },
          '& .MuiInputBase-input': {
            height: '56px',
            lineHeight: '56px',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
          },
          '& .MuiSelect-select': {
            height: '56px !important',
            lineHeight: '56px !important',
            display: 'block',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
          },
          '& .MuiSelect-icon': {
            top: 'calc(50% - 12px)',
          },
          '& .MuiFormHelperText-root': {
            minHeight: 20,
            marginTop: '4px',
          },
        }}>
          {message && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Society Name */}
              <Grid item xs={12} lg={8}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Society Name <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="name"
                  placeholder="e.g., Bahria Town Lahore"
                  value={form.name} 
                  onChange={handleChange} 
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  fullWidth 
                  required 
                  helperText={getHelperText('name', 'Enter official registered society name')}
                  sx={{
                    '& .MuiSelect-select, & .MuiSelect-select.MuiSelect-outlined': {
                      color: form.type ? '#2F3D57' : '#9e9e9e',
                    },
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
              <Grid item xs={12} sm={6} lg={4}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Registration Number <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="regNo"
                  placeholder="e.g., 123456"
                  value={form.regNo} 
                  onChange={handleChange} 
                  onFocus={() => setFocusedField('regNo')}
                  onBlur={() => setFocusedField('')}
                  fullWidth 
                  required
                  error={!!regNoError}
                  helperText={getHelperText('regNo', 'Enter exactly 6 digits', regNoError)}
                  inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
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
              <Grid item xs={12} sm={6} lg={4}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Established Date <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="established" 
                  type="date" 
                  value={form.established} 
                  onChange={handleChange} 
                  onFocus={() => setFocusedField('established')}
                  onBlur={() => setFocusedField('')}
                  fullWidth 
                  required 
                  error={!!establishedDateError}
                  helperText={getHelperText('established', 'Select a valid date (future date not allowed)', establishedDateError)}
                  inputProps={{ max: today }}
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
              <Grid item xs={12} sm={6} lg={4}>
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
                  error={!!selectErrors.type}
                  helperText={getSelectHelperText('type', 'Select society type from the list')}
                  placeholder="Please select the society type"
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) =>
                      selected ? selected : <span style={{ color: '#9e9e9e' }}>Please select the society type</span>,
                  }}
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
                    '& .MuiFormHelperText-root': {
                      color: selectErrors.type ? '#d32f2f' : '#9e9e9e',
                    },
                  }}
                >
                  <MenuItem value="" sx={{ color: '#9e9e9e' }}>Please select the society type</MenuItem>
                  {typeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>

              {/* City Location */}
              <Grid item xs={12} sm={6} lg={4}>
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
                  error={!!selectErrors.city}
                  helperText={getSelectHelperText('city', 'Select city where society is located')}
                  placeholder="Please select the city"
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    '& .MuiSelect-select, & .MuiSelect-select.MuiSelect-outlined': {
                      color: form.city ? '#2F3D57' : '#9e9e9e',
                    },
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
                    '& .MuiFormHelperText-root': {
                      color: selectErrors.city ? '#d32f2f' : '#9e9e9e',
                    },
                  }}
                >
                  <MenuItem value="" sx={{ color: '#9e9e9e' }}>Please select the city</MenuItem>
                  {cityOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>

              {/* Custom City Name (shown when Other is selected) */}
              {form.city === 'Other' && (
                <Grid item xs={12} lg={4}>
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
                    error={!!selectErrors.customCity}
                    helperText={selectErrors.customCity || 'Enter city name when "Other" is selected'}
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
                      '& .MuiFormHelperText-root': {
                        color: selectErrors.customCity ? '#d32f2f' : '#9e9e9e',
                      },
                    }}
                  />
                </Grid>
              )}

              {/* Regulatory Authority */}
              <Grid item xs={12} sm={6} lg={4}>
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
                  error={!!selectErrors.authority}
                  helperText={getSelectHelperText('authority', 'Select the authority that governs your society')}
                  placeholder="Please select the regulatory authority"
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    '& .MuiSelect-select, & .MuiSelect-select.MuiSelect-outlined': {
                      color: form.authority ? '#2F3D57' : '#9e9e9e',
                    },
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
                    '& .MuiFormHelperText-root': {
                      color: selectErrors.authority ? '#d32f2f' : '#9e9e9e',
                    },
                  }}
                >
                  <MenuItem value="" sx={{ color: '#9e9e9e' }}>Please select the regulatory authority</MenuItem>
                  {authorityOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>

              {/* NOC Issued Checkbox */}
              <Grid item xs={12} sm={6} lg={4}>
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
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm({ ...form, noc_issued: checked });
                          if (!checked) {
                            setNocDocument(null);
                          }
                        }}
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

              {form.noc_issued && (
                <Grid item xs={12} sm={6} lg={4}>
                  <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                    Upload NOC Document <span style={{ color: '#ED7600' }}>*</span>
                  </Typography>
                  <TextField
                    type="file"
                    fullWidth
                    required
                    inputProps={{ accept: '.pdf,image/png,image/jpeg,image/jpg' }}
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) {
                        setNocDocument(null);
                        return;
                      }

                      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
                      if (!allowedTypes.includes(file.type)) {
                        showPopup('Invalid File', 'Please upload PDF, PNG, or JPG file for NOC document.', 'error');
                        e.target.value = '';
                        setNocDocument(null);
                        return;
                      }

                      if (file.size > 10 * 1024 * 1024) {
                        showPopup('File Too Large', 'NOC document must be less than 10MB.', 'error');
                        e.target.value = '';
                        setNocDocument(null);
                        return;
                      }

                      setNocDocument(file);
                    }}
                    helperText={nocDocument ? `Selected: ${nocDocument.name}` : 'Allowed: PDF, PNG, JPG (max 10MB)'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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

              {/* Land Acquisition Status */}
              <Grid item xs={12} sm={6} lg={4}>
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
                  error={!!selectErrors.land_acquisition_status}
                  helperText={getSelectHelperText('land_acquisition_status', 'Select current land acquisition stage')}
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    '& .MuiSelect-select, & .MuiSelect-select.MuiSelect-outlined': {
                      color: form.land_acquisition_status ? '#2F3D57' : '#9e9e9e',
                    },
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
                    '& .MuiFormHelperText-root': {
                      color: selectErrors.land_acquisition_status ? '#d32f2f' : '#9e9e9e',
                    },
                  }}
                >
                  <MenuItem value="" sx={{ color: '#9e9e9e' }}>Please select the land acquisition status</MenuItem>
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="not_applicable">Not Applicable</MenuItem>
                </TextField>
              </Grid>

              {/* Procurement Status */}
              <Grid item xs={12} sm={6} lg={4}>
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
                  error={!!selectErrors.procurement_status}
                  helperText={getSelectHelperText('procurement_status', 'Select current procurement stage')}
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    '& .MuiSelect-select, & .MuiSelect-select.MuiSelect-outlined': {
                      color: form.procurement_status ? '#2F3D57' : '#9e9e9e',
                    },
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
                    '& .MuiFormHelperText-root': {
                      color: selectErrors.procurement_status ? '#d32f2f' : '#9e9e9e',
                    },
                  }}
                >
                  <MenuItem value="" sx={{ color: '#9e9e9e' }}>Please select the procurement status</MenuItem>
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="not_applicable">Not Applicable</MenuItem>
                </TextField>
              </Grid>

              {/* Contact Number */}
              <Grid item xs={12} sm={6} lg={4}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Contact Number <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="contact"
                  placeholder="3XX-XXXXXXX"
                  value={form.contact} 
                  onChange={handleChange} 
                  onFocus={() => setFocusedField('contact')}
                  onBlur={() => setFocusedField('')}
                  fullWidth 
                  required
                  error={!!phoneError}
                  helperText={getHelperText('contact', 'Enter 10 digits (e.g., 300-1234567)', phoneError)}
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
                          <Typography sx={{ fontSize: 18 }}>Ã°Å¸â€¡ÂµÃ°Å¸â€¡Â°</Typography>
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
              <Grid item xs={12} sm={6} lg={4}>
                <Typography sx={{ mb: 1, color: '#2F3D57', fontWeight: 600, fontSize: 15 }}>
                  Website URL <span style={{ color: '#ED7600' }}>*</span>
                </Typography>
                <TextField 
                  name="website"
                  placeholder="https://www.yoursociety.com"
                  value={form.website} 
                  onChange={handleChange} 
                  onFocus={() => setFocusedField('website')}
                  onBlur={() => setFocusedField('')}
                  fullWidth 
                  required
                  error={!!websiteError}
                  helperText={getHelperText('website', 'Use format: https://www.example.com', websiteError)}
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
                  }} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <CircularProgress size={20} sx={{ color: '#fff' }} />
                        Submitting Registration...
                      </Box>
                    ) : (
                      'Submit Registration'
                    )}
                  </Button>
                </Box>
                <Typography sx={{ 
                  textAlign: 'center', 
                  mt: 3, 
                  color: '#666', 
                  fontSize: 13,
                  fontStyle: 'italic' 
                }}>
                  * All fields are required Ã¢â‚¬Â¢ Your registration will be reviewed by admin
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

