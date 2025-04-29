import React, { useEffect, useRef } from 'react';
import { TextField, Box, Button } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';

const AddressInput = ({ value, onChange, onLocationSelect, error, helperText }) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (window.google && inputRef.current) {
      // Create a new PlaceAutocompleteElement
      const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });

      // Add the element to the DOM
      inputRef.current.appendChild(placeAutocomplete);

      // Listen for place selection using the correct event
      placeAutocomplete.addEventListener('place_changed', () => {
        const place = placeAutocomplete.getPlace();
        if (place.geometry) {
          const address = place.formatted_address;
          const coordinates = [
            place.geometry.location.lng(),
            place.geometry.location.lat()
          ];
          onLocationSelect({ address, coordinates });
        }
      });

      // Store reference for cleanup
      autocompleteRef.current = placeAutocomplete;

      // Cleanup function
      return () => {
        if (autocompleteRef.current) {
          inputRef.current.removeChild(autocompleteRef.current);
        }
      };
    }
  }, [onLocationSelect]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const geocoder = new window.google.maps.Geocoder();
            const result = await geocoder.geocode({
              location: { lat: latitude, lng: longitude }
            });
            
            if (result.results[0]) {
              const address = result.results[0].formatted_address;
              const coordinates = [longitude, latitude];
              onLocationSelect({ address, coordinates });
              
              // Update the input field value
              if (autocompleteRef.current) {
                const input = autocompleteRef.current.querySelector('input');
                if (input) {
                  input.value = address;
                  // Trigger the place_changed event
                  const event = new Event('place_changed');
                  autocompleteRef.current.dispatchEvent(event);
                }
              }
            }
          } catch (error) {
            console.error('Error getting address from coordinates:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label="Address"
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
        margin="normal"
        required
      />
      <Button
        variant="outlined"
        startIcon={<LocationIcon />}
        onClick={getCurrentLocation}
        sx={{ mt: 1 }}
      >
        Use Current Location
      </Button>
    </Box>
  );
};

export default AddressInput; 