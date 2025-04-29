import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';
import AddressInput from '../components/AddressInput';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: {
      address: user?.location?.address || '',
      coordinates: user?.location?.coordinates || []
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLocationSelect = ({ address, coordinates }) => {
    setFormData(prev => ({
      ...prev,
      location: {
        address,
        coordinates
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.patch(`${config.API_URL}/api/users/profile`, formData);
      setSuccess('Profile updated successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">User data not available</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                <Typography variant="h5" gutterBottom>
                  {user?.name || 'User'}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {user?.userType === 'household' ? 'Household Member' : 'Recycler'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone Number"
                    secondary={user?.phoneNumber || 'Not set'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={user?.location?.address || 'Not set'}
                  />
                </ListItem>
                {user?.userType === 'recycler' && (
                  <>
                    <ListItem>
                      <ListItemIcon>
                        <StarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Rating"
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Rating value={user?.rating || 0} readOnly precision={0.5} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              ({user?.totalRatings || 0} ratings)
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Pickups"
                        secondary={user?.totalPickups || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Weight"
                        secondary={`${user?.totalWeight || 0} kg`}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Edit Profile
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <AddressInput
                    value={formData.location.address}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'location.address',
                        value: e.target.value
                      }
                    })}
                    onLocationSelect={handleLocationSelect}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 