'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { CoachMarkOverlay } from '@/components/CoachMark/CoachMarkOverlay';

// Types
export interface CoachMarkStep {
  target: string;
  title: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  padding?: number;
}

export interface Tour {
  id: string;
  steps: CoachMarkStep[];
}

interface CoachMarkState {
  completedTours: string[];
  version: string;
}

interface CoachMarkContextValue {
  startTour: (tour: Tour) => void;
  endTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  isActive: boolean;
  currentStep: number;
  currentTour: Tour | null;
  hasCompletedTour: (tourId: string) => boolean;
  resetTours: () => void;
  isReady: boolean;
}

const STORAGE_KEY = 'lawsome_coach_marks';
const CURRENT_VERSION = '1.0';
const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 200;

const CoachMarkContext = createContext<CoachMarkContextValue | undefined>(undefined);

interface CoachMarkProviderProps {
  children: ReactNode;
}

export const CoachMarkProvider: React.FC<CoachMarkProviderProps> = ({ children }) => {
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const pendingTourRef = useRef<Tour | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state: CoachMarkState = JSON.parse(stored);
          if (state.version === CURRENT_VERSION) {
            setCompletedTours(state.completedTours || []);
          }
        }
      } catch (error) {
        console.error('Error loading coach mark state:', error);
      }
      setIsInitialized(true);
    }
  }, []);

  // Save state to localStorage when completedTours changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      const state: CoachMarkState = {
        completedTours,
        version: CURRENT_VERSION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [completedTours, isInitialized]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const hasCompletedTour = useCallback((tourId: string): boolean => {
    return completedTours.includes(tourId);
  }, [completedTours]);

  const markTourComplete = useCallback((tourId: string) => {
    setCompletedTours(prev => {
      if (prev.includes(tourId)) return prev;
      return [...prev, tourId];
    });
  }, []);

  const attemptStartTour = useCallback((tour: Tour) => {
    // Filter steps to only include those with existing targets
    const availableSteps = tour.steps.filter(step => {
      const target = document.querySelector(step.target);
      return target !== null;
    });

    // No valid targets found
    if (availableSteps.length === 0) {
      // Retry if we haven't exceeded max attempts
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current += 1;
        retryTimeoutRef.current = setTimeout(() => {
          attemptStartTour(tour);
        }, RETRY_DELAY_MS);
        return;
      }
      // Max retries reached, give up
      console.warn(`No coach mark targets found for tour: ${tour.id} after ${MAX_RETRY_ATTEMPTS} attempts`);
      pendingTourRef.current = null;
      retryCountRef.current = 0;
      return;
    }

    // Create a filtered tour with only available steps
    const filteredTour: Tour = {
      id: tour.id,
      steps: availableSteps,
    };

    pendingTourRef.current = null;
    retryCountRef.current = 0;
    setCurrentTour(filteredTour);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const startTour = useCallback((tour: Tour) => {
    // Don't start if not initialized yet (localStorage not loaded)
    if (!isInitialized) {
      // Queue the tour to start after initialization
      pendingTourRef.current = tour;
      return;
    }

    // Don't start if already completed
    if (hasCompletedTour(tour.id)) {
      return;
    }

    // Don't start if a tour is already active
    if (isActive) {
      return;
    }

    // Reset retry count and attempt to start
    retryCountRef.current = 0;
    attemptStartTour(tour);
  }, [isInitialized, hasCompletedTour, isActive, attemptStartTour]);

  // Process pending tour after initialization
  useEffect(() => {
    if (isInitialized && pendingTourRef.current) {
      const tour = pendingTourRef.current;
      if (!hasCompletedTour(tour.id) && !isActive) {
        retryCountRef.current = 0;
        attemptStartTour(tour);
      } else {
        pendingTourRef.current = null;
      }
    }
  }, [isInitialized, hasCompletedTour, isActive, attemptStartTour]);

  const endTour = useCallback(() => {
    if (currentTour) {
      markTourComplete(currentTour.id);
    }
    setCurrentTour(null);
    setCurrentStep(0);
    setIsActive(false);
  }, [currentTour, markTourComplete]);

  const nextStep = useCallback(() => {
    if (!currentTour) return;

    const nextStepIndex = currentStep + 1;

    if (nextStepIndex >= currentTour.steps.length) {
      endTour();
      return;
    }

    // Check if next target exists
    const nextTarget = document.querySelector(currentTour.steps[nextStepIndex]?.target);
    if (!nextTarget) {
      // Skip to next available target
      for (let i = nextStepIndex + 1; i < currentTour.steps.length; i++) {
        const target = document.querySelector(currentTour.steps[i]?.target);
        if (target) {
          setCurrentStep(i);
          return;
        }
      }
      // No more valid targets, end tour
      endTour();
      return;
    }

    setCurrentStep(nextStepIndex);
  }, [currentTour, currentStep, endTour]);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  const resetTours = useCallback(() => {
    setCompletedTours([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        skipTour();
      }
    };

    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, skipTour]);

  const currentStepData = currentTour?.steps[currentStep] || null;

  return (
    <CoachMarkContext.Provider
      value={{
        startTour,
        endTour,
        nextStep,
        skipTour,
        isActive,
        currentStep,
        currentTour,
        hasCompletedTour,
        resetTours,
        isReady: isInitialized,
      }}
    >
      {children}
      {isActive && currentStepData && (
        <CoachMarkOverlay
          step={currentStepData}
          currentStep={currentStep}
          totalSteps={currentTour?.steps.length || 0}
          onNext={nextStep}
          onSkip={skipTour}
        />
      )}
    </CoachMarkContext.Provider>
  );
};

export const useCoachMark = (): CoachMarkContextValue => {
  const context = useContext(CoachMarkContext);
  if (!context) {
    throw new Error('useCoachMark must be used within a CoachMarkProvider');
  }
  return context;
};
