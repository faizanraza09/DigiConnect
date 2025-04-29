import React, { useState, useEffect, useCallback, useRef } from 'react'; // <-- here
import { Container, Paper, Typography, Box, Grid, Card, CardContent } from '@mui/material';
import ForceGraph2D from 'react-force-graph-2d'; // <-- no {}
import { useAuth } from '../context/AuthContext';

const NetworkAnalysis = () => {
  const { api } = useAuth();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const graphRef = useRef();

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const response = await api.get('/api/analytics/network');
      const { nodes, edges, metrics } = response.data;
      
      // Transform edges to links format required by react-force-graph
      const links = edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        value: edge.value
      }));

      setGraphData({ nodes, links });
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch network data');
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback(node => {
    // Center/zoom on node
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y);
    graphRef.current.centerAt(node.x, node.y, 1000);
    graphRef.current.zoom(distRatio, 1000);
  }, []);

  if (loading) {
    return (
      <Container>
        <Typography>Loading network data...</Typography>
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
        Network Analysis
      </Typography>
      
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
    </Container>
  );
};

export default NetworkAnalysis; 