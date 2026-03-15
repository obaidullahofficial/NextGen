// USAGE EXAMPLES FOR SOCIETY REGISTRATIONS LIST

// =====================================================
// 1. Add to App.jsx routing (Admin section)
// =====================================================

// Add this import to your App.jsx
import SocietyRegistrationsList from './pages/SocietyRegistrations/SocietyRegistrationsList';

// Add these routes in your Admin Routes section:
/*
<Route path="/society-registrations" element={
  <ProtectedAdminRoute>
    <AdminLayout><SocietyRegistrationsList /></AdminLayout>
  </ProtectedAdminRoute>
} />
<Route path="/pending-registrations" element={
  <ProtectedAdminRoute>
    <AdminLayout><SocietyRegistrationsList showPendingOnly={true} /></AdminLayout>
  </ProtectedAdminRoute>
} />
*/

// =====================================================
// 2. Usage in Dashboard Component
// =====================================================

import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSocietyRegistrations } from '../../hooks/useSocietyRegistrations';

const Dashboard = () => {
  const navigate = useNavigate();
  const { registrations, loading } = useSocietyRegistrations();
  const pendingCount = registrations.filter(reg => !reg.status || reg.status === 'pending').length;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Quick Stats Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Society Registrations
              </Typography>
              <Typography variant="h4" color="primary">
                {loading ? '...' : registrations.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total registrations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Approvals
              </Typography>
              <Typography variant="h4" color="warning.main">
                {loading ? '...' : pendingCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Awaiting approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Navigation Buttons */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration Management
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained"
                  onClick={() => navigate('/society-registrations')}
                  sx={{ background: '#2F3D57' }}
                >
                  View All Registrations
                </Button>
                <Button 
                  variant="outlined"
                  onClick={() => navigate('/pending-registrations')}
                  color="warning"
                >
                  Pending Approvals ({pendingCount})
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

// =====================================================
// 3. Simple Usage with Hook Only
// =====================================================

import React from 'react';
import { useSocietyRegistrations } from '../hooks/useSocietyRegistrations';

const SimpleRegistrationsList = () => {
  const { registrations, loading, error, refetch } = useSocietyRegistrations();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Society Registrations ({registrations.length})</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {registrations.map((society, index) => (
          <li key={society.id || index}>
            <strong>{society.name}</strong> - {society.status || 'Pending'}
            <br />
            <small>Contact: {society.contact} | Type: {society.type}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

// =====================================================
// 4. Admin Sidebar Menu Addition
// =====================================================

// Add to your admin sidebar component:
/*
<MenuItem onClick={() => navigate('/society-registrations')}>
  <ListItemIcon><Business /></ListItemIcon>
  <ListItemText primary="Society Registrations" />
</MenuItem>
<MenuItem onClick={() => navigate('/pending-registrations')}>
  <ListItemIcon><Pending /></ListItemIcon>
  <ListItemText primary="Pending Approvals" />
  {pendingCount > 0 && (
    <Chip size="small" label={pendingCount} color="warning" />
  )}
</MenuItem>
*/
