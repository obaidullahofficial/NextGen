import React, { useState } from "react";
import { Box, Grid, TextField, Button, MenuItem, Typography } from "@mui/material";

const authorityOptions = ["LDA", "CDA", "Bahria Group"];
const typeOptions = ["Private", "Public"];

const RegistrationForm = ({ onSubmit }) => {
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#2F3D57', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ maxWidth: 600, width: '100%', background: '#fff', borderRadius: 4, boxShadow: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: "#2F3D57", fontWeight: 700, letterSpacing: 1 }}>Society Registration</Typography>
          <Typography sx={{ color: "#ED7600", fontWeight: 500, mt: 1 }}>Add your society details below</Typography>
        </Box>
  <Box sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Society Name</Typography>
                <TextField name="name" value={form.name} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Type</Typography>
                <TextField select name="type" value={form.type} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12, height: 56 } }} sx={{ mb: 1, minHeight: 56, fontSize: 18, width: '100%', minWidth: 300 }}>
                  {typeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Reg. No</Typography>
                <TextField name="regNo" value={form.regNo} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Established</Typography>
                <TextField name="established" type="date" value={form.established} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} InputProps={{ style: { borderRadius: 12 } }} sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Authority</Typography>
                <TextField select name="authority" value={form.authority} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12, height: 56 } }} sx={{ mb: 1, minHeight: 56, fontSize: 18, width: '100%', minWidth: 300 }}>
                  {authorityOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Contact</Typography>
                <TextField name="contact" value={form.contact} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Website</Typography>
                <TextField name="website" value={form.website} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} sx={{ mb: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ mb: 0.5, color: '#2F3D57', fontWeight: 500, textAlign: 'left' }}>Plots (e.g. 5 Marla, 10 Marla, 1 Kanal)</Typography>
                <TextField name="plots" value={form.plots} onChange={handleChange} fullWidth required InputProps={{ style: { borderRadius: 12 } }} sx={{ mb: 1 }} />
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
                    width: 'auto',
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
    </Box>
  );
};

export default RegistrationForm;
