import { useState, useEffect } from 'react';
import {
  CalendarOff,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { businessHoursApi } from '../../lib/tauri';
import type { Holiday } from '../../types';

export function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: '', description: '', isRecurring: false });
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setIsLoading(true);
    try {
      const data = await businessHoursApi.getHolidays();
      setHolidays(data);
    } catch (error) {
      console.error('Failed to load holidays:', error);
      setMessage({ success: false, text: '휴일 목록을 불러오는데 실패했습니다' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date) {
      setMessage({ success: false, text: '날짜를 선택해주세요' });
      return;
    }

    try {
      await businessHoursApi.addHoliday({
        date: newHoliday.date,
        description: newHoliday.description || undefined,
        isRecurring: newHoliday.isRecurring,
      });
      setMessage({ success: true, text: '휴일이 추가되었습니다' });
      setNewHoliday({ date: '', description: '', isRecurring: false });
      setShowAddForm(false);
      loadHolidays();
    } catch (error) {
      setMessage({ success: false, text: '휴일 추가에 실패했습니다' });
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await businessHoursApi.deleteHoliday(id);
      setMessage({ success: true, text: '휴일이 삭제되었습니다' });
      loadHolidays();
    } catch (error) {
      setMessage({ success: false, text: '휴일 삭제에 실패했습니다' });
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Holiday Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4
                   bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl
                   font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        휴일 추가
      </button>

      {/* Add Holiday Form */}
      {showAddForm && (
        <div className="card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              날짜
            </label>
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              설명 (선택)
            </label>
            <input
              type="text"
              value={newHoliday.description}
              onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
              placeholder="예: 설 연휴"
              className="input w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={newHoliday.isRecurring}
              onChange={(e) => setNewHoliday({ ...newHoliday, isRecurring: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="isRecurring" className="text-sm text-gray-700 dark:text-gray-300">
              매년 반복
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600
                         text-gray-700 dark:text-gray-300 font-medium
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAddHoliday}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-medium
                         hover:bg-indigo-700 transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.success
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {message.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Holiday List */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-red-500" />
            등록된 휴일
          </h4>
        </div>
        {holidays.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            등록된 휴일이 없습니다
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {holidays.map((holiday) => (
              <div
                key={holiday.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatDate(holiday.date)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {holiday.description && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {holiday.description}
                      </span>
                    )}
                    {holiday.isRecurring && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full
                                       bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        매년 반복
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteHoliday(holiday.id)}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30
                             text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
