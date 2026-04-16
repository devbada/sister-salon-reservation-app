import { useState, useEffect, useCallback } from 'react';
import { designerApi } from '../lib/tauri';

export type OnboardingStep = 'display' | 'designer' | 'hours' | 'complete';

interface OnboardingState {
  completed: boolean;
  currentStep: OnboardingStep;
  isChecking: boolean;
}

const STORAGE_KEY = 'onboarding_state';

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    completed: true, // default to true to avoid flash
    currentStep: 'display',
    isChecking: true,
  });

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.onboardingCompleted) {
          setState({ completed: true, currentStep: 'complete', isChecking: false });
          return;
        }
      }

      // Check if designers exist (if they do, user may have set up already)
      try {
        const designers = await designerApi.getAll();
        if (designers.length > 0) {
          // Already has designers, mark as completed
          completeOnboardingInternal();
          return;
        }
      } catch {
        // If we can't check (e.g., dev mode without tauri), still show onboarding
      }

      setState({ completed: false, currentStep: 'display', isChecking: false });
    } catch {
      setState({ completed: false, currentStep: 'display', isChecking: false });
    }
  };

  const completeOnboardingInternal = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
    }));
    setState({ completed: true, currentStep: 'complete', isChecking: false });
  };

  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const steps: OnboardingStep[] = ['display', 'designer', 'hours', 'complete'];
      const currentIndex = steps.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
      return { ...prev, currentStep: steps[nextIndex] };
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    completeOnboardingInternal();
  }, []);

  return {
    ...state,
    goToStep,
    nextStep,
    completeOnboarding,
  };
}
