import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalAtm as MoneyIcon,
  Park as TreeIcon,
  WaterDrop as WaterIcon,
  ElectricBolt as EnergyIcon,
  Co2 as Co2Icon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import AddressInput from '../components/AddressInput';

const CreatePickup = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [formData, setFormData] = useState({
    materials: [{ materialId: '', quantity: 0 }],
    location: {
      type: 'Point',
      coordinates: user?.location?.coordinates || [],
      address: user?.location?.address || ''
    },
    pickupDate: '',
    pickupTime: '',
    notes: '',
    userId: user?._id
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [summary, setSummary] = useState({
    totalValue: 0,
    environmentalImpact: {
      co2Reduced: 0,
      waterSaved: 0,
      treesSaved: 0,
      energySaved: 0
    }
  });

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
    }
  };

  const fetchMarketPrices = async () => {
    try {
      const response = await api.get('/api/analytics/market-prices');
      // Convert array to object for easier lookup
      const marketPricesObj = response.data.reduce((acc, price) => {
        acc[price.materialId] = price;
        return acc;
      }, {});
      setMarketPrices(marketPricesObj);
    } catch (error) {
      console.error('Failed to fetch market prices:', error);
    }
  };

  const calculateSummary = () => {
    let totalValue = 0;
    let co2Reduced = 0;
    let waterSaved = 0;
    let treesSaved = 0;
    let energySaved = 0;

    formData.materials.forEach(item => {
      const material = materials.find(m => m._id === item.materialId);
      if (material) {
        const quantity = parseFloat(item.quantity) || 0;
        const marketPriceData = marketPrices[item.materialId];
        const marketPrice = marketPriceData?.currentPrice || material.pricePerKg;
        totalValue += quantity * marketPrice;
        co2Reduced += quantity * material.environmentalImpact.co2Reduced;
        waterSaved += quantity * material.environmentalImpact.waterSaved;
        treesSaved += quantity * material.environmentalImpact.treesSaved;
        energySaved += quantity * material.environmentalImpact.energySaved;
      }
    });

    setSummary({
      totalValue: Number(totalValue.toFixed(2)),
      environmentalImpact: {
        co2Reduced: Number(co2Reduced.toFixed(2)),
        waterSaved: Number(waterSaved.toFixed(2)),
        treesSaved: Number(treesSaved.toFixed(2)),
        energySaved: Number(energySaved.toFixed(2))
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pickupDate') {
      // Split the datetime-local value into date and time
      const [date, time] = value.split('T');
      setFormData(prev => ({
        ...prev,
        pickupDate: date,
        pickupTime: time ? `${time}:00` : '' // Ensure time is in ISO8601 format
      }));
    } else if (name.includes('.')) {
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

  const handleMaterialChange = (index, field, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index][field] = value;
    
    // If materialId is changed, update the priceAtPickup with market price
    if (field === 'materialId') {
      const material = materials.find(m => m._id === value);
      if (material) {
        const marketPriceData = marketPrices[value];
        const marketPrice = marketPriceData?.currentPrice || material.pricePerKg;
        newMaterials[index].priceAtPickup = marketPrice;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      materials: newMaterials
    }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { materialId: '', quantity: 0, priceAtPickup: 0 }]
    }));
  };

  const removeMaterial = (index) => {
    const newMaterials = formData.materials.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      materials: newMaterials
    }));
  };

  const handleLocationSelect = ({ address, coordinates }) => {
    setFormData(prev => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates,
        address
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) {
      setError('User ID is required. Please log in again.');
      return;
    }
    calculateSummary();
    setSummaryDialog(true);
  };

  const confirmPickup = async () => {
    setError('');
    setLoading(true);
  
    try {
      const pickupData = {
        ...formData,
        userId: user._id,
        pickupDate: `${formData.pickupDate}T${formData.pickupTime}`, // Correct ISO string
        pickupTime: formData.pickupTime || '00:00:00'
      };
      const response = await api.post('/api/pickups', pickupData);
      setSummaryDialog(false);
      navigate('/pickups');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create pickup request');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Request a Pickup
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {formData.materials.map((material, index) => (
              <Grid item xs={12} key={index}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <FormControl fullWidth>
                          <InputLabel>Material</InputLabel>
                          <Select
                            value={material.materialId}
                            onChange={(e) => handleMaterialChange(index, 'materialId', e.target.value)}
                          >
                            {materials.map((m) => {
                              const basePrice = m.pricePerKg;
                              const marketPriceData = marketPrices[m._id];
                              const marketPrice = marketPriceData?.currentPrice;
                              const priceDiff = marketPrice ? ((marketPrice - basePrice) / basePrice * 100).toFixed(1) : 0;
                              const priceDiffColor = priceDiff > 0 ? 'success.main' : priceDiff < 0 ? 'error.main' : 'text.secondary';
                              
                              return (
                                <MenuItem key={m._id} value={m._id}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Typography>{m.name}</Typography>
                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="body2" sx={{ mr: 1 }}>
                                        Rs {marketPrice?.toFixed(2) || basePrice.toFixed(2)}/kg
                                      </Typography>
                                      {marketPrice && marketPrice !== basePrice && (
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            color: priceDiffColor,
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          ({priceDiff > 0 ? '+' : ''}{priceDiff}%)
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          required
                          type="number"
                          label="Quantity (kg)"
                          value={material.quantity}
                          onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value))}
                          inputProps={{ min: 0, step: 0.1 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <IconButton 
                          color="error" 
                          onClick={() => removeMaterial(index)}
                          disabled={formData.materials.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={addMaterial}
                variant="outlined"
                fullWidth
              >
                Add Another Material
              </Button>
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
            <TextField
              fullWidth
              required
              type="datetime-local"
              name="pickupDate"
              label="Pickup Time"
              value={formData.pickupDate && formData.pickupTime ? `${formData.pickupDate}T${formData.pickupTime}` : ''}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="notes"
                label="Additional Notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Request Pickup'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Summary Dialog */}
      <Dialog open={summaryDialog} onClose={() => setSummaryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pickup Summary</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemIcon>
                <MoneyIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Total Value" 
                secondary={`Rs ${summary.totalValue.toFixed(2)}`}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <Co2Icon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="CO2 Reduced" 
                secondary={`${summary.environmentalImpact.co2Reduced.toFixed(2)} kg`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <WaterIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Water Saved" 
                secondary={`${summary.environmentalImpact.waterSaved.toFixed(2)} liters`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TreeIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Trees Saved" 
                secondary={`${summary.environmentalImpact.treesSaved.toFixed(2)} trees`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <EnergyIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Energy Saved" 
                secondary={`${summary.environmentalImpact.energySaved.toFixed(2)} kWh`}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryDialog(false)}>Cancel</Button>
          <Button onClick={confirmPickup} variant="contained" color="primary">
            Confirm Pickup
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreatePickup; 