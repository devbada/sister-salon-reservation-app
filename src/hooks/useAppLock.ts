import { useState, useEffect, useCallback, useRef } from 'react';
import { securityApi } from '../lib/tauri';
import type { LockSettings } from '../types';

export type BiometricType = 'face_id' | 'touch_id' | 'none';

interface UseAppLockReturn {
  isLocked: boolean;
  isInitializing: boolean;
  isLockEnabled: boolean;
  settings: LockSettings | null;
  isBiometricAvailable: boolean;
  biometricType: BiometricType;
  unlock: (pin: string) => Promise<boolean>;
  unlockBiometric: () => Promise<boolean>;
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
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const lastActivityRef = useRef<number>(Date.now());

  // Load initial state — lock the app on startup if enabled
  useEffect(() => {
    loadLockStatus(true);
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

  /**
   * Load lock status from backend.
   * @param shouldLock If true, lock the app when lock is enabled (used on startup).
   *                   If false, only refresh settings/enabled state without locking (used after settings change).
   */
  const loadLockStatus = async (shouldLock: boolean) => {
    try {
      const [enabled, biometricAvailable, bioType] = await Promise.all([
        securityApi.isLockEnabled(),
        securityApi.isBiometricAvailable().catch(() => false),
        securityApi.getBiometricType().catch(() => 'none' as const),
      ]);
      setIsLockEnabled(enabled);
      setIsBiometricAvailable(biometricAvailable);
      setBiometricType(bioType as BiometricType);

      if (enabled) {
        const loadedSettings = await securityApi.getSettings();
        setSettings(loadedSettings);
        if (shouldLock) {
          setIsLocked(true);
        }
      } else {
        setSettings(DEFAULT_SETTINGS);
        if (shouldLock) {
          setIsLocked(false);
        }
      }
    } catch (error) {
      console.error('Failed to check lock status:', error);
      setIsLockEnabled(false);
      setIsBiometricAvailable(false);
      setBiometricType('none');
      setSettings(DEFAULT_SETTINGS);
      setIsLocked(false);
    } finally {
      setIsInitializing(false);
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

  const unlockBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const success = await securityApi.authenticateBiometric();
      if (success) {
        setIsLocked(false);
        lastActivityRef.current = Date.now();
      }
      return success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    if (isLockEnabled) {
      setIsLocked(true);
    }
  }, [isLockEnabled]);

  // Refresh settings WITHOUT locking the app (called from Settings page)
  const refreshSettings = useCallback(async () => {
    await loadLockStatus(false);
  }, []);

  return {
    isLocked,
    isInitializing,
    isLockEnabled,
    settings,
    isBiometricAvailable,
    biometricType,
    unlock,
    unlockBiometric,
    lock,
    refreshSettings,
  };
}
