import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Paper, Typography, Box, Grid, Card, CardContent, Tabs, Tab, CircularProgress, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, FormControl, InputLabel, Select, MenuItem, ButtonGroup, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { GoogleMap, useJsApiLoader, Polyline, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

// Karachi coordinates
const defaultCenter = {
  lat: 24.8607,
  lng: 67.0011
};

// Define libraries as a constant outside the component
const libraries = ['marker'];

// Define map styles as a constant
const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  }
];

// Define map options as a constant
const mapOptions = {
  mapId: '6159e900830b3d44',
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true
};

const AdminAnalytics = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [analyticsData, setAnalyticsData] = useState({
    totalPickups: 0,
    totalWeight: 0,
    totalValue: 0,
    totalUsers: 0,
    activeRecyclers: 0,
    pickupTrends: [],
    materialDistribution: [],
    userGrowth: [],
    topRecyclers: [],
    topHouseholds: [],
    materialTrends: {}
  });
  const [networkData, setNetworkData] = useState({
    nodes: [],
    edges: []
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('price');
  const [timeframe, setTimeframe] = useState('30');
  const [cumulativeData, setCumulativeData] = useState({});

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    version: 'weekly'
  });

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

  // Function to format currency
  const formatCurrency = (value) => {
    return `Rs ${Number(value).toFixed(2)}`;
  };

  useEffect(() => {
    fetchNetworkData();
    fetchAnalyticsData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const response = await api.get('/api/analytics/network');
      console.log('Network data received:', response.data);
      setNetworkData(response.data);
    } catch (error) {
      console.error('Error fetching network data:', error);
      setError('Failed to load network data');
    }
  };

  const getCoordinatesFromAddress = async (address) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results[0]) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  };

  // Function to create marker content
  const createMarkerContent = useCallback((type) => {
    const div = document.createElement('div');
    div.style.width = '16px';
    div.style.height = '16px';
    div.style.borderRadius = '50%';
    div.style.backgroundColor = type === 'recycler' ? 'green' : 'blue';
    div.style.border = '2px solid white';
    div.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
    return div;
  }, []);

  // Function to create advanced markers
  const createMarkers = useCallback(async (map, nodes) => {
    if (!map || !nodes.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Import the marker library
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // Create new markers
    const newMarkers = nodes.map(node => {
      const marker = new AdvancedMarkerElement({
        map,
        position: node.position,
        content: createMarkerContent(node.type)
      });

      marker.addListener('gmp-click', () => setSelectedNode(node));
      return marker;
    });

    markersRef.current = newMarkers;
  }, [createMarkerContent]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  
    if (networkData.nodes.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      networkData.nodes.forEach((node) => {
        if (node.position?.lat && node.position?.lng) {
          bounds.extend(node.position);
        }
      });
      mapInstance.fitBounds(bounds);
    }
  }, [networkData.nodes]);

  useEffect(() => {
    if (map && networkData.nodes.length > 0) {
      createMarkers(map, networkData.nodes);
    }
  }, [map, networkData.nodes, createMarkers]);

  const fetchAnalyticsData = async () => {
    try {
      console.log('Fetching analytics data...');
      const response = await api.get(`/api/analytics/admin?days=${timeframe}`);
      console.log('Analytics response:', response.data);
      
      if (!response.data) {
        console.error('No data received from analytics endpoint');
        setError('No data received from server');
        return;
      }

      setAnalyticsData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error.response?.data?.message || 'Failed to fetch analytics data');
      setLoading(false);
    }
  };

  // Update data when timeframe changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderNetworkMetrics = () => {
    if (!networkData) return null;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Metrics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Total Nodes: {networkData.nodes.length.toLocaleString()}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Total Connections: {networkData.edges.length.toLocaleString()}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Average Degree: {(networkData.edges.length / networkData.nodes.length).toFixed(2)}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Network Density: {(networkData.edges.length / (networkData.nodes.length * (networkData.nodes.length - 1))).toFixed(4)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Function to calculate cumulative values
  const calculateCumulativeData = useCallback((data) => {
    if (!data) return {};
    
    const cumulative = {};
    Object.entries(data).forEach(([material, trends]) => {
      cumulative[material] = trends.map((point, index) => {
        const previousPoints = trends.slice(0, index + 1);
        return {
          ...point,
          cumulativeWeight: previousPoints.reduce((sum, p) => sum + p.weight, 0),
          cumulativeValue: previousPoints.reduce((sum, p) => sum + (p.weight * p.price), 0)
        };
      });
    });
    return cumulative;
  }, []);

  // Update cumulative data when material trends change
  useEffect(() => {
    if (analyticsData.materialTrends) {
      setCumulativeData(calculateCumulativeData(analyticsData.materialTrends));
    }
  }, [analyticsData.materialTrends, calculateCumulativeData]);

  const renderTrendsTab = () => {
    if (!analyticsData.materialTrends) return null;

    const materials = ['all', ...Object.keys(analyticsData.materialTrends)];
    const metrics = [
      { value: 'price', label: 'Price per kg' },
      { value: 'weight', label: 'Daily Weight' },
      { value: 'cumulativeWeight', label: 'Cumulative Weight' },
      { value: 'cumulativeValue', label: 'Cumulative Value' }
    ];
    const timeframes = [
      { value: '7', label: '7 Days' },
      { value: '30', label: '30 Days' },
      { value: '90', label: '90 Days' },
      { value: '365', label: '1 Year' },
      {value: '1826', label: '5 Years'}
    ];

    const getChartData = () => {
      if (selectedMaterial === 'all') {
        // Aggregate data for all materials
        const dates = new Set();
        Object.values(analyticsData.materialTrends).forEach(trends => {
          trends.forEach(point => dates.add(point.date));
        });

        return Array.from(dates).sort().map(date => {
          const point = {
            date,
            price: 0,
            weight: 0,
            value: 0,
            cumulativeWeight: 0,
            cumulativeValue: 0
          };

          Object.entries(analyticsData.materialTrends).forEach(([material, trends]) => {
            const materialPoint = trends.find(p => p.date === date);
            if (materialPoint) {
              point.price = (point.price * point.weight + materialPoint.price * materialPoint.weight) / 
                           (point.weight + materialPoint.weight) || materialPoint.price;
              point.weight += materialPoint.weight;
              point.value += materialPoint.value;
              point.cumulativeWeight += materialPoint.cumulativeWeight;
              point.cumulativeValue += materialPoint.cumulativeValue;
            }
          });

          return point;
        });
      } else {
        return analyticsData.materialTrends[selectedMaterial] || [];
      }
    };

    const chartData = getChartData();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Material</InputLabel>
                    <Select
                      value={selectedMaterial}
                      label="Material"
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                    >
                      {materials.map(material => (
                        <MenuItem key={material} value={material}>
                          {material === 'all' ? 'All Materials' : material}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
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

              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(value) => {
                        if (selectedMetric === 'price') return `Rs ${value.toFixed(2)}`;
                        if (selectedMetric === 'weight' || selectedMetric === 'cumulativeWeight') return `${value.toFixed(2)} kg`;
                        if (selectedMetric === 'cumulativeValue') return `Rs ${value.toFixed(2)}`;
                        return value;
                      }}
                    />
                    <Tooltip 
                      labelFormatter={formatDate}
                      formatter={(value) => {
                        if (selectedMetric === 'price') return [`Rs ${value.toFixed(2)}`, 'Price per kg'];
                        if (selectedMetric === 'weight') return [`${value.toFixed(2)} kg`, 'Daily Weight'];
                        if (selectedMetric === 'cumulativeWeight') return [`${value.toFixed(2)} kg`, 'Cumulative Weight'];
                        if (selectedMetric === 'cumulativeValue') return [`Rs ${value.toFixed(2)}`, 'Cumulative Value'];
                        return [value, selectedMetric];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey={selectedMetric}
                      stroke="#8884d8"
                      dot={false}
                      name={metrics.find(m => m.value === selectedMetric)?.label}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
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
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  // Sort data chronologically
  const sortedPickupTrends = sortDataChronologically(analyticsData.pickupTrends);
  const sortedUserGrowth = sortDataChronologically(analyticsData.userGrowth);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Analytics Dashboard
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Network Analysis" />
        <Tab label="Trends" />
        <Tab label="User Insights" />
      </Tabs>

      {/* Always mounted map with conditional visibility */}
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6" gutterBottom>
            Network Visualization
          </Typography>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onMapLoad}
            options={mapOptions}
          >
            {networkData.edges.map((edge, index) => {
              const sourceNode = networkData.nodes.find(n => n.id === edge.source);
              const targetNode = networkData.nodes.find(n => n.id === edge.target);
              console.log('Drawing polyline with path:', [
                sourceNode.position,
                targetNode.position
              ]);
              if (sourceNode && targetNode) {
                return (
                  <Polyline
                  key={`edge-${edge.source}-${edge.target}`}
                    path={[
                      sourceNode.position,
                      targetNode.position
                    ]}
                    options={{
                      strokeColor: '#FF0000',
                      strokeOpacity: 0.3,
                      strokeWeight: 1
                    }}
                  />
                );
              }
              return null;
            })}
            {selectedNode && (
              <InfoWindow
                position={selectedNode.position}
                onCloseClick={() => setSelectedNode(null)}
              >
                <div>
                  <Typography variant="subtitle1">
                    {selectedNode.name}
                  </Typography>
                  <Typography variant="body2">
                    Type: {selectedNode.type}
                  </Typography>
                  <Typography variant="body2">
                    Address: {selectedNode.address}
                  </Typography>
                  <Typography variant="body2">
                    Total Weight: {selectedNode.weight.toFixed(2)} kg
                  </Typography>
                  <Typography variant="body2">
                    Total Value: Rs {selectedNode.value.toFixed(2)}
                  </Typography>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </Paper>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Overview
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    Total Pickups: {analyticsData.totalPickups.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Total Weight Recycled: {(analyticsData.totalWeight).toFixed(2)} kg
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Total Value Generated: {formatCurrency(analyticsData.totalValue)}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Total Users: {analyticsData.totalUsers.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Material Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.materialDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'weight') return [`${value.toFixed(2)} kg`, 'Weight'];
                          if (name === 'value') return [formatCurrency(value), 'Value'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="weight" fill="#8884d8" name="Weight (kg)" />
                      <Bar yAxisId="right" dataKey="value" fill="#82ca9d" name="Value (Rs)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && renderNetworkMetrics()}

      {tabValue === 2 && renderTrendsTab()}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Growth
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : analyticsData?.userGrowth ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="New Users" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="textSecondary" align="center">
                  No user growth data available
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Recyclers
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : analyticsData?.topRecyclers?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Pickups</TableCell>
                        <TableCell align="right">Total Weight (kg)</TableCell>
                        <TableCell align="right">Total Value (Rs)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.topRecyclers.map((recycler) => (
                        <TableRow key={recycler._id}>
                          <TableCell>{recycler.name}</TableCell>
                          <TableCell align="right">{recycler.pickupCount}</TableCell>
                          <TableCell align="right">{recycler.totalWeight.toFixed(2)}</TableCell>
                          <TableCell align="right">{recycler.totalValue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center">
                  No recycler data available
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Households
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : analyticsData?.topHouseholds?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Pickups</TableCell>
                        <TableCell align="right">Total Weight (kg)</TableCell>
                        <TableCell align="right">Total Value (Rs)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.topHouseholds.map((household) => (
                        <TableRow key={household._id}>
                          <TableCell>{household.name}</TableCell>
                          <TableCell align="right">{household.pickupCount}</TableCell>
                          <TableCell align="right">{household.totalWeight.toFixed(2)}</TableCell>
                          <TableCell align="right">{household.totalValue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center">
                  No household data available
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AdminAnalytics; 