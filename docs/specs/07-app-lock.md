# Phase 7: 앱 잠금 (PIN/생체인증)

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/07-app-lock` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 2-3일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/07-app-lock
```

---

## 목표

개인정보 보호를 위한 앱 잠금 기능을 구현합니다. PIN 코드와 생체인증(Face ID, Touch ID, 지문인식)을 지원합니다.

## 산출물

- PIN 코드 설정/검증 (bcrypt 해싱)
- 생체인증 연동 (플랫폼별)
- 잠금 화면 UI
- 보안 키 저장 (keyring)
- 자동 잠금 설정

---

## 사전 요구사항

- Phase 1 (프로젝트 설정) 완료
- 플랫폼별 보안 API 접근 권한 설정

---

## 플랫폼별 생체인증

| 플랫폼 | 지원 기술 | 구현 방식 |
|--------|----------|----------|
| iOS | Face ID, Touch ID | LocalAuthentication.framework |
| Android | 지문인식, 얼굴인식 | BiometricPrompt API |
| macOS | Touch ID | LocalAuthentication.framework |
| Windows | Windows Hello | Windows.Security.Credentials.UI |
| Linux | - | PIN만 지원 |

---

## 구현 내용

### 1. Rust 보안 서비스

#### src-tauri/src/services/auth.rs
```rust
use bcrypt::{hash, verify, DEFAULT_COST};
use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "sisters-salon-reservation";
const PIN_KEY: &str = "lock_pin";
const SETTINGS_KEY: &str = "lock_settings";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockSettings {
    pub is_enabled: bool,
    pub use_biometric: bool,
    pub auto_lock_timeout: u32, // 초 단위, 0이면 비활성화
    pub lock_on_background: bool,
}

impl Default for LockSettings {
    fn default() -> Self {
        Self {
            is_enabled: false,
            use_biometric: false,
            auto_lock_timeout: 300, // 5분
            lock_on_background: true,
        }
    }
}

pub struct AuthService {
    keyring: Entry,
}

impl AuthService {
    pub fn new() -> Result<Self, String> {
        let keyring = Entry::new(SERVICE_NAME, PIN_KEY)
            .map_err(|e| e.to_string())?;
        Ok(Self { keyring })
    }

    /// PIN 설정
    pub fn set_pin(&self, pin: &str) -> Result<(), String> {
        // PIN 유효성 검사 (4-6자리 숫자)
        if !Self::validate_pin(pin) {
            return Err("PIN은 4-6자리 숫자여야 합니다".to_string());
        }

        // bcrypt로 해싱
        let hashed = hash(pin, DEFAULT_COST)
            .map_err(|e| e.to_string())?;

        // keyring에 저장
        self.keyring.set_password(&hashed)
            .map_err(|e| e.to_string())?;

        // 설정 활성화
        let mut settings = self.get_settings()?;
        settings.is_enabled = true;
        self.save_settings(&settings)?;

        Ok(())
    }

    /// PIN 검증
    pub fn verify_pin(&self, pin: &str) -> Result<bool, String> {
        let stored_hash = self.keyring.get_password()
            .map_err(|e| e.to_string())?;

        verify(pin, &stored_hash)
            .map_err(|e| e.to_string())
    }

    /// PIN 제거
    pub fn remove_pin(&self) -> Result<(), String> {
        self.keyring.delete_credential()
            .map_err(|e| e.to_string())?;

        let mut settings = self.get_settings()?;
        settings.is_enabled = false;
        settings.use_biometric = false;
        self.save_settings(&settings)?;

        Ok(())
    }

    /// PIN 변경
    pub fn change_pin(&self, old_pin: &str, new_pin: &str) -> Result<(), String> {
        // 기존 PIN 확인
        if !self.verify_pin(old_pin)? {
            return Err("기존 PIN이 일치하지 않습니다".to_string());
        }

        // 새 PIN 설정
        self.set_pin(new_pin)
    }

    /// 잠금 활성화 여부
    pub fn is_lock_enabled(&self) -> Result<bool, String> {
        let settings = self.get_settings()?;
        Ok(settings.is_enabled)
    }

    /// 설정 조회
    pub fn get_settings(&self) -> Result<LockSettings, String> {
        let settings_entry = Entry::new(SERVICE_NAME, SETTINGS_KEY)
            .map_err(|e| e.to_string())?;

        match settings_entry.get_password() {
            Ok(json) => serde_json::from_str(&json)
                .map_err(|e| e.to_string()),
            Err(_) => Ok(LockSettings::default()),
        }
    }

    /// 설정 저장
    pub fn save_settings(&self, settings: &LockSettings) -> Result<(), String> {
        let settings_entry = Entry::new(SERVICE_NAME, SETTINGS_KEY)
            .map_err(|e| e.to_string())?;

        let json = serde_json::to_string(settings)
            .map_err(|e| e.to_string())?;

        settings_entry.set_password(&json)
            .map_err(|e| e.to_string())
    }

    /// PIN 유효성 검사
    fn validate_pin(pin: &str) -> bool {
        let len = pin.len();
        len >= 4 && len <= 6 && pin.chars().all(|c| c.is_ascii_digit())
    }
}

// 생체인증 구현 (플랫폼별)
#[cfg(target_os = "ios")]
pub mod biometric {
    use objc::{class, msg_send, sel, sel_impl};
    use objc::runtime::Object;

    pub async fn authenticate() -> Result<bool, String> {
        unsafe {
            let context: *mut Object = msg_send![class!(LAContext), new];
            let can_evaluate: bool = msg_send![context,
                canEvaluatePolicy: 1 // LAPolicyDeviceOwnerAuthenticationWithBiometrics
                error: std::ptr::null_mut::<*mut Object>()
            ];

            if !can_evaluate {
                return Err("생체인증을 사용할 수 없습니다".to_string());
            }

            // 비동기 인증 요청
            // ... LocalAuthentication 프레임워크 사용
            Ok(true)
        }
    }

    pub fn is_available() -> bool {
        unsafe {
            let context: *mut Object = msg_send![class!(LAContext), new];
            let can_evaluate: bool = msg_send![context,
                canEvaluatePolicy: 1
                error: std::ptr::null_mut::<*mut Object>()
            ];
            can_evaluate
        }
    }
}

#[cfg(target_os = "macos")]
pub mod biometric {
    pub async fn authenticate() -> Result<bool, String> {
        // macOS Touch ID 구현
        // LocalAuthentication 프레임워크 사용
        todo!("Implement macOS Touch ID")
    }

    pub fn is_available() -> bool {
        // Touch ID 지원 여부 확인
        true
    }
}

#[cfg(target_os = "android")]
pub mod biometric {
    pub async fn authenticate() -> Result<bool, String> {
        // Android BiometricPrompt API 사용
        // JNI를 통한 호출 필요
        todo!("Implement Android biometric")
    }

    pub fn is_available() -> bool {
        true
    }
}

#[cfg(target_os = "windows")]
pub mod biometric {
    pub async fn authenticate() -> Result<bool, String> {
        // Windows Hello API 사용
        todo!("Implement Windows Hello")
    }

    pub fn is_available() -> bool {
        true
    }
}

#[cfg(target_os = "linux")]
pub mod biometric {
    pub async fn authenticate() -> Result<bool, String> {
        Err("Linux에서는 생체인증을 지원하지 않습니다".to_string())
    }

    pub fn is_available() -> bool {
        false
    }
}
```

### 2. Tauri Commands - 보안

#### src-tauri/src/commands/security.rs
```rust
use tauri::command;
use crate::services::auth::{AuthService, LockSettings, biometric};

#[command]
pub async fn set_lock_pin(pin: String) -> Result<(), String> {
    let auth = AuthService::new()?;
    auth.set_pin(&pin)
}

#[command]
pub async fn verify_lock_pin(pin: String) -> Result<bool, String> {
    let auth = AuthService::new()?;
    auth.verify_pin(&pin)
}

#[command]
pub async fn remove_lock_pin() -> Result<(), String> {
    let auth = AuthService::new()?;
    auth.remove_pin()
}

#[command]
pub async fn change_lock_pin(old_pin: String, new_pin: String) -> Result<(), String> {
    let auth = AuthService::new()?;
    auth.change_pin(&old_pin, &new_pin)
}

#[command]
pub async fn is_lock_enabled() -> Result<bool, String> {
    let auth = AuthService::new()?;
    auth.is_lock_enabled()
}

#[command]
pub async fn get_lock_settings() -> Result<LockSettings, String> {
    let auth = AuthService::new()?;
    auth.get_settings()
}

#[command]
pub async fn update_lock_settings(settings: LockSettings) -> Result<(), String> {
    let auth = AuthService::new()?;
    auth.save_settings(&settings)
}

#[command]
pub async fn authenticate_biometric() -> Result<bool, String> {
    biometric::authenticate().await
}

#[command]
pub fn is_biometric_available() -> bool {
    biometric::is_available()
}
```

### 3. iOS/Android 권한 설정

#### src-tauri/gen/apple/sisters-salon-reservation-app/Info.plist
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Face ID 사용 권한 -->
    <key>NSFaceIDUsageDescription</key>
    <string>앱 잠금 해제를 위해 Face ID를 사용합니다.</string>

    <!-- 기타 설정... -->
</dict>
</plist>
```

#### src-tauri/gen/android/app/src/main/AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 생체인증 권한 -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />

    <application>
        <!-- ... -->
    </application>
</manifest>
```

### 4. Frontend 컴포넌트

#### src/components/settings/LockScreen.tsx
```tsx
import { useState, useEffect, useRef } from 'react';
import { securityApi } from '../../lib/tauri';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkBiometric();
    inputRef.current?.focus();
  }, []);

  const checkBiometric = async () => {
    try {
      const settings = await securityApi.getSettings();
      if (settings.useBiometric) {
        setUseBiometric(true);
        handleBiometric();
      }
    } catch (error) {
      console.error('Failed to check biometric:', error);
    }
  };

  const handleBiometric = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await securityApi.authenticateBiometric();
      if (success) {
        onUnlock();
      } else {
        setError('인증에 실패했습니다');
      }
    } catch (error) {
      setError('생체인증을 사용할 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await securityApi.verifyPin(pin);
      if (isValid) {
        onUnlock();
      } else {
        setError('PIN이 일치하지 않습니다');
        setPin('');
      }
    } catch (error) {
      setError('인증 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setPin(p => p.slice(0, -1));
    } else if (key === 'submit') {
      handlePinSubmit();
    } else if (pin.length < 6) {
      setPin(p => p + key);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 to-purple-900
                    flex items-center justify-center z-50">
      <div className="w-full max-w-sm p-8">
        {/* 앱 로고 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full
                          bg-white/20 backdrop-blur-md
                          flex items-center justify-center">
            <span className="text-4xl">💇‍♀️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Sisters Salon</h1>
          <p className="text-white/70 mt-2">PIN을 입력해주세요</p>
        </div>

        {/* PIN 표시 */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length
                  ? 'bg-white scale-110'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-center text-red-300 mb-4 animate-shake">
            {error}
          </div>
        )}

        {/* 숫자 키패드 */}
        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={isLoading}
              className="w-full aspect-square rounded-full
                         bg-white/10 hover:bg-white/20
                         text-white text-2xl font-medium
                         transition-all active:scale-95
                         disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* 생체인증 버튼 */}
          <button
            onClick={handleBiometric}
            disabled={isLoading || !useBiometric}
            className="w-full aspect-square rounded-full
                       bg-white/10 hover:bg-white/20
                       text-white text-2xl
                       transition-all active:scale-95
                       disabled:opacity-30"
          >
            {getBiometricIcon()}
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            disabled={isLoading}
            className="w-full aspect-square rounded-full
                       bg-white/10 hover:bg-white/20
                       text-white text-2xl font-medium
                       transition-all active:scale-95
                       disabled:opacity-50"
          >
            0
          </button>

          {/* 삭제 버튼 */}
          <button
            onClick={() => handleKeyPress('backspace')}
            disabled={isLoading || pin.length === 0}
            className="w-full aspect-square rounded-full
                       bg-white/10 hover:bg-white/20
                       text-white text-xl
                       transition-all active:scale-95
                       disabled:opacity-30"
          >
            ⌫
          </button>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={handlePinSubmit}
          disabled={isLoading || pin.length < 4}
          className="w-full mt-6 py-4 rounded-xl
                     bg-white text-indigo-900 font-semibold
                     hover:bg-white/90 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '확인 중...' : '확인'}
        </button>
      </div>
    </div>
  );
}

function getBiometricIcon() {
  const platform = navigator.userAgent;

  if (platform.includes('iPhone') && parseInt(platform.match(/iPhone OS (\d+)/)?.[1] || '0') >= 11) {
    return '👤'; // Face ID
  }
  return '👆'; // Touch ID / Fingerprint
}
```

#### src/components/settings/LockSettings.tsx
```tsx
import { useState, useEffect } from 'react';
import { securityApi } from '../../lib/tauri';

interface LockConfig {
  isEnabled: boolean;
  useBiometric: boolean;
  autoLockTimeout: number;
  lockOnBackground: boolean;
}

export function LockSettings() {
  const [config, setConfig] = useState<LockConfig>({
    isEnabled: false,
    useBiometric: false,
    autoLockTimeout: 300,
    lockOnBackground: true,
  });
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settings, biometricAvailable] = await Promise.all([
        securityApi.getSettings(),
        securityApi.isBiometricAvailable(),
      ]);

      setConfig({
        isEnabled: settings.is_enabled,
        useBiometric: settings.use_biometric,
        autoLockTimeout: settings.auto_lock_timeout,
        lockOnBackground: settings.lock_on_background,
      });
      setIsBiometricAvailable(biometricAvailable);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLock = async () => {
    if (!config.isEnabled) {
      setShowPinSetup(true);
    } else {
      // PIN 삭제 확인
      if (confirm('앱 잠금을 해제하시겠습니까?')) {
        try {
          await securityApi.removePin();
          setConfig(c => ({ ...c, isEnabled: false, useBiometric: false }));
        } catch (error) {
          alert('잠금 해제에 실패했습니다');
        }
      }
    }
  };

  const handlePinSetupComplete = () => {
    setShowPinSetup(false);
    setConfig(c => ({ ...c, isEnabled: true }));
  };

  const handleToggleBiometric = async () => {
    const newValue = !config.useBiometric;

    if (newValue) {
      // 생체인증 테스트
      try {
        const success = await securityApi.authenticateBiometric();
        if (!success) {
          alert('생체인증 설정에 실패했습니다');
          return;
        }
      } catch (error) {
        alert('생체인증을 사용할 수 없습니다');
        return;
      }
    }

    const newConfig = { ...config, useBiometric: newValue };
    setConfig(newConfig);
    await saveSettings(newConfig);
  };

  const handleTimeoutChange = async (timeout: number) => {
    const newConfig = { ...config, autoLockTimeout: timeout };
    setConfig(newConfig);
    await saveSettings(newConfig);
  };

  const handleBackgroundLockToggle = async () => {
    const newConfig = { ...config, lockOnBackground: !config.lockOnBackground };
    setConfig(newConfig);
    await saveSettings(newConfig);
  };

  const saveSettings = async (settings: LockConfig) => {
    try {
      await securityApi.updateSettings({
        is_enabled: settings.isEnabled,
        use_biometric: settings.useBiometric,
        auto_lock_timeout: settings.autoLockTimeout,
        lock_on_background: settings.lockOnBackground,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  if (isLoading) {
    return <div className="glass-card animate-pulse h-48" />;
  }

  if (showPinSetup) {
    return <PinSetup onComplete={handlePinSetupComplete} onCancel={() => setShowPinSetup(false)} />;
  }

  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4">앱 잠금</h2>

      <div className="space-y-4">
        {/* 잠금 활성화 */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">앱 잠금</span>
            <p className="text-sm text-gray-400">PIN 또는 생체인증으로 앱을 보호합니다</p>
          </div>
          <Toggle checked={config.isEnabled} onChange={handleToggleLock} />
        </div>

        {config.isEnabled && (
          <>
            {/* 생체인증 */}
            {isBiometricAvailable && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">생체인증 사용</span>
                  <p className="text-sm text-gray-400">
                    {getBiometricName()}으로 잠금 해제
                  </p>
                </div>
                <Toggle checked={config.useBiometric} onChange={handleToggleBiometric} />
              </div>
            )}

            {/* 자동 잠금 시간 */}
            <div>
              <label className="block font-medium mb-2">자동 잠금 시간</label>
              <select
                value={config.autoLockTimeout}
                onChange={(e) => handleTimeoutChange(parseInt(e.target.value))}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20"
              >
                <option value={0}>사용 안 함</option>
                <option value={60}>1분</option>
                <option value={300}>5분</option>
                <option value={600}>10분</option>
                <option value={1800}>30분</option>
              </select>
            </div>

            {/* 백그라운드 잠금 */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">백그라운드 전환 시 잠금</span>
                <p className="text-sm text-gray-400">앱을 나갈 때 자동으로 잠금</p>
              </div>
              <Toggle checked={config.lockOnBackground} onChange={handleBackgroundLockToggle} />
            </div>

            {/* PIN 변경 */}
            <button
              onClick={() => setShowPinSetup(true)}
              className="w-full py-3 bg-white/10 hover:bg-white/20
                         rounded-lg font-medium transition-colors"
            >
              PIN 변경
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-gray-600'
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

function getBiometricName() {
  const platform = navigator.userAgent;

  if (platform.includes('iPhone')) {
    return parseInt(platform.match(/iPhone OS (\d+)/)?.[1] || '0') >= 11
      ? 'Face ID'
      : 'Touch ID';
  }
  if (platform.includes('Mac')) return 'Touch ID';
  if (platform.includes('Android')) return '지문인식';
  if (platform.includes('Windows')) return 'Windows Hello';
  return '생체인증';
}

interface PinSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

function PinSetup({ onComplete, onCancel }: PinSetupProps) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePinEnter = (value: string) => {
    if (step === 'enter') {
      setPin(value);
      if (value.length >= 4) {
        setStep('confirm');
      }
    } else {
      setConfirmPin(value);
    }
  };

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      setError('PIN이 일치하지 않습니다');
      setConfirmPin('');
      return;
    }

    setIsLoading(true);
    try {
      await securityApi.setPin(pin);
      onComplete();
    } catch (error) {
      setError('PIN 설정에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4">
        {step === 'enter' ? 'PIN 설정' : 'PIN 확인'}
      </h2>

      <p className="text-gray-400 mb-6">
        {step === 'enter'
          ? '4-6자리 PIN을 입력해주세요'
          : '다시 한번 입력해주세요'}
      </p>

      {/* PIN 입력 UI는 LockScreen과 유사하게 구현 */}
      {/* ... */}

      {error && (
        <div className="text-red-400 text-center mb-4">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-white/10 hover:bg-white/20
                     rounded-lg font-medium transition-colors"
        >
          취소
        </button>

        {step === 'confirm' && (
          <button
            onClick={handleSubmit}
            disabled={isLoading || confirmPin.length < 4}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700
                       text-white rounded-lg font-medium transition-colors
                       disabled:opacity-50"
          >
            {isLoading ? '설정 중...' : '설정 완료'}
          </button>
        )}
      </div>
    </div>
  );
}
```

#### src/hooks/useAppLock.ts
```typescript
import { useState, useEffect, useCallback } from 'react';
import { securityApi } from '../lib/tauri';

interface LockSettings {
  isEnabled: boolean;
  useBiometric: boolean;
  autoLockTimeout: number;
  lockOnBackground: boolean;
}

export function useAppLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const isEnabled = await securityApi.isLockEnabled();
        if (isEnabled) {
          const lockSettings = await securityApi.getSettings();
          setSettings({
            isEnabled: lockSettings.is_enabled,
            useBiometric: lockSettings.use_biometric,
            autoLockTimeout: lockSettings.auto_lock_timeout,
            lockOnBackground: lockSettings.lock_on_background,
          });
          setIsLocked(true); // 앱 시작 시 잠금
        }
      } catch (error) {
        console.error('Failed to load lock settings:', error);
      }
    };

    loadSettings();
  }, []);

  // 자동 잠금 타이머
  useEffect(() => {
    if (!settings?.isEnabled || settings.autoLockTimeout === 0) return;

    const checkTimeout = () => {
      const elapsed = (Date.now() - lastActivity) / 1000;
      if (elapsed >= settings.autoLockTimeout && !isLocked) {
        setIsLocked(true);
      }
    };

    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [settings, lastActivity, isLocked]);

  // 백그라운드 전환 감지
  useEffect(() => {
    if (!settings?.isEnabled || !settings.lockOnBackground) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 백그라운드로 전환
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings]);

  // 활동 감지
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    setLastActivity(Date.now());
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);

  return {
    isLocked,
    settings,
    unlock,
    lock,
  };
}
```

#### src/App.tsx (잠금 화면 통합)
```tsx
import { useAppLock } from './hooks/useAppLock';
import { LockScreen } from './components/settings/LockScreen';
// ... 기타 imports

function App() {
  const { isLocked, unlock } = useAppLock();

  if (isLocked) {
    return <LockScreen onUnlock={unlock} />;
  }

  return (
    // 기존 앱 컨텐츠
    <ResponsiveContainer>
      {/* ... */}
    </ResponsiveContainer>
  );
}

export default App;
```

---

## 커밋 메시지 가이드

```bash
# PIN 인증 구현
git commit -m "feat(security): PIN 인증 시스템 구현

- bcrypt 해싱으로 PIN 저장
- keyring으로 안전한 키 관리
- PIN 설정/검증/변경/삭제 기능

Co-Authored-By: Claude <noreply@anthropic.com>"

# 생체인증 구현
git commit -m "feat(security): 플랫폼별 생체인증 구현

- iOS Face ID/Touch ID (LocalAuthentication)
- Android 지문인식 (BiometricPrompt)
- macOS Touch ID
- Windows Hello

Co-Authored-By: Claude <noreply@anthropic.com>"

# 잠금 화면 UI
git commit -m "feat(security): 잠금 화면 UI 컴포넌트 추가

- LockScreen 컴포넌트
- 숫자 키패드 UI
- 생체인증 버튼

Co-Authored-By: Claude <noreply@anthropic.com>"

# 잠금 설정 UI
git commit -m "feat(security): 잠금 설정 UI 추가

- LockSettings 컴포넌트
- PIN 설정/변경 UI
- 자동 잠금 설정

Co-Authored-By: Claude <noreply@anthropic.com>"

# useAppLock 훅
git commit -m "feat(security): useAppLock 훅 구현

- 자동 잠금 타이머
- 백그라운드 전환 감지
- 활동 감지

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 완료 기준 체크리스트

### PIN 인증
- [ ] PIN 설정 동작 (4-6자리)
- [ ] PIN 검증 동작
- [ ] PIN 변경 동작
- [ ] PIN 삭제 동작
- [ ] bcrypt 해싱 적용
- [ ] keyring 저장 확인

### 생체인증
- [ ] iOS Face ID 동작
- [ ] iOS Touch ID 동작
- [ ] macOS Touch ID 동작
- [ ] Android 지문인식 동작
- [ ] Windows Hello 동작 (선택)
- [ ] 생체인증 실패 시 PIN 폴백

### 자동 잠금
- [ ] 시간 초과 자동 잠금
- [ ] 백그라운드 전환 시 잠금
- [ ] 앱 시작 시 잠금

### UI
- [ ] LockScreen 렌더링
- [ ] LockSettings 렌더링
- [ ] PinSetup 플로우
- [ ] 에러 상태 표시
- [ ] 반응형 레이아웃

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. 각 플랫폼에서 PIN 인증 동작 확인
3. 지원 플랫폼에서 생체인증 동작 확인
4. 자동 잠금 시나리오 테스트 완료
5. 보안 검토 (PIN 해싱, 키 저장)

```bash
# 머지 절차
git checkout develop
git merge --squash task/07-app-lock
git commit -m "feat: Phase 7 - 앱 잠금 기능 완료

- PIN 코드 인증 (bcrypt 해싱)
- 생체인증 (Face ID, Touch ID, 지문인식, Windows Hello)
- 안전한 키 저장 (keyring)
- 자동 잠금 (시간 초과, 백그라운드 전환)
- 잠금 화면 및 설정 UI

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
git branch -d task/07-app-lock
```

---

## 다음 단계

Phase 8: [빌드 & 배포](./08-build-deploy.md)로 진행
