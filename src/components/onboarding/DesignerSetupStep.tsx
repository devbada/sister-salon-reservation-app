import { useState } from 'react';
import { Plus, User, Award, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { designerApi } from '../../lib/tauri';
import type { Designer } from '../../types';

interface DesignerSetupStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function DesignerSetupStep({ onNext, onSkip }: DesignerSetupStepProps) {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    console.log('[Onboarding] handleAdd called, name:', name, 'specialty:', specialty);
    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('[Onboarding] Calling designerApi.create...');
      const created = await designerApi.create({
        name: name.trim(),
        specialty: specialty.trim() || undefined,
        isActive: true,
      });
      console.log('[Onboarding] Designer created:', JSON.stringify(created));
      setDesigners(prev => [...prev, created]);
      setName('');
      setSpecialty('');
    } catch (err) {
      console.error('[Onboarding] Failed to create designer:', err);
      setError('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await designerApi.delete(id);
      setDesigners(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete designer:', err);
    }
  };

  const handleNext = async () => {
    // 입력 중인 이름이 있으면 자동으로 저장 후 다음으로
    if (name.trim()) {
      setLoading(true);
      setError(null);
      try {
        const created = await designerApi.create({
          name: name.trim(),
          specialty: specialty.trim() || undefined,
          isActive: true,
        });
        setDesigners(prev => [...prev, created]);
        setName('');
        setSpecialty('');
      } catch (err) {
        console.error('Failed to create designer:', err);
        setError('등록에 실패했습니다. 다시 시도해주세요.');
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    onNext();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            디자이너를 등록해 주세요
          </h1>
          <p className="text-base text-white/50">
            예약을 관리하려면 먼저 디자이너 정보가 필요해요
          </p>
        </div>

        {/* Input Form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
              <User className="w-3.5 h-3.5" />
              디자이너 이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              onKeyDown={handleKeyDown}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white
                         placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/12
                         transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
              <Award className="w-3.5 h-3.5" />
              전문 분야 (선택)
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="커트, 펌, 염색..."
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white
                         placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/12
                         transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-white/10 text-white font-medium hover:bg-white/15
                       active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            디자이너 추가
          </button>
        </div>

        {/* Added Designers List */}
        {designers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-white/50">등록된 디자이너 ({designers.length}명)</p>
            <div className="space-y-2">
              {designers.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/8 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{d.name}</p>
                      {d.specialty && (
                        <p className="text-xs text-white/40">{d.specialty}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                       bg-indigo-600 text-white font-semibold hover:bg-indigo-500
                       active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                다음으로
                <ChevronRight className="w-4 h-4" />
              </>
            )}
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
