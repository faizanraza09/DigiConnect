import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Send as SendIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';

const PickupList = () => {
  const location = useLocation();
  const { user, api } = useAuth();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingDialog, setRatingDialog] = useState({
    open: false,
    pickup: null,
    rating: 0,
    feedback: ''
  });
  const [claimRequestDialog, setClaimRequestDialog] = useState({
    open: false,
    pickupId: null,
    message: ''
  });
  const [claimRequestsDialog, setClaimRequestsDialog] = useState({
    open: false,
    pickupId: null,
    requests: []
  });

  useEffect(() => {
    fetchPickups();
  }, [location.pathname]);

  const fetchPickups = async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/api/pickups/my-pickups';
      
      // If we're on the Find Pickups page and user is a recycler
      if (location.pathname === '/find-pickups' && user.userType === 'recycler') {
        try {
          const position = await getCurrentPosition();
          url = `/api/pickups/nearby?longitude=${position.coords.longitude}&latitude=${position.coords.latitude}`;
        } catch (error) {
          console.error('Error getting location:', error);
          setError('Failed to get your location. Please enable location services.');
          return;
        }
      }
      
      const response = await api.get(url);
      setPickups(response.data);
    } catch (error) {
      console.error('Error fetching pickups:', error);
      setError(error.response?.data?.message || 'Failed to fetch pickups');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  };

  const handleClaimRequest = async () => {
    try {
      await api.post(`/api/claim-requests/${claimRequestDialog.pickupId}`, {
        message: claimRequestDialog.message
      });
      setClaimRequestDialog({ open: false, pickupId: null, message: '' });
      fetchPickups();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to request claim');
    }
  };

  const handleCompletePickup = async (pickupId) => {
    try {
      await api.patch(`/api/pickups/${pickupId}/complete`);
      fetchPickups();
    } catch (error) {
      setError('Failed to complete pickup');
    }
  };

  const handleRatePickup = async () => {
    try {
      await api.post(`/api/ratings/${ratingDialog.pickup._id}`, {
        rating: ratingDialog.rating,
        feedback: ratingDialog.feedback
      });
      setRatingDialog({ open: false, pickup: null, rating: 0, feedback: '' });
      fetchPickups();
    } catch (error) {
      setError('Failed to submit rating');
    }
  };

  const fetchClaimRequests = async (pickupId) => {
    try {
      const response = await api.get(`/api/claim-requests/${pickupId}`);
      setClaimRequestsDialog(prev => ({
        ...prev,
        requests: response.data
      }));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch claim requests');
    }
  };

  const handleApproveClaim = async (pickupId, requestId) => {
    try {
      await api.post(`/api/claim-requests/${pickupId}/${requestId}/approve`);
      setClaimRequestsDialog(prev => ({ ...prev, open: false }));
      fetchPickups();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to approve claim');
    }
  };

  const handleRejectClaim = async (pickupId, requestId) => {
    try {
      await api.post(`/api/claim-requests/${pickupId}/${requestId}/reject`);
      setClaimRequestsDialog(prev => ({ ...prev, open: false }));
      fetchPickups();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reject claim');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'claimed':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        {location.pathname === '/find-pickups' ? 'Available Pickups' : 'My Pickups'}
      </Typography>

      {/* Claim Request Dialog */}
      <Dialog open={claimRequestDialog.open} onClose={() => setClaimRequestDialog({ open: false, pickupId: null, message: '' })}>
        <DialogTitle>Request to Claim Pickup</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message to Household"
            value={claimRequestDialog.message}
            onChange={(e) => setClaimRequestDialog(prev => ({ ...prev, message: e.target.value }))}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimRequestDialog({ open: false, pickupId: null, message: '' })}>
            Cancel
          </Button>
          <Button onClick={handleClaimRequest} variant="contained" color="primary">
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Claim Requests Dialog */}
      <Dialog 
        open={claimRequestsDialog.open} 
        onClose={() => setClaimRequestsDialog(prev => ({ ...prev, open: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Claim Requests</DialogTitle>
        <DialogContent>
          <List>
            {claimRequestsDialog.requests.map((request) => (
              <React.Fragment key={request._id}>
                <ListItem>
                  <ListItemText
                    primary={request.recyclerId.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          Rating: <Rating value={request.recyclerId.rating} readOnly size="small" />
                          ({request.recyclerId.totalRatings})
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="textSecondary">
                          {request.message}
                        </Typography>
                      </>
                    }
                  />
                  {request.status === 'pending' && (
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        color="primary" 
                        onClick={() => handleApproveClaim(claimRequestsDialog.pickupId, request._id)}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        color="error" 
                        onClick={() => handleRejectClaim(claimRequestsDialog.pickupId, request._id)}
                      >
                        <CloseIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimRequestsDialog(prev => ({ ...prev, open: false }))}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        {pickups.map((pickup) => (
          <Grid item xs={12} md={4} key={pickup._id}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={pickup.status.toUpperCase()}
                    color={getStatusColor(pickup.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Pickup Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Materials Breakdown:
                  </Typography>
                  {pickup.materials.map((material, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {material.materialId?.name || 'Unknown Material'}
                      </Typography>
                      <Typography variant="body2">
                        {material.quantity} kg × Rs {material.priceAtPickup?.toFixed(2) || material.materialId?.pricePerKg?.toFixed(2) || '0.00'}/kg = Rs {((material.quantity || 0) * (material.priceAtPickup || material.materialId?.pricePerKg || 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="subtitle2" color="primary">
                      Total Weight:
                    </Typography>
                    <Typography variant="subtitle2">
                      {pickup.totalWeight || 0} kg
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="primary">
                      Total Value:
                    </Typography>
                    <Typography variant="subtitle2">
                      Rs {(pickup.totalValue || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Pickup Information:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📍 {pickup.location.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🕒 {new Date(pickup.pickupDate).toLocaleString()}
                  </Typography>
                  {pickup.recyclerId && (
                    <Typography variant="body2" color="text.secondary">
                      👤 Recycler: {pickup.recyclerId.name}
                    </Typography>
                  )}
                </Box>
              </CardContent>
              <CardActions>
                {user.userType === 'recycler' && pickup.status === 'pending' && location.pathname === '/find-pickups' && (
                  <Button 
                    size="small" 
                    startIcon={<SendIcon />}
                    onClick={() => setClaimRequestDialog({ 
                      open: true, 
                      pickupId: pickup._id, 
                      message: '' 
                    })}
                  >
                    Request to Claim
                  </Button>
                )}
                {user.userType === 'recycler' && pickup.status === 'claimed' && 
                  pickup.recyclerId._id === user._id && location.pathname === '/my-pickups' && (
                  <Button size="small" onClick={() => handleCompletePickup(pickup._id)}>
                    Complete Pickup
                  </Button>
                )}
                {user.userType === 'household' && pickup.status === 'completed' && 
                  !pickup.rating && location.pathname === '/my-pickups' && (
                  <Button
                    size="small"
                    onClick={() => setRatingDialog({ open: true, pickup, rating: 0, feedback: '' })}
                  >
                    Rate Pickup
                  </Button>
                )}
                {user.userType === 'household' && pickup.status === 'claim_requested' && location.pathname === '/my-pickups' && (
                  <Button
                    size="small"
                    onClick={() => {
                      setClaimRequestsDialog({
                        open: true,
                        pickupId: pickup._id,
                        requests: []
                      });
                      fetchClaimRequests(pickup._id);
                    }}
                  >
                    View Claim Requests
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Rating Dialog */}
      <Dialog open={ratingDialog.open} onClose={() => setRatingDialog({ ...ratingDialog, open: false })}>
        <DialogTitle>Rate Pickup</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Rating
              value={ratingDialog.rating}
              onChange={(event, newValue) => {
                setRatingDialog({ ...ratingDialog, rating: newValue });
              }}
            />
            <TextField
              label="Feedback (optional)"
              multiline
              rows={4}
              value={ratingDialog.feedback}
              onChange={(e) => setRatingDialog({ ...ratingDialog, feedback: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialog({ ...ratingDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleRatePickup} disabled={!ratingDialog.rating}>
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PickupList; 