import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Feedback = () => {
  const { api } = useAuth();
  const [feedback, setFeedback] = useState({
    type: 'feedback',
    rating: 0,
    content: '',
    category: 'service',
    userBehavior: {
      recyclingFrequency: '',
      preferredPickupTimes: [],
      recyclingTypes: []
    }
  });
  const [userFeedback, setUserFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUserFeedback = async () => {
      try {
        const response = await api.get('/api/feedback/user');
        setUserFeedback(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching feedback');
        setLoading(false);
      }
    };

    fetchUserFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/feedback', feedback);
      setSuccess(true);
      setFeedback({
        type: 'feedback',
        rating: 0,
        content: '',
        category: 'service',
        userBehavior: {
          recyclingFrequency: '',
          preferredPickupTimes: [],
          recyclingTypes: []
        }
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting feedback');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBehaviorChange = (e) => {
    const { name, value } = e.target;
    setFeedback(prev => ({
      ...prev,
      userBehavior: {
        ...prev.userBehavior,
        [name]: value
      }
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Submit Feedback
              </Typography>
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Feedback submitted successfully!
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Feedback Type</InputLabel>
                      <Select
                        name="type"
                        value={feedback.type}
                        onChange={handleChange}
                        label="Feedback Type"
                      >
                        <MenuItem value="feedback">Feedback</MenuItem>
                        <MenuItem value="survey">Survey</MenuItem>
                        <MenuItem value="complaint">Complaint</MenuItem>
                        <MenuItem value="suggestion">Suggestion</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography component="legend">Rating</Typography>
                    <Rating
                      name="rating"
                      value={feedback.rating}
                      onChange={(event, newValue) => {
                        setFeedback(prev => ({ ...prev, rating: newValue }));
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      name="content"
                      label="Your Feedback"
                      value={feedback.content}
                      onChange={handleChange}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={feedback.category}
                        onChange={handleChange}
                        label="Category"
                      >
                        <MenuItem value="service">Service</MenuItem>
                        <MenuItem value="app">App</MenuItem>
                        <MenuItem value="pickup">Pickup</MenuItem>
                        <MenuItem value="recycling">Recycling</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      User Behavior
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Recycling Frequency</InputLabel>
                      <Select
                        name="recyclingFrequency"
                        value={feedback.userBehavior.recyclingFrequency}
                        onChange={handleBehaviorChange}
                        label="Recycling Frequency"
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="rarely">Rarely</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                    >
                      Submit Feedback
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Your Previous Feedback
              </Typography>
              <List>
                {userFeedback.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={item.content}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {item.type} - {item.category}
                            </Typography>
                            <br />
                            <Rating value={item.rating} readOnly size="small" />
                            <br />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </>
                        }
                      />
                    </ListItem>
                    {index < userFeedback.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Feedback; 