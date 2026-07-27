'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import useGoogleMaps from '@/hooks/useGoogleMaps';
import { TextField } from '@mui/material';

interface AddressData {
  fullAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (addressData: AddressData) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for an address",
  error,
  disabled = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isGoogleLoaded = useGoogleMaps();
  const { predictions, isLoading, fetchPredictions, getPlaceDetails, clearPredictions } = useGooglePlacesAutocomplete();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim() && isGoogleLoaded) {
      fetchPredictions(newValue);
      setShowDropdown(true);
    } else {
      clearPredictions();
      setShowDropdown(false);
    }
  };

  const handlePlaceClick = async (placeId: string, description: string) => {
    onChange(description);
    setShowDropdown(false);
    clearPredictions();

    if (!isGoogleLoaded) {
      console.error('Google Maps not loaded');
      return;
    }

    try {
      const addressData = await getPlaceDetails(placeId);
      if (addressData) {
        onPlaceSelect(addressData);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    if (value.trim() && predictions.length > 0) {
      setShowDropdown(true);
    }
  };

  const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    "&:hover fieldset": { borderColor: "#3b82f6" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
    "&.Mui-error fieldset": { borderColor: "#ef4444" },
  },
};

  const handleInputBlur = () => {
    setInputFocused(false);
    // Delay hiding dropdown to allow for click events
    setTimeout(() => {
      if (!inputFocused) {
        setShowDropdown(false);
      }
    }, 200);
  };

  return (
    <div className="relative w-full">
      <TextField
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        size="small"
        fullWidth
        sx={inputSx}
        autoComplete="off"
      />
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {showDropdown && (predictions.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                Searching...
              </div>
            </div>
          )}
          
          {!isLoading && predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handlePlaceClick(prediction.place_id, prediction.description)}
            >
              <div className="text-sm text-gray-900">
                {prediction.description}
              </div>
            </button>
          ))}
          
          {!isLoading && predictions.length === 0 && value.trim() && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No addresses found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;