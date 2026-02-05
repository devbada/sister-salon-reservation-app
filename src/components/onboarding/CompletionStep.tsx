import { CheckCircle } from 'lucide-react';

interface CompletionStepProps {
  onStart: () => void;
}

export function CompletionStep({ onStart }: CompletionStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in text-center">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="p-5 rounded-full bg-green-500/15 border border-green-500/20">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            설정 완료!
          </h1>
          <p className="text-base text-white/50">
            이제 예약을 관리할 수 있어요
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-semibold
                     hover:bg-indigo-500 active:scale-[0.98] transition-all"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
