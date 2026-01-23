import { useState, useCallback } from 'react';
import { X, Delete, CheckCircle, AlertCircle } from 'lucide-react';
import { securityApi } from '../../lib/tauri';

interface PinSetupProps {
  mode: 'setup' | 'change' | 'remove';
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'current' | 'new' | 'confirm';

export function PinSetup({ mode, onComplete, onCancel }: PinSetupProps) {
  const [step, setStep] = useState<Step>(mode === 'setup' ? 'new' : 'current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentInputPin =
    step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin;
  const setCurrentInputPin =
    step === 'current' ? setCurrentPin : step === 'new' ? setNewPin : setConfirmPin;

  const handleKeyPress = useCallback(
    (digit: string) => {
      if (isProcessing) return;
      if (currentInputPin.length >= 6) return;

      setCurrentInputPin((prev) => prev + digit);
      setError(null);
    },
    [currentInputPin, setCurrentInputPin, isProcessing]
  );

  const handleDelete = useCallback(() => {
    if (isProcessing) return;
    setCurrentInputPin((prev) => prev.slice(0, -1));
    setError(null);
  }, [setCurrentInputPin, isProcessing]);

  const handleNext = async () => {
    if (currentInputPin.length < 4) {
      setError('PIN은 4자리 이상이어야 합니다');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (step === 'current') {
        // Verify current PIN
        const isValid = await securityApi.verifyPin(currentPin);
        if (!isValid) {
          setError('현재 PIN이 올바르지 않습니다');
          setCurrentPin('');
          setIsProcessing(false);
          return;
        }

        if (mode === 'remove') {
          // Remove PIN
          await securityApi.removePin();
          onComplete();
          return;
        }

        // Move to new PIN step
        setStep('new');
      } else if (step === 'new') {
        // Move to confirm step
        setStep('confirm');
      } else if (step === 'confirm') {
        // Verify PINs match
        if (newPin !== confirmPin) {
          setError('PIN이 일치하지 않습니다');
          setConfirmPin('');
          setIsProcessing(false);
          return;
        }

        // Set/Change PIN
        if (mode === 'setup') {
          await securityApi.setPin(newPin);
        } else if (mode === 'change') {
          await securityApi.changePin(currentPin, newPin);
        }

        onComplete();
      }
    } catch (error) {
      setError(`오류가 발생했습니다: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTitle = () => {
    if (mode === 'remove') return 'PIN 삭제';
    if (mode === 'change') return 'PIN 변경';
    return 'PIN 설정';
  };

  const getStepTitle = () => {
    if (step === 'current') return '현재 PIN 입력';
    if (step === 'new') return '새 PIN 입력';
    return 'PIN 확인';
  };

  const getStepDescription = () => {
    if (step === 'current') {
      return mode === 'remove'
        ? 'PIN을 삭제하려면 현재 PIN을 입력하세요'
        : '변경하려면 현재 PIN을 입력하세요';
    }
    if (step === 'new') return '4-6자리 PIN을 입력하세요';
    return '한 번 더 입력하세요';
  };

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getTitle()}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Indicator */}
          {mode !== 'remove' && (
            <div className="flex justify-center gap-2 mb-6">
              {(mode === 'change' ? ['current', 'new', 'confirm'] : ['new', 'confirm']).map(
                (s, i) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      s === step
                        ? 'bg-indigo-500'
                        : (mode === 'change' ? ['current', 'new', 'confirm'] : ['new', 'confirm']).indexOf(
                            step
                          ) > i
                        ? 'bg-indigo-300'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )
              )}
            </div>
          )}

          {/* Step Info */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {getStepTitle()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getStepDescription()}
            </p>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  i < currentInputPin.length
                    ? 'bg-indigo-500 scale-125'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {keypadNumbers.map((row, rowIndex) =>
              row.map((key, colIndex) => {
                if (key === '') {
                  return <div key={`${rowIndex}-${colIndex}`} />;
                }
                if (key === 'delete') {
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={handleDelete}
                      disabled={isProcessing || currentInputPin.length === 0}
                      className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  );
                }
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleKeyPress(key)}
                    disabled={isProcessing || currentInputPin.length >= 6}
                    className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {key}
                  </button>
                );
              })
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            disabled={currentInputPin.length < 4 || isProcessing}
            className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all ${
              currentInputPin.length >= 4 && !isProcessing
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              '처리 중...'
            ) : step === 'confirm' || (step === 'current' && mode === 'remove') ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                완료
              </span>
            ) : (
              '다음'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
