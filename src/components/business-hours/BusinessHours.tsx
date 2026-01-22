import { useState, useEffect } from 'react';
import { Clock, Coffee, Save, Loader2, Info } from 'lucide-react';
import { businessHoursApi } from '../../lib/tauri';
import type { BusinessHours as BusinessHoursType } from '../../types';

const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const shortDayNames = ['일', '월', '화', '수', '목', '금', '토'];

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
      <div className="glass-card empty-state">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
        <p className="text-caption">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="heading-2">영업시간 관리</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              저장
            </>
          )}
        </button>
      </div>

      {/* Business Hours List */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {hours.map((h, index) => (
            <div
              key={h.dayOfWeek}
              className={`p-4 animate-fade-in ${
                h.isClosed ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Day Name */}
                <div className="flex items-center gap-3 lg:w-28">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                    h.isClosed
                      ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      : h.dayOfWeek === 0 || h.dayOfWeek === 6
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  }`}>
                    {shortDayNames[h.dayOfWeek]}
                  </div>
                  <span className="font-medium lg:hidden">{dayNames[h.dayOfWeek]}</span>
                  <span className="font-medium hidden lg:block">{dayNames[h.dayOfWeek]}</span>
                </div>

                {/* Closed Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={h.isClosed}
                    onChange={(e) => handleChange(h.dayOfWeek, 'isClosed', e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">휴무</span>
                </label>

                {/* Time Inputs */}
                {!h.isClosed && (
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                    {/* Operating Hours */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 hidden sm:block" />
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.openTime || ''}
                          onChange={(e) => handleChange(h.dayOfWeek, 'openTime', e.target.value)}
                          className="input py-2 px-3 w-[120px]"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                          type="time"
                          value={h.closeTime || ''}
                          onChange={(e) => handleChange(h.dayOfWeek, 'closeTime', e.target.value)}
                          className="input py-2 px-3 w-[120px]"
                        />
                      </div>
                    </div>

                    {/* Break Time */}
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-gray-400 hidden sm:block" />
                      <span className="text-sm text-gray-500 hidden sm:block">휴식</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.breakStart || ''}
                          onChange={(e) => handleChange(h.dayOfWeek, 'breakStart', e.target.value)}
                          className="input py-2 px-3 w-[120px] text-sm"
                          placeholder="시작"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                          type="time"
                          value={h.breakEnd || ''}
                          onChange={(e) => handleChange(h.dayOfWeek, 'breakEnd', e.target.value)}
                          className="input py-2 px-3 w-[120px] text-sm"
                          placeholder="종료"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {h.isClosed && (
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">영업하지 않습니다</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="glass-card flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>영업시간 변경은 저장 버튼을 클릭해야 반영됩니다.</p>
          <p>휴식시간은 선택사항입니다.</p>
        </div>
      </div>
    </div>
  );
}
