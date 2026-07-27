import { useState, useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import { searchCourtLocations, CourtLocationSearchResult } from '@/app/organization/services/ecourtapi';

export const useCourtLocationAutocomplete = () => {
  const [predictions, setPredictions] = useState<CourtLocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedFetchRef = useRef<ReturnType<typeof debounce> | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!input.trim()) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const page = await searchCourtLocations(input);
      setPredictions(page.items || []);
    } catch (error) {
      console.error('Error fetching court location predictions:', error);
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
    clearPredictions
  };
};
