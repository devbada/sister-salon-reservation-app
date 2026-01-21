import { useState, useEffect } from 'react';
import { reservationApi, designerApi } from '../../lib/tauri';
import type { Reservation, Designer } from '../../types';

interface CreateReservationInput {
  customerName: string;
  customerPhone?: string;
  date: string;
  time: string;
  designerId?: string;
  serviceType?: string;
  notes?: string;
}

interface AppointmentFormProps {
  reservation?: Reservation;
  onSubmit: (reservation: Reservation) => void;
  onCancel: () => void;
}

export function AppointmentForm({ reservation, onSubmit, onCancel }: AppointmentFormProps) {
  const [formData, setFormData] = useState<CreateReservationInput>({
    customerName: reservation?.customerName || '',
    customerPhone: reservation?.customerPhone || '',
    date: reservation?.date || '',
    time: reservation?.time || '',
    designerId: reservation?.designerId || '',
    serviceType: reservation?.serviceType || '',
    notes: reservation?.notes || '',
  });
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDesigners();
  }, []);

  const loadDesigners = async () => {
    try {
      const data = await designerApi.getActive();
      setDesigners(data);
    } catch (error) {
      console.error('Failed to load designers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result: Reservation;
      if (reservation) {
        result = await reservationApi.update(reservation.id, formData);
      } else {
        result = await reservationApi.create(formData);
      }
      onSubmit(result);
    } catch (error) {
      console.error('Failed to save reservation:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceTypes = ['커트', '펌', '염색', '클리닉', '스타일링'];

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4">
      <h2 className="text-xl font-bold">
        {reservation ? '예약 수정' : '새 예약'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객명 *</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">연락처</label>
          <input
            type="tel"
            value={formData.customerPhone || ''}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">날짜 *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">시간 *</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">디자이너</label>
          <select
            value={formData.designerId || ''}
            onChange={(e) => setFormData({ ...formData, designerId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          >
            <option value="">선택</option>
            {designers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">서비스</label>
          <select
            value={formData.serviceType || ''}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          >
            <option value="">선택</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">메모</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:opacity-80"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
