import { useState, useEffect, useCallback, useRef } from 'react';
import { securityApi } from '../lib/tauri';
import type { LockSettings } from '../types';

interface UseAppLockReturn {
  isLocked: boolean;
  isLockEnabled: boolean;
  settings: LockSettings | null;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: LockSettings = {
  isEnabled: false,
  useBiometric: false,
  autoLockTimeout: 5,
  lockOnBackground: true,
};

export function useAppLock(): UseAppLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Load initial state
  useEffect(() => {
    checkLockStatus();
  }, []);

  // Setup auto-lock timer
  useEffect(() => {
    if (!settings || !isLockEnabled || isLocked) {
      return;
    }

    const timeout = settings.autoLockTimeout;
    if (timeout <= 0) {
      return; // Auto-lock disabled
    }

    const checkInactivity = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const timeoutMs = timeout * 60 * 1000;

      if (elapsed >= timeoutMs) {
        setIsLocked(true);
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkInactivity, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [settings, isLockEnabled, isLocked]);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track various user interactions
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  // Handle visibility change (background/foreground)
  useEffect(() => {
    if (!settings || !isLockEnabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden && settings.lockOnBackground) {
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings, isLockEnabled]);

  const checkLockStatus = async () => {
    try {
      const enabled = await securityApi.isLockEnabled();
      setIsLockEnabled(enabled);

      if (enabled) {
        const loadedSettings = await securityApi.getSettings();
        setSettings(loadedSettings);
        // Lock immediately on app start if lock is enabled
        setIsLocked(true);
      } else {
        setSettings(DEFAULT_SETTINGS);
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Failed to check lock status:', error);
      setIsLockEnabled(false);
      setSettings(DEFAULT_SETTINGS);
      setIsLocked(false);
    }
  };

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const isValid = await securityApi.verifyPin(pin);
      if (isValid) {
        setIsLocked(false);
        lastActivityRef.current = Date.now();
      }
      return isValid;
    } catch (error) {
      console.error('Failed to verify PIN:', error);
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    if (isLockEnabled) {
      setIsLocked(true);
    }
  }, [isLockEnabled]);

  const refreshSettings = useCallback(async () => {
    await checkLockStatus();
  }, []);

  return {
    isLocked,
    isLockEnabled,
    settings,
    unlock,
    lock,
    refreshSettings,
  };
}
