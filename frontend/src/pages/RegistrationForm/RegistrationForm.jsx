import React, { useState, useEffect } from "react";
import { Box, Grid, TextField, Button, MenuItem, Typography, Alert } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PopupModal from '../../components/common/PopupModal';
import { societySignup } from '../../services/authService.js';

const authorityOptions = ["LDA", "CDA", "Bahria Group"];
const typeOptions = ["Private", "Public"];

const RegistrationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = location.state || {};
  
  const [form, setForm] = useState({
    name: "",
    type: "",
    regNo: "",
    established: "",
    authority: "",
    contact: "",
    website: "",
    plots: ""
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  
  // Popup modal state with navigation callback
  const [popup, setPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onOk: null // Callback function to execute when user clicks OK
  });
  
  // Check if user data was passed
  useEffect(() => {
    if (!userData.userEmail) {
      // If no user data, redirect to login
      navigate('/login');
    }
  }, [userData, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

    try {
      // Prepare data for society signup (includes both user and society info)
      const societyData = {
        // User information
        userName: userData.userName,
        userEmail: userData.userEmail,
        userPassword: userData.userPassword,
        // Society information
        ...form
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
    <Box sx={{ minHeight: '100vh', background: '#2F3D57', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ maxWidth: 600, width: '100%', background: '#fff', borderRadius: 4, boxShadow: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: "#2F3D57", fontWeight: 700, letterSpacing: 1 }}>
            Society Registration
          </Typography>
          <Typography sx={{ color: "#ED7600", fontWeight: 500, mt: 1 }}>
            Add your society details below
          </Typography>
          {userData.userEmail && (
            <Typography sx={{ color: "#666", fontWeight: 400, mt: 1, fontSize: 14 }}>
              Registering for: {userData.userEmail}
            </Typography>
          )}
        </Box>

        <Box sx={{ p: 3 }}>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Society Name</Typography>
                <TextField name="name" value={form.name} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Type</Typography>
                <TextField select name="type" value={form.type} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12, height: 56 } }}>
                  {typeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Reg. No</Typography>
                <TextField name="regNo" value={form.regNo} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Established</Typography>
                <TextField name="established" type="date" value={form.established} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} InputProps={{ style: { borderRadius: 12 } }} />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Authority</Typography>
                <TextField select name="authority" value={form.authority} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12, height: 56 } }}>
                  {authorityOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Contact</Typography>
                <TextField name="contact" value={form.contact} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Website</Typography>
                <TextField name="website" value={form.website} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Plots (e.g. 5 Marla, 10 Marla, 1 Kanal)</Typography>
                <TextField name="plots" value={form.plots} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button type="submit" variant="contained" sx={{
                    background: "#ED7600",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: 12,
                    py: 1.5,
                    boxShadow: 2,
                    px: 4,
                    minWidth: 120,
                    '&:hover': { background: "#d65c00" }
                  }}>
                    Submit
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
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

export default RegistrationForm;
