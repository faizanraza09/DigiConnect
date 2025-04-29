import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
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
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { api } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    pricePerKg: '',
    environmentalImpact: {
      co2Reduced: '',
      waterSaved: '',
      treesSaved: '',
      energySaved: ''
    },
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchMaterials();
    fetchMarketPrices();
  }, []);

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
      const response = await api.get('/api/analytics/market-prices');
      const pricesMap = {};
      response.data.forEach(price => {
        pricesMap[price.materialId] = {
          currentPrice: price.currentPrice,
          basePrice: price.basePrice,
          supplyLevel: price.supplyLevel,
          demandLevel: price.demandLevel,
          lastUpdated: price.lastUpdated
        };
      });
      setMarketPrices(pricesMap);
    } catch (error) {
      console.error('Error fetching market prices:', error);
    }
  };

  const handleOpenDialog = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        category: material.category,
        pricePerKg: material.pricePerKg,
        environmentalImpact: material.environmentalImpact,
        description: material.description || '',
        image: material.image || ''
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: '',
        category: '',
        pricePerKg: '',
        environmentalImpact: {
          co2Reduced: '',
          waterSaved: '',
          treesSaved: '',
          energySaved: ''
        },
        description: '',
        image: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await api.put(`/api/materials/${editingMaterial._id}`, formData);
      } else {
        await api.post('/api/materials', formData);
      }
      handleCloseDialog();
      fetchMaterials();
    } catch (error) {
      setError('Failed to save material');
    }
  };

  const handleDelete = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await api.delete(`/api/materials/${materialId}`);
        fetchMaterials();
      } catch (error) {
        setError('Failed to delete material');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Material Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Material
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Base Price (per kg)</TableCell>
              <TableCell>Market Price (per kg)</TableCell>
              <TableCell>CO2 Reduced</TableCell>
              <TableCell>Water Saved</TableCell>
              <TableCell>Trees Saved</TableCell>
              <TableCell>Energy Saved</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((material) => {
              const marketPrice = marketPrices[material._id];
              return (
                <TableRow key={material._id}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>{material.category}</TableCell>
                  <TableCell>Rs {material.pricePerKg}</TableCell>
                  <TableCell>
                    {marketPrice ? (
                      <>
                        ${marketPrice.currentPrice.toFixed(2)}
                        <Typography 
                          variant="caption" 
                          display="block"
                          color={marketPrice.currentPrice > material.pricePerKg ? 'success.main' : 'error.main'}
                        >
                          {marketPrice.currentPrice > material.pricePerKg ? '↑' : '↓'} 
                          {((marketPrice.currentPrice - material.pricePerKg) / material.pricePerKg * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Supply: {marketPrice.supplyLevel} | Demand: {marketPrice.demandLevel}
                        </Typography>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>{material.environmentalImpact.co2Reduced} kg</TableCell>
                  <TableCell>{material.environmentalImpact.waterSaved} L</TableCell>
                  <TableCell>{material.environmentalImpact.treesSaved}</TableCell>
                  <TableCell>{material.environmentalImpact.energySaved} kWh</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(material)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(material._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMaterial ? 'Edit Material' : 'Add New Material'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Material Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    label="Category"
                    onChange={handleChange}
                  >
                    <MenuItem value="plastic">Plastic</MenuItem>
                    <MenuItem value="paper">Paper</MenuItem>
                    <MenuItem value="glass">Glass</MenuItem>
                    <MenuItem value="metal">Metal</MenuItem>
                    <MenuItem value="electronics">Electronics</MenuItem>
                    <MenuItem value="organic">Organic</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Price per kg (Rs)"
                  name="pricePerKg"
                  value={formData.pricePerKg}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Environmental Impact (per kg)
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="CO2 Reduced (kg)"
                  name="environmentalImpact.co2Reduced"
                  value={formData.environmentalImpact.co2Reduced}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Water Saved (L)"
                  name="environmentalImpact.waterSaved"
                  value={formData.environmentalImpact.waterSaved}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Trees Saved"
                  name="environmentalImpact.treesSaved"
                  value={formData.environmentalImpact.treesSaved}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Energy Saved (kWh)"
                  name="environmentalImpact.energySaved"
                  value={formData.environmentalImpact.energySaved}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMaterial ? 'Save Changes' : 'Add Material'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 