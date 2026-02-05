import { Clock, ChevronRight } from 'lucide-react';

interface BusinessHoursStepProps {
  onSetupNow: () => void;
  onSkip: () => void;
}

export function BusinessHoursStep({ onSetupNow, onSkip }: BusinessHoursStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-5 rounded-2xl bg-white/8 border border-white/10">
            <Clock className="w-12 h-12 text-white/70" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            영업시간을 설정할까요?
          </h1>
          <p className="text-base text-white/50 leading-relaxed">
            영업시간을 설정하면 예약 가능 시간을
            <br />
            자동으로 관리할 수 있어요
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onSetupNow}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                       bg-indigo-600 text-white font-semibold hover:bg-indigo-500
                       active:scale-[0.98] transition-all"
          >
            지금 설정하기
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onSkip}
            className="w-full py-3 text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}
