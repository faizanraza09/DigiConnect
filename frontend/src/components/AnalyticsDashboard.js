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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ButtonGroup,
  Button
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
  const [selectedMaterial, setSelectedMaterial] = useState('Plastic Bottles');
  const [selectedMetric, setSelectedMetric] = useState('recyclingVolume');
  const [timeframe, setTimeframe] = useState('30');

  // Function to sort data chronologically
  const sortDataChronologically = (data) => {
    if (!data) return [];
    return [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Function to format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/api/analytics/dashboard?days=${timeframe}`);
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
  }, [timeframe]);

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

  // Sort analytics data chronologically
  const sortedAnalytics = sortDataChronologically(data?.analytics);
  // Sort market price history data chronologically
  const sortedMarketPrices = data?.marketPrices ? 
    Object.fromEntries(
      Object.entries(data.marketPrices).map(([material, priceData]) => [
        material,
        { ...priceData, history: sortDataChronologically(priceData.history) }
      ])
    ) : {};

  const metrics = [
    { value: 'recyclingVolume', label: 'Recycling Volume' },
    { value: 'environmentalImpact.co2Reduced', label: 'CO2 Reduced' },
    { value: 'environmentalImpact.treesSaved', label: 'Trees Saved' },
    { value: 'environmentalImpact.waterSaved', label: 'Water Saved' },
    { value: 'environmentalImpact.energySaved', label: 'Energy Saved' }
  ];

  const timeframes = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '90 Days' },
    { value: '365', label: '1 Year' },
    {value: '1826', label: '5 Years' }
  ];

  const getMetricLabel = (metric) => {
    const metricObj = metrics.find(m => m.value === metric);
    return metricObj ? metricObj.label : metric;
  };

  const getMetricUnit = (metric) => {
    switch (metric) {
      case 'recyclingVolume':
        return 'kg';
      case 'environmentalImpact.co2Reduced':
        return 'kg';
      case 'environmentalImpact.treesSaved':
        return 'trees';
      case 'environmentalImpact.waterSaved':
        return 'L';
      case 'environmentalImpact.energySaved':
        return 'kWh';
      default:
        return '';
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {data?.isAdmin ? 'Platform Analytics' : 'Your Recycling Analytics'}
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
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

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Total Revenue' : 'Your Revenue'}
              </Typography>
              <Typography variant="h3" color="primary">
                Rs {(data?.totalRevenue || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Total Recycling Volume' : 'Your Recycling Volume'}
              </Typography>
              <Typography variant="h3" color="primary">
                {(data?.totalRecyclingVolume || 0).toFixed(2)} kg
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
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

        {/* Environmental Impact Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Total CO2 Reduced' : 'Your CO2 Reduced'}
              </Typography>
              <Typography variant="h3" color="primary">
                {(data?.totalCO2Reduced || 0).toFixed(2)} kg
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Total Trees Saved' : 'Your Trees Saved'}
              </Typography>
              <Typography variant="h3" color="primary">
                {(data?.totalTreesSaved || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Total Water Saved' : 'Your Water Saved'}
              </Typography>
              <Typography variant="h3" color="primary">
                {(data?.totalWaterSaved || 0).toFixed(2)} L
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {data?.isAdmin ? 'Total Energy Saved' : 'Your Energy Saved'}
              </Typography>
              <Typography variant="h3" color="primary">
                {(data?.totalEnergySaved || 0).toFixed(2)} kWh
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Market Price Trends */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Market Price Trends
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Material</InputLabel>
                <Select
                  value={selectedMaterial}
                  label="Material"
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                >
                  {data?.marketPrices && Object.keys(data.marketPrices).map(material => (
                    <MenuItem key={material} value={material}>
                      {material}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <ButtonGroup fullWidth>
                {timeframes.map(tf => (
                  <Button
                    key={tf.value}
                    variant={timeframe === tf.value ? 'contained' : 'outlined'}
                    onClick={() => setTimeframe(tf.value)}
                  >
                    {tf.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Grid>
          </Grid>
          <Box height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={selectedMaterial === 'all' 
                  ? Object.values(data?.marketPrices || {}).flatMap(priceData => 
                      priceData.history.map(entry => ({
                        ...entry,
                        material: priceData.material
                      }))
                    )
                  : data?.marketPrices?.[selectedMaterial]?.history || []
                }
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={formatDate}
                  formatter={(value, name) => {
                    if (name === 'price') return [`Rs${value.toFixed(2)}`, 'Price'];
                    if (name === 'factors.supply') return [`${value.toFixed(2)}%`, 'Supply Level'];
                    if (name === 'factors.demand') return [`${value.toFixed(2)}%`, 'Demand Level'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8884d8" 
                  name="Price" 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Recycling Impact */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {data?.isAdmin ? 'Platform Recycling Impact' : 'Your Recycling Impact'}
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  label="Metric"
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  {metrics.map(metric => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <ButtonGroup fullWidth>
                {timeframes.map(tf => (
                  <Button
                    key={tf.value}
                    variant={timeframe === tf.value ? 'contained' : 'outlined'}
                    onClick={() => setTimeframe(tf.value)}
                  >
                    {tf.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Grid>
          </Grid>
          <Box height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.analytics || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={formatDate}
                  formatter={(value) => [`${value.toFixed(2)} ${getMetricUnit(selectedMetric)}`, getMetricLabel(selectedMetric)]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric.includes('.') ? selectedMetric.split('.')[1] : selectedMetric}
                  stroke="#8884d8" 
                  name={getMetricLabel(selectedMetric)}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsDashboard; 