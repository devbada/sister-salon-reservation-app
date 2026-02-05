import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type TextSize = 'normal' | 'large' | 'extraLarge';
export type ButtonSize = 'normal' | 'large';

export interface DisplaySettings {
  textSize: TextSize;
  buttonSize: ButtonSize;
  highContrast: boolean;
}

interface DisplaySettingsContextType {
  settings: DisplaySettings;
  updateSettings: (updates: Partial<DisplaySettings>) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
}

const DEFAULT_SETTINGS: DisplaySettings = {
  textSize: 'normal',
  buttonSize: 'normal',
  highContrast: false,
};

const STORAGE_KEY = 'display_settings';
const ONBOARDING_KEY = 'display_onboarding_done';

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

function loadSettings(): DisplaySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function applyToDocument(settings: DisplaySettings) {
  const root = document.documentElement;
  root.setAttribute('data-text-size', settings.textSize);
  root.setAttribute('data-button-size', settings.buttonSize);
  root.setAttribute('data-high-contrast', String(settings.highContrast));
}

export function DisplaySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DisplaySettings>(loadSettings);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  // Apply data attributes on mount and whenever settings change
  useEffect(() => {
    applyToDocument(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<DisplaySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  return (
    <DisplaySettingsContext.Provider value={{ settings, updateSettings, hasCompletedOnboarding, completeOnboarding }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}

export function useDisplaySettings() {
  const context = useContext(DisplaySettingsContext);
  if (context === undefined) {
    throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
  }
  return context;
}
