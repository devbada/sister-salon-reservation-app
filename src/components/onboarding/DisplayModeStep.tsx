import { Monitor, ZoomIn } from 'lucide-react';
import { useDisplaySettings } from '../../contexts/DisplaySettingsContext';

interface DisplayModeStepProps {
  onNext: () => void;
}

export function DisplayModeStep({ onNext }: DisplayModeStepProps) {
  const { updateSettings, completeOnboarding: completeDisplayOnboarding } = useDisplaySettings();

  const handleSelect = (mode: 'normal' | 'comfortable') => {
    if (mode === 'comfortable') {
      updateSettings({ textSize: 'large', buttonSize: 'large' });
    } else {
      updateSettings({ textSize: 'normal', buttonSize: 'normal' });
    }
    completeDisplayOnboarding();
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            언니들의 미용실에
          </h1>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            오신 것을 환영합니다
          </h1>
          <p className="text-lg text-white/60 mt-4">
            화면을 어떻게 표시할까요?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Normal Mode */}
          <button
            onClick={() => handleSelect('normal')}
            className="w-full p-6 rounded-2xl border-2 border-white/15 bg-white/8 hover:bg-white/12
                       hover:border-white/25 transition-all duration-200 text-left group
                       active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/10 text-white/80 group-hover:text-white transition-colors">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">기본 모드</p>
                <p className="text-sm text-white/50">일반적인 크기</p>
              </div>
            </div>
          </button>

          {/* Comfortable Mode */}
          <button
            onClick={() => handleSelect('comfortable')}
            className="w-full p-6 rounded-2xl border-2 border-white/15 bg-white/8 hover:bg-white/12
                       hover:border-white/25 transition-all duration-200 text-left group
                       active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/10 text-white/80 group-hover:text-white transition-colors">
                <ZoomIn className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">편한 보기 모드</p>
                <p className="text-sm text-white/50">더 큰 글씨와 버튼</p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-white/40">
          설정에서 언제든 변경할 수 있어요
        </p>
      </div>
    </div>
  );
}
