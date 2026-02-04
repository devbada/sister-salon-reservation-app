import { useState, useCallback, useEffect, useRef } from 'react';
import { Delete, AlertCircle, Fingerprint, ScanFace } from 'lucide-react';
import type { BiometricType } from '../../hooks/useAppLock';

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
  onBiometricUnlock?: () => Promise<boolean>;
  biometricType?: BiometricType;
}

// Brute force protection: 5 fails = 30s, 6+ fails = 5min
const LOCKOUT_THRESHOLD = 5;
const SHORT_LOCKOUT_MS = 30_000;
const LONG_LOCKOUT_MS = 5 * 60_000;

export function LockScreen({ onUnlock, onBiometricUnlock, biometricType = 'none' }: LockScreenProps) {
  const isFaceId = biometricType === 'face_id';
  const biometricLabel = isFaceId ? 'Face ID' : '지문 인식';
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const biometricBusyRef = useRef(false);

  // silent=true: auto-trigger (no error on failure), silent=false: manual tap (show error)
  const handleBiometricUnlock = useCallback(async (silent = false) => {
    if (!onBiometricUnlock || biometricBusyRef.current) return;
    biometricBusyRef.current = true;
    setIsVerifying(true);
    setError(null);
    try {
      const success = await onBiometricUnlock();
      if (!success && !silent) {
        setError(`${biometricLabel} 인증에 실패했습니다. PIN을 입력해주세요.`);
      }
    } catch {
      if (!silent) {
        setError(`${biometricLabel} 인증에 실패했습니다. PIN을 입력해주세요.`);
      }
    } finally {
      biometricBusyRef.current = false;
      setIsVerifying(false);
    }
  }, [onBiometricUnlock, biometricLabel]);

  // Auto-trigger biometric: on mount + foreground return (always silent)
  // When the app goes to background, useAppLock locks it and LockScreen mounts
  // while document.hidden is still true. iOS suspends JS timers in background,
  // so setTimeout naturally fires when the app returns to foreground.
  //
  // TODO: 다른 앱 갔다가 돌아올 때 생체인증 자동 실행이 안 됨
  // - visibilitychange / focus 이벤트가 iOS Tauri WebView에서 안정적으로 발생하지 않는 것으로 추정
  // - Tauri 네이티브 앱 라이프사이클 이벤트 사용 검토 필요
  //   (예: Swift applicationWillEnterForeground → WebView JS 호출, 또는 tauri-plugin-process)
  // - 또는 Rust 쪽에서 앱 포그라운드 복귀 시 프론트엔드로 이벤트 emit 하는 방식
  useEffect(() => {
    if (!onBiometricUnlock) return;

    const tryBiometricSilently = () => {
      if (biometricBusyRef.current) return;
      biometricBusyRef.current = true;
      onBiometricUnlock()
        .then(() => {})
        .catch(() => {})
        .finally(() => { biometricBusyRef.current = false; });
    };

    // On mount: delay ensures the app is in foreground before prompting.
    // On iOS, this timer is suspended while in background and fires on return.
    const mountTimer = setTimeout(tryBiometricSilently, 500);

    // Fallback listeners for foreground return
    const handleForeground = () => {
      setTimeout(tryBiometricSilently, 300);
    };
    const handleVisibility = () => {
      if (!document.hidden) handleForeground();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleForeground);

    return () => {
      clearTimeout(mountTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleForeground);
    };
  }, [onBiometricUnlock]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutUntil === null) {
      setLockoutRemaining(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, lockoutUntil - Date.now());
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setError(null);
        if (lockoutTimerRef.current) {
          clearInterval(lockoutTimerRef.current);
          lockoutTimerRef.current = null;
        }
      }
    };

    tick();
    lockoutTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (lockoutTimerRef.current) {
        clearInterval(lockoutTimerRef.current);
        lockoutTimerRef.current = null;
      }
    };
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  const handleKeyPress = useCallback(
    (digit: string) => {
      if (isVerifying || isLockedOut) return;
      if (pin.length >= 6) return;

      setPin((prev) => prev + digit);
      setError(null);
    },
    [pin, isVerifying, isLockedOut]
  );

  const handleDelete = useCallback(() => {
    if (isVerifying || isLockedOut) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, [isVerifying, isLockedOut]);

  const handleSubmit = useCallback(async () => {
    if (pin.length < 4 || isVerifying || isLockedOut) return;

    setIsVerifying(true);
    setError(null);

    try {
      const success = await onUnlock(pin);
      if (!success) {
        const newFailCount = failedAttempts + 1;
        setFailedAttempts(newFailCount);

        if (newFailCount >= LOCKOUT_THRESHOLD) {
          const lockoutMs = newFailCount === LOCKOUT_THRESHOLD
            ? SHORT_LOCKOUT_MS
            : LONG_LOCKOUT_MS;
          setLockoutUntil(Date.now() + lockoutMs);
          const seconds = Math.ceil(lockoutMs / 1000);
          setError(`입력 횟수를 초과했습니다. ${seconds}초 후 다시 시도해주세요`);
        } else {
          setError('잘못된 PIN입니다');
        }

        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin('');
      } else {
        setFailedAttempts(0);
        setLockoutUntil(null);
      }
    } catch {
      setError('인증에 실패했습니다');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  }, [pin, onUnlock, isVerifying, isLockedOut, failedAttempts]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVerifying || isLockedOut) return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleDelete, handleSubmit, isVerifying, isLockedOut]);

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  const formatRemainingTime = (ms: number) => {
    const secs = Math.ceil(ms / 1000);
    if (secs >= 60) {
      const mins = Math.floor(secs / 60);
      const remainSecs = secs % 60;
      return `${mins}:${remainSecs.toString().padStart(2, '0')}`;
    }
    return `${secs}초`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '20px',
        paddingTop: 'max(env(safe-area-inset-top, 20px), 20px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(233,69,96,0.15) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 80% 80%, rgba(72,52,212,0.15) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <img
            src="/icon.png"
            alt="Sisters Salon"
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              boxShadow: '0 8px 32px rgba(233, 69, 96, 0.3)',
            }}
            onError={(e) => {
              // Fallback if icon is missing — show gradient box
              const el = e.currentTarget;
              el.style.display = 'none';
              const fallback = el.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div
            style={{
              display: 'none',
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #e94560 0%, #8b5cf6 100%)',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(233, 69, 96, 0.3)',
              color: 'white',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: 'white',
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            언니들의 미용실
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            PIN을 입력해 주세요
          </p>
        </div>

        {/* PIN Dots */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '16px 0',
            animation: shake ? 'lockShake 0.5s ease-in-out' : undefined,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: i < pin.length ? '#e94560' : 'rgba(255,255,255,0.15)',
                border: `2px solid ${i < pin.length ? '#e94560' : 'rgba(255,255,255,0.3)'}`,
                transition: 'all 0.2s ease',
                transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
                boxShadow: i < pin.length ? '0 0 12px rgba(233,69,96,0.5)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Error / Lockout */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              color: '#fca5a5',
              fontSize: 13,
            }}
          >
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>
              {isLockedOut
                ? `${formatRemainingTime(lockoutRemaining)} 후 다시 시도해주세요`
                : error}
            </span>
          </div>
        )}

        {/* Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            width: '100%',
            maxWidth: 280,
          }}
        >
          {keypadNumbers.map((row, rowIndex) =>
            row.map((key, colIndex) => {
              if (key === '') {
                return <div key={`${rowIndex}-${colIndex}`} style={{ height: 64 }} />;
              }
              if (key === 'del') {
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={handleDelete}
                    disabled={isVerifying || isLockedOut || pin.length === 0}
                    style={{
                      height: 64,
                      borderRadius: 16,
                      border: 'none',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: isVerifying || isLockedOut || pin.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isVerifying || isLockedOut || pin.length === 0 ? 0.4 : 1,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Delete style={{ width: 22, height: 22 }} />
                  </button>
                );
              }
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleKeyPress(key)}
                  disabled={isVerifying || isLockedOut || pin.length >= 6}
                  style={{
                    height: 64,
                    borderRadius: 16,
                    border: 'none',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 500,
                    cursor: isVerifying || isLockedOut || pin.length >= 6 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isVerifying || isLockedOut || pin.length >= 6 ? 0.4 : 1,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {key}
                </button>
              );
            })
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={pin.length < 4 || isVerifying || isLockedOut}
          style={{
            width: '100%',
            maxWidth: 280,
            padding: '16px 24px',
            borderRadius: 16,
            border: 'none',
            background:
              pin.length < 4 || isVerifying || isLockedOut
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #e94560 0%, #8b5cf6 100%)',
            color:
              pin.length < 4 || isVerifying || isLockedOut
                ? 'rgba(255,255,255,0.4)'
                : 'white',
            fontSize: 16,
            fontWeight: 600,
            cursor: pin.length < 4 || isVerifying || isLockedOut ? 'not-allowed' : 'pointer',
            boxShadow:
              pin.length < 4 || isVerifying || isLockedOut
                ? 'none'
                : '0 4px 24px rgba(233,69,96,0.3)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isVerifying ? '확인 중...' : '잠금 해제'}
        </button>

        {/* Biometric unlock button (Android: fingerprint, iOS: Face ID) */}
        {onBiometricUnlock && (
          <button
            onClick={() => handleBiometricUnlock(false)}
            disabled={isVerifying}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: isVerifying ? 'not-allowed' : 'pointer',
              opacity: isVerifying ? 0.4 : 1,
              padding: '12px 24px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isFaceId ? (
              <ScanFace style={{ width: 32, height: 32 }} />
            ) : (
              <Fingerprint style={{ width: 32, height: 32 }} />
            )}
            <span style={{ fontSize: 13 }}>
              {isFaceId ? 'Face ID로 잠금 해제' : '지문으로 잠금 해제'}
            </span>
          </button>
        )}
      </div>

      {/* Minimal keyframe for shake animation */}
      <style>{`
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
