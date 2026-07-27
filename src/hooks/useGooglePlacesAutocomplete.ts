import { useState, useCallback, useRef } from 'react';
import { autocomplete } from '@/lib/google';
import debounce from 'lodash.debounce';

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          PlacesService: new (element: HTMLElement) => {
            getDetails: (
              request: { placeId: string; fields: string[] },
              callback: (place: GooglePlace | null, status: string) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
          };
        };
      };
    };
  }
}

interface GooglePlace {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

interface AddressComponents {
  fullAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export const useGooglePlacesAutocomplete = () => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedFetchRef = useRef<ReturnType<typeof debounce> | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!input.trim()) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await autocomplete(input);
      setPredictions(results || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedFetchPredictions = useCallback((input: string) => {
    if (debouncedFetchRef.current) {
      debouncedFetchRef.current.cancel();
    }
    
    debouncedFetchRef.current = debounce(() => {
      fetchPredictions(input);
    }, 300);
    
    debouncedFetchRef.current();
  }, [fetchPredictions]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<AddressComponents | null> => {
    if (!window.google?.maps) {
      console.error('Google Maps not loaded');
      return null;
    }

    return new Promise((resolve) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      service.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'address_components', 'geometry']
        },
        (place: GooglePlace | null, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            let locality = '';
            let district = '';
            let state = '';
            let pincode = '';

            place.address_components?.forEach((component) => {
              const types = component.types;
              
              if (types.includes('postal_code')) {
                pincode = component.long_name;
              }
              if (types.includes('locality') || types.includes('sublocality_level_1')) {
                locality = component.long_name;
              }
              if (types.includes('administrative_area_level_3')) {
                district = component.long_name;
              }
              if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
            });

            // Strip Google Plus Code prefix (e.g. "2H5C+J6 ") that appears in formatted_address for some locations
            const plusCodeRegex = /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3},?\s*/i;
            const fullAddress = (place.formatted_address || '').replace(plusCodeRegex, '').trim();

            resolve({
              fullAddress,
              locality,
              district,
              state,
              pincode,
              latitude: place.geometry?.location?.lat(),
              longitude: place.geometry?.location?.lng()
            });
          } else {
            console.error('Place details request failed:', status);
            resolve(null);
          }
        }
      );
    });
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    if (debouncedFetchRef.current) {
      debouncedFetchRef.current.cancel();
    }
  }, []);

  return {
    predictions,
    isLoading,
    fetchPredictions: debouncedFetchPredictions,
    getPlaceDetails,
    clearPredictions
  };
};