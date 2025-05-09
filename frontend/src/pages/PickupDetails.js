import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Rating,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Send as SendIcon
} from '@mui/icons-material';

const PickupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickup, setPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimRequestDialog, setClaimRequestDialog] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimRequests, setClaimRequests] = useState([]);
  const [claimRequestsDialog, setClaimRequestsDialog] = useState(false);

  useEffect(() => {
    fetchPickupDetails();
  }, [id]);

  const fetchPickupDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${config.API_URL}/api/pickups/${id}`);
      setPickup(response.data);
    } catch (error) {
      console.error('Error fetching pickup details:', error);
      setError(error.response?.data?.message || 'Failed to fetch pickup details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePickup = async () => {
    try {
      await axios.patch(`${config.API_URL}/api/pickups/${id}/complete`);
      fetchPickupDetails();
    } catch (error) {
      setError('Failed to complete pickup');
    }
  };

  const handleClaimRequest = async () => {
    try {
      const response = await axios.post(`${config.API_URL}/api/claim-requests/${id}`, {
        message: claimMessage
      });
      setPickup(response.data);
      setClaimRequestDialog(false);
      setClaimMessage('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to request claim');
    }
  };

  const handleApproveClaim = async (requestId) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/claim-requests/${id}/${requestId}/approve`);
      setPickup(response.data);
      setClaimRequestsDialog(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to approve claim');
    }
  };

  const handleRejectClaim = async (requestId) => {
    try {
      const response = await axios.post(`${config.API_URL}/api/claim-requests/${id}/${requestId}/reject`);
      setPickup(response.data);
      setClaimRequestsDialog(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reject claim');
    }
  };

  const fetchClaimRequests = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/api/claim-requests/${id}`);
      setClaimRequests(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch claim requests');
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

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!pickup) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Pickup not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Chip
            label={pickup.status.toUpperCase()}
            color={getStatusColor(pickup.status)}
            size="small"
          />
        </Box>

        <Typography variant="h4" gutterBottom>
          {pickup.wasteType.charAt(0).toUpperCase() + pickup.wasteType.slice(1)} Pickup
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Details
            </Typography>
            <Typography variant="body1">
              Size: {pickup.quantity.toFixed(2)} kg
            </Typography>
            <Typography variant="body1">
              Address: {pickup.location.address}
            </Typography>
            <Typography variant="body1">
              Pickup Time: {new Date(pickup.pickupTime).toLocaleString()}
            </Typography>
            {pickup.photo && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={pickup.photo}
                  alt="Pickup"
                  style={{ maxWidth: '100%', borderRadius: '4px' }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              {pickup.status === 'completed' ? 'Completed Details' : 'Status'}
            </Typography>
            {pickup.status === 'completed' && (
              <>
                <Typography variant="body1">
                  Completed At: {new Date(pickup.completedAt).toLocaleString()}
                </Typography>
                {pickup.rating && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      Rating:
                    </Typography>
                    <Rating value={pickup.rating} readOnly />
                    {pickup.feedback && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Feedback: {pickup.feedback}
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate('/pickups')}>
            Back to List
          </Button>
          {user.userType === 'recycler' && pickup.status === 'pending' && (
            <Button variant="contained" onClick={handleCompletePickup}>
              Complete Pickup
            </Button>
          )}
        </Box>
      </Paper>

      {/* Claim Request Dialog */}
      <Dialog open={claimRequestDialog} onClose={() => setClaimRequestDialog(false)}>
        <DialogTitle>Request to Claim Pickup</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message to Household"
            value={claimMessage}
            onChange={(e) => setClaimMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimRequestDialog(false)}>Cancel</Button>
          <Button onClick={handleClaimRequest} variant="contained" color="primary">
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Claim Requests Dialog */}
      <Dialog 
        open={claimRequestsDialog} 
        onClose={() => setClaimRequestsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Claim Requests</DialogTitle>
        <DialogContent>
          <List>
            {claimRequests.map((request) => (
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
                        onClick={() => handleApproveClaim(request._id)}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        color="error" 
                        onClick={() => handleRejectClaim(request._id)}
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
          <Button onClick={() => setClaimRequestsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Buttons */}
      {user?.userType === 'recycler' && pickup.status === 'pending' && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          onClick={() => setClaimRequestDialog(true)}
          sx={{ mt: 2 }}
        >
          Request to Claim
        </Button>
      )}

      {user?.userType === 'household' && pickup.status === 'claim_requested' && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            fetchClaimRequests();
            setClaimRequestsDialog(true);
          }}
          sx={{ mt: 2 }}
        >
          View Claim Requests
        </Button>
      )}
    </Container>
  );
};

export default PickupDetails; 