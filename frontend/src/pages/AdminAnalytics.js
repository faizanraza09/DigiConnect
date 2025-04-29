import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Paper, Typography, Box, Grid, Card, CardContent, Tabs, Tab } from '@mui/material';
import ForceGraph2D from 'react-force-graph-2d';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminAnalytics = () => {
  const { api } = useAuth();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
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
    materialDistribution: []
  });
  const graphRef = useRef();

  useEffect(() => {
    fetchNetworkData();
    fetchAnalyticsData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const response = await api.get('/api/analytics/network');
      const { nodes, edges, metrics } = response.data;
      
      const links = edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        value: edge.value
      }));

      setGraphData({ nodes, links });
    } catch (error) {
      setError('Failed to fetch network data');
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get('/api/analytics/admin');
      setAnalyticsData(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch analytics data');
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback(node => {
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y);
    graphRef.current.centerAt(node.x, node.y, 1000);
    graphRef.current.zoom(distRatio, 1000);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading analytics data...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Analytics Dashboard
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Network Analysis" />
        <Tab label="Trends" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Overview
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    Total Pickups: {analyticsData.totalPickups}
                  </Typography>
                  <Typography variant="body1">
                    Total Weight Recycled: {analyticsData.totalWeight} kg
                  </Typography>
                  <Typography variant="body1">
                    Total Value Generated: Rs {analyticsData.totalValue.toFixed(2)}
                  </Typography>
                  <Typography variant="body1">
                    Total Users: {analyticsData.totalUsers}
                  </Typography>
                  <Typography variant="body1">
                    Active Recyclers: {analyticsData.activeRecyclers}
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
                    <LineChart data={analyticsData.materialDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Weight (kg)" />
                      <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Value (Rs)" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '600px' }}>
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={node => node.type === 'recycler' ? '#4caf50' : '#2196f3'}
                linkColor={() => '#999'}
                linkWidth={link => link.weight / 10}
                nodeVal={node => node.type === 'recycler' ? 10 : 5}
                onNodeClick={handleNodeClick}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Metrics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    Total Nodes: {graphData.nodes.length}
                  </Typography>
                  <Typography variant="body1">
                    Total Connections: {graphData.links.length}
                  </Typography>
                  <Typography variant="body1">
                    Average Degree: {(graphData.links.length / graphData.nodes.length).toFixed(2)}
                  </Typography>
                  <Typography variant="body1">
                    Network Density: {(graphData.links.length / (graphData.nodes.length * (graphData.nodes.length - 1))).toFixed(4)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pickup Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.pickupTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="count" stroke="#8884d8" name="Pickup Count" />
                      <Line yAxisId="right" type="monotone" dataKey="value" stroke="#82ca9d" name="Total Value (Rs)" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AdminAnalytics; 