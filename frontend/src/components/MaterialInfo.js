import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const MaterialInfo = () => {
  const { api } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchMaterials();
    fetchMarketPrices();
  }, []);

  const fetchMaterials = async () => {
    try {
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
      const response = await api.get('/api/analytics/market-prices');
      console.log('Market prices response:', response.data);
      setMarketPrices(response.data);
    } catch (error) {
      console.error('Error fetching market prices:', error);
    }
  };

  const getMarketPrice = (materialId) => {
    const price = marketPrices.find(price => price.materialId === materialId);
    console.log('Getting market price for', materialId, ':', price);
    return price;
  };

  const getPriceChangeIndicator = (material) => {
    const marketPrice = getMarketPrice(material._id);
    if (!marketPrice) return null;

    const priceChange = ((marketPrice.currentPrice - marketPrice.basePrice) / marketPrice.basePrice) * 100;
    
    if (priceChange > 0) {
      return <Chip label={`↑ ${priceChange.toFixed(2)}%`} color="success" size="small" />;
    } else if (priceChange < 0) {
      return <Chip label={`↓ ${Math.abs(priceChange).toFixed(2)}%`} color="error" size="small" />;
    }
    return null;
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Recycling Materials Guide
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="Price List" />
            <Tab label="Environmental Impact" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {materials.map((material) => {
            const marketPrice = getMarketPrice(material._id);
            console.log('Material:', material.name, 'Market Price:', marketPrice);
            return (
              <Grid item xs={12} md={6} lg={4} key={material._id}>
                <Card>
                  {material.image && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={material.image}
                      alt={material.name}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {material.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {material.description}
                    </Typography>
                    
                    {tab === 0 ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" color="primary">
                            Current Price: Rs {marketPrice ? marketPrice.currentPrice.toFixed(2) : 'Loading...'}/kg
                          </Typography>
                          {getPriceChangeIndicator(material)}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Base Price: Rs {material.pricePerKg.toFixed(2)}/kg
                        </Typography>
                        {marketPrice && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Market Factors:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              • Supply Level: {marketPrice.supplyLevel.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              • Demand Level: {marketPrice.demandLevel.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              • Seasonal Adjustment: {(marketPrice.priceHistory[marketPrice.priceHistory.length - 1]?.factors?.seasonal * 100).toFixed(2)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              • Last Updated: {new Date(marketPrice.lastUpdated).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Environmental Impact (per kg):
                        </Typography>
                        <Typography variant="body2">
                          • CO2 Reduced: {material.environmentalImpact.co2Reduced.toFixed(2)} kg
                        </Typography>
                        <Typography variant="body2">
                          • Water Saved: {material.environmentalImpact.waterSaved.toFixed(2)} liters
                        </Typography>
                        <Typography variant="body2">
                          • Trees Saved: {material.environmentalImpact.treesSaved.toFixed(2)} trees
                        </Typography>
                        <Typography variant="body2">
                          • Energy Saved: {material.environmentalImpact.energySaved.toFixed(2)} kWh
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Container>
  );
};

export default MaterialInfo; 