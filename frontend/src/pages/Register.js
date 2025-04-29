import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AddressInput from '../components/AddressInput';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    userType: '',
    name: '',
    password: '',
    location: {
      coordinates: [0, 0],
      address: ''
    }
  });
  const [countryCode, setCountryCode] = useState('+971'); // Default UAE
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${formData.phoneNumber}`;
      const registrationData = { ...formData, phoneNumber: fullPhoneNumber };
      console.log('Registration data:', registrationData); // Debug log
      await register(registrationData);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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

  const handleLocationSelect = ({ address, coordinates }) => {
    setFormData(prev => ({
      ...prev,
      location: {
        address,
        coordinates
      }
    }));
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Register for DigiCycle
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel id="country-code-label">Country</InputLabel>
                <Select
                  labelId="country-code-label"
                  value={countryCode}
                  label="Country"
                  onChange={(e) => setCountryCode(e.target.value)}
                  required
                >
                  <MenuItem value="+971">🇦🇪 UAE (+971)</MenuItem>
                  <MenuItem value="+1">🇺🇸 USA (+1)</MenuItem>
                  <MenuItem value="+44">🇬🇧 UK (+44)</MenuItem>
                  {/* Add more countries if needed */}
                </Select>
              </FormControl>

              <TextField
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]{0,}',
                  maxLength: 15
                }}
              />
            </Box>

            <FormControl fullWidth margin="normal">
              <InputLabel id="userType-label">User Type</InputLabel>
              <Select
                labelId="userType-label"
                id="userType"
                name="userType"
                value={formData.userType}
                label="User Type"
                onChange={handleChange}
                required
              >
                <MenuItem value="household">Household</MenuItem>
                <MenuItem value="recycler">Recycler</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
            />
            <Box sx={{ mt: 2 }}>
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
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Login here
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
