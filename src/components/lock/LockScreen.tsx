import { useState, useCallback, useEffect } from 'react';
import { Delete, AlertCircle } from 'lucide-react';

interface LockScreenProps {
  onUnlock: (pin: string) => Promise<boolean>;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  const handleKeyPress = useCallback(
    async (digit: string) => {
      if (isVerifying) return;
      if (pin.length >= 6) return;

      const newPin = pin + digit;
      setPin(newPin);
      setError(null);
    },
    [pin, isVerifying]
  );

  const handleDelete = useCallback(() => {
    if (isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, [isVerifying]);

  const handleSubmit = useCallback(async () => {
    if (pin.length < 4 || isVerifying) return;

    setIsVerifying(true);
    setError(null);

    try {
      const success = await onUnlock(pin);
      if (!success) {
        setError('잘못된 PIN입니다');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin('');
      }
    } catch (error) {
      setError('인증에 실패했습니다');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  }, [pin, onUnlock, isVerifying]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVerifying) return;

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
  }, [handleKeyPress, handleDelete, handleSubmit, isVerifying]);

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <div className="lock-screen">
      {/* Background decoration */}
      <div className="lock-bg-decoration" />

      <div className="lock-container">
        {/* Logo */}
        <div className="lock-logo">
          <img src="/icon.png" alt="Sisters Salon" className="lock-logo-icon" />
          <h1>Sisters Salon</h1>
          <p>PIN을 입력해 주세요</p>
        </div>

        {/* PIN Dots */}
        <div className={`lock-dots ${shake ? 'shake' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`lock-dot ${i < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="lock-error">
            <AlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="lock-keypad">
          {keypadNumbers.map((row, rowIndex) =>
            row.map((key, colIndex) => {
              if (key === '') {
                return <div key={`${rowIndex}-${colIndex}`} className="lock-key-empty" />;
              }
              if (key === 'del') {
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={handleDelete}
                    disabled={isVerifying || pin.length === 0}
                    className="lock-key lock-key-action"
                  >
                    <Delete />
                  </button>
                );
              }
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleKeyPress(key)}
                  disabled={isVerifying || pin.length >= 6}
                  className="lock-key"
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
          disabled={pin.length < 4 || isVerifying}
          className="lock-submit"
        >
          {isVerifying ? '확인 중...' : '잠금 해제'}
        </button>
      </div>

      <style>{`
        .lock-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 20px;
          padding-top: max(env(safe-area-inset-top, 20px), 20px);
          padding-bottom: max(env(safe-area-inset-bottom, 20px), 20px);
        }

        .lock-bg-decoration {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(233, 69, 96, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(72, 52, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 70%);
          pointer-events: none;
        }

        .lock-container {
          position: relative;
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .lock-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .lock-logo-icon {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #e94560 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(233, 69, 96, 0.3);
        }

        .lock-logo-icon svg {
          width: 36px;
          height: 36px;
          color: white;
        }

        .lock-logo h1 {
          font-size: 24px;
          font-weight: 600;
          color: white;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .lock-logo p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .lock-dots {
          display: flex;
          gap: 16px;
          padding: 16px 0;
        }

        .lock-dots.shake {
          animation: shake 0.5s ease-in-out;
        }

        .lock-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .lock-dot.filled {
          background: #e94560;
          border-color: #e94560;
          box-shadow: 0 0 12px rgba(233, 69, 96, 0.5);
          transform: scale(1.1);
        }

        .lock-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 13px;
        }

        .lock-error svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .lock-keypad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 280px;
        }

        .lock-key {
          height: 64px;
          border-radius: 16px;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 24px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }

        .lock-key:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
        }

        .lock-key:active:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(0.95);
        }

        .lock-key:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .lock-key-action {
          background: rgba(255, 255, 255, 0.05);
        }

        .lock-key-action svg {
          width: 22px;
          height: 22px;
          color: rgba(255, 255, 255, 0.7);
        }

        .lock-key-empty {
          height: 64px;
        }

        .lock-submit {
          width: 100%;
          max-width: 280px;
          padding: 16px 24px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(135deg, #e94560 0%, #8b5cf6 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 24px rgba(233, 69, 96, 0.3);
        }

        .lock-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 32px rgba(233, 69, 96, 0.4);
        }

        .lock-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .lock-submit:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.4);
          box-shadow: none;
          cursor: not-allowed;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }

        @media (max-height: 600px) {
          .lock-container {
            gap: 20px;
          }
          .lock-logo-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
          }
          .lock-logo-icon svg {
            width: 28px;
            height: 28px;
          }
          .lock-logo h1 {
            font-size: 20px;
          }
          .lock-key {
            height: 52px;
          }
          .lock-submit {
            padding: 14px 20px;
          }
        }
      `}</style>
    </div>
  );
}
