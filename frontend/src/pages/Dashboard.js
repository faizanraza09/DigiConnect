import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Recycling as RecyclingIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Analytics as AnalyticsIcon,
  Feedback as FeedbackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import MaterialInfo from '../components/MaterialInfo';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState({
    totalPickups: 0,
    totalWeight: 0,
    totalValue: 0,
    rating: 0
  });
  const [materials, setMaterials] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});

  useEffect(() => {
    // Redirect admin users to admin dashboard
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }
    
    fetchUserStats();
    fetchMaterials();
    fetchMarketPrices();
  }, [user, navigate]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/users/stats');
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch user statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/materials');
      setMaterials(response.data);
    } catch (error) {
      setError('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketPrices = async () => {
    try {
      const response = await api.get('/api/market-prices');
      const pricesMap = {};
      response.data.forEach(price => {
        pricesMap[price.materialId] = price;
      });
      setMarketPrices(pricesMap);
    } catch (error) {
      console.error('Error fetching market prices:', error);
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">User data not available</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user.name}
      </Typography>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Pickups
              </Typography>
              <Typography variant="h4">
                {stats.totalPickups}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                Rs {stats.totalValue?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Weight
              </Typography>
              <Typography variant="h4">
                {stats.totalWeight.toFixed(2)} kg
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rating
              </Typography>
              <Box display="flex" alignItems="center">
                <Rating value={stats.rating} readOnly precision={0.5} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  ({stats.totalRatings})
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <List>
                  {stats.recentActivity.map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <RecyclingIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.description}
                          secondary={
                            <Typography component="span" variant="body2" color="textPrimary">
                              {new Date(activity.date).toLocaleDateString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < stats.recentActivity.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Material Information */}
        <Grid item xs={12}>
          <MaterialInfo />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 