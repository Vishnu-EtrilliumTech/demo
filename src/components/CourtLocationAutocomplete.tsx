'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCourtLocationAutocomplete } from '@/hooks/useCourtLocationAutocomplete';
import { CourtLocationSearchResult } from '@/app/organization/services/ecourtapi';
import { TextField } from '@mui/material';

interface CourtLocationAutocompleteProps {
  /** Bound to the hearing's free-text `courtName` field. */
  value: string;
  /** Fired on every keystroke — the caller should clear any previously picked courtLocationId here. */
  onChange: (value: string) => void;
  /** Fired only when a suggestion is clicked — the caller should set both `courtName` and `courtLocationId` from it. */
  onCourtLocationSelect: (item: CourtLocationSearchResult) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

const CourtLocationAutocomplete: React.FC<CourtLocationAutocompleteProps> = ({
  value,
  onChange,
  onCourtLocationSelect,
  placeholder = "Search for a court, or enter a location manually",
  error,
  disabled = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { predictions, isLoading, fetchPredictions, clearPredictions } = useCourtLocationAutocomplete();

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

    if (newValue.trim()) {
      fetchPredictions(newValue);
      setShowDropdown(true);
    } else {
      clearPredictions();
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (item: CourtLocationSearchResult) => {
    setShowDropdown(false);
    clearPredictions();
    onCourtLocationSelect(item);
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

          {!isLoading && predictions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(item)}
            >
              <div className="text-sm text-gray-900">
                {item.display}
              </div>
            </button>
          ))}

          {!isLoading && predictions.length === 0 && value.trim() && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No matching courts — you can still save this as a custom location
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourtLocationAutocomplete;
