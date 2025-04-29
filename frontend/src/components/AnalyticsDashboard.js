import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const AnalyticsDashboard = () => {
  const { api, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/analytics/dashboard');
        console.log('Analytics data:', response.data);
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Analytics error:', err);
        setError(err.response?.data?.message || 'Error fetching analytics data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {data?.isAdmin ? 'Platform Analytics' : 'Your Recycling Analytics'}
      </Typography>
      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Total Pickups' : 'Your Pickups'}
              </Typography>
              <Typography variant="h3" color="primary">
                {data?.totalPickups || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Active Users' : 'Your Status'}
              </Typography>
              <Typography variant="h3" color="primary">
                {data?.isAdmin ? data?.activeUsers : 'Active'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Total Recycling Volume' : 'Your Recycling Volume'}
              </Typography>
              <Typography variant="h3" color="primary">
                {data?.totalRecyclingVolume || 0} kg
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recycling Trends Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Platform Recycling Trends' : 'Your Recycling Trends'} (Last 30 Days)
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data?.analytics}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="recyclingVolume" stroke="#8884d8" name="Recycling Volume (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Trends */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Market Trends
              </Typography>
              <Grid container spacing={3}>
                {data?.marketPrices && Object.entries(data.marketPrices).map(([material, priceData]) => (
                  <Grid item xs={12} md={6} key={material}>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={priceData.history}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name, props) => {
                              if (name === 'price') return [`Rs${value.toFixed(2)}`, 'Price'];
                              if (name === 'supply') return [`${value}%`, 'Supply Level'];
                              if (name === 'demand') return [`${value}%`, 'Demand Level'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#8884d8" 
                            name="Price" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="factors.supply" 
                            stroke="#82ca9d" 
                            name="Supply Level" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="factors.demand" 
                            stroke="#ff7300" 
                            name="Demand Level" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <Typography variant="subtitle1" align="center">
                        {material}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Environmental Impact */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Platform Environmental Impact' : 'Your Environmental Impact'}
              </Typography>
              <Grid container spacing={3}>
                {/* CO2 Reduced */}
                <Grid item xs={12} md={6}>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data?.analytics}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toFixed(2)} kg`, 'CO2 Reduced']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="environmentalImpact.co2Reduced" 
                          stroke="#8884d8" 
                          name="CO2 Reduced (kg)" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                {/* Trees Saved */}
                <Grid item xs={12} md={6}>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data?.analytics}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toFixed(2)} trees`, 'Trees Saved']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="environmentalImpact.treesSaved" 
                          stroke="#82ca9d" 
                          name="Trees Saved" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                {/* Water Saved */}
                <Grid item xs={12} md={6}>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data?.analytics}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toFixed(2)} L`, 'Water Saved']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="environmentalImpact.waterSaved" 
                          stroke="#0088FE" 
                          name="Water Saved (L)" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                {/* Energy Saved */}
                <Grid item xs={12} md={6}>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data?.analytics}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value.toFixed(2)} kWh`, 'Energy Saved']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="environmentalImpact.energySaved" 
                          stroke="#FF8042" 
                          name="Energy Saved (kWh)" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 