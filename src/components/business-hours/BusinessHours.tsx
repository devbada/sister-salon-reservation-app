import { useState, useEffect } from 'react';
import { businessHoursApi } from '../../lib/tauri';
import type { BusinessHours as BusinessHoursType } from '../../types';

const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export function BusinessHours() {
  const [hours, setHours] = useState<BusinessHoursType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    setLoading(true);
    try {
      const data = await businessHoursApi.getAll();
      // dayOfWeek 순서로 정렬
      const sorted = data.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      setHours(sorted);
    } catch (error) {
      console.error('Failed to load business hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (dayOfWeek: number, field: keyof BusinessHoursType, value: string | boolean) => {
    setHours(prev => prev.map(h =>
      h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await businessHoursApi.update(hours);
      alert('영업시간이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save business hours:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card text-center py-8">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">영업시간 관리</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      <div className="glass-card">
        <div className="space-y-4">
          {hours.map((h) => (
            <div
              key={h.dayOfWeek}
              className={`p-4 rounded-lg ${
                h.isClosed ? 'bg-gray-200/50 dark:bg-gray-800/50' : 'bg-white/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* 요일 */}
                <div className="w-20 font-medium">
                  {dayNames[h.dayOfWeek]}
                </div>

                {/* 휴무 토글 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.isClosed}
                    onChange={(e) => handleChange(h.dayOfWeek, 'isClosed', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">휴무</span>
                </label>

                {/* 영업시간 */}
                {!h.isClosed && (
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.openTime || ''}
                        onChange={(e) => handleChange(h.dayOfWeek, 'openTime', e.target.value)}
                        className="px-2 py-1 rounded bg-white/50 dark:bg-black/50 border border-white/20"
                      />
                      <span>~</span>
                      <input
                        type="time"
                        value={h.closeTime || ''}
                        onChange={(e) => handleChange(h.dayOfWeek, 'closeTime', e.target.value)}
                        className="px-2 py-1 rounded bg-white/50 dark:bg-black/50 border border-white/20"
                      />
                    </div>

                    {/* 휴식시간 */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>휴식:</span>
                      <input
                        type="time"
                        value={h.breakStart || ''}
                        onChange={(e) => handleChange(h.dayOfWeek, 'breakStart', e.target.value)}
                        className="px-2 py-1 rounded bg-white/50 dark:bg-black/50 border border-white/20 text-sm"
                      />
                      <span>~</span>
                      <input
                        type="time"
                        value={h.breakEnd || ''}
                        onChange={(e) => handleChange(h.dayOfWeek, 'breakEnd', e.target.value)}
                        className="px-2 py-1 rounded bg-white/50 dark:bg-black/50 border border-white/20 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div className="glass-card text-sm text-gray-500">
        <p>* 영업시간 변경은 저장 버튼을 클릭해야 반영됩니다.</p>
        <p>* 휴식시간은 선택사항입니다.</p>
      </div>
    </div>
  );
}
