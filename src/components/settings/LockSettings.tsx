import { useState, useEffect } from 'react';
import {
  Lock,
  Key,
  Clock,
  Shield,
  Fingerprint,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { securityApi } from '../../lib/tauri';
import { PinSetup } from '../lock/PinSetup';
import type { LockSettings as LockSettingsType } from '../../types';

interface LockSettingsProps {
  onSettingsChange?: () => void;
}

export function LockSettings({ onSettingsChange }: LockSettingsProps) {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [settings, setSettings] = useState<LockSettingsType | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState<'setup' | 'change' | 'remove' | null>(
    null
  );
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [enabled, loadedSettings, biometric] = await Promise.all([
        securityApi.isLockEnabled(),
        securityApi.getSettings(),
        securityApi.isBiometricAvailable(),
      ]);
      setIsLockEnabled(enabled);
      setSettings(loadedSettings);
      setIsBiometricAvailable(biometric);
    } catch (error) {
      console.error('Failed to load lock settings:', error);
      setMessage({ success: false, text: '설정을 불러오는데 실패했습니다' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSetupComplete = async () => {
    setShowPinSetup(null);
    await loadSettings();
    onSettingsChange?.();

    if (showPinSetup === 'setup') {
      setMessage({ success: true, text: 'PIN이 설정되었습니다' });
    } else if (showPinSetup === 'change') {
      setMessage({ success: true, text: 'PIN이 변경되었습니다' });
    } else if (showPinSetup === 'remove') {
      setMessage({ success: true, text: 'PIN이 삭제되었습니다' });
    }
  };

  const handleUpdateSettings = async (updates: Partial<LockSettingsType>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    try {
      await securityApi.updateSettings(newSettings);
      setSettings(newSettings);
      setMessage({ success: true, text: '설정이 저장되었습니다' });
      onSettingsChange?.();
    } catch (error) {
      setMessage({ success: false, text: '설정 저장에 실패했습니다' });
    }
  };

  const autoLockOptions = [
    { value: 0, label: '즉시' },
    { value: 1, label: '1분' },
    { value: 5, label: '5분' },
    { value: 15, label: '15분' },
    { value: 30, label: '30분' },
  ];

  if (isLoading) {
    return (
      <div className="glass-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">앱 잠금</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PIN으로 앱을 보호합니다
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Lock Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Shield
                className={`w-5 h-5 ${
                  isLockEnabled
                    ? 'text-green-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">잠금 상태</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isLockEnabled
                    ? 'PIN 잠금이 활성화되어 있습니다'
                    : 'PIN 잠금이 비활성화되어 있습니다'}
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isLockEnabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {isLockEnabled ? '활성화' : '비활성화'}
            </div>
          </div>

          {/* PIN Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isLockEnabled ? (
              <button
                onClick={() => setShowPinSetup('setup')}
                className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                <Key className="w-4 h-4" />
                PIN 설정
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowPinSetup('change')}
                  className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  PIN 변경
                </button>
                <button
                  onClick={() => setShowPinSetup('remove')}
                  className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl bg-red-100 text-red-600 font-medium hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  PIN 삭제
                </button>
              </>
            )}
          </div>

          {/* Settings (only show when lock is enabled) */}
          {isLockEnabled && settings && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Auto Lock Timeout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      자동 잠금
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      비활동 시 자동으로 잠금
                    </p>
                  </div>
                </div>
                <select
                  value={settings.autoLockTimeout}
                  onChange={(e) =>
                    handleUpdateSettings({ autoLockTimeout: Number(e.target.value) })
                  }
                  className="input py-2 px-3 w-full sm:w-32"
                >
                  {autoLockOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lock on Background */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      백그라운드 잠금
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      앱이 백그라운드로 전환될 때 잠금
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.lockOnBackground}
                    onChange={(e) =>
                      handleUpdateSettings({ lockOnBackground: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* Biometric (if available) */}
              {isBiometricAvailable && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        생체인증
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Face ID / Touch ID로 잠금 해제
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.useBiometric}
                      onChange={(e) =>
                        handleUpdateSettings({ useBiometric: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                message.success
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {message.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <PinSetup
          mode={showPinSetup}
          onComplete={handlePinSetupComplete}
          onCancel={() => setShowPinSetup(null)}
        />
      )}
    </>
  );
}
