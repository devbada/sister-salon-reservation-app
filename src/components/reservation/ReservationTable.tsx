import { useState } from 'react';
import { reservationApi } from '../../lib/tauri';
import type { Reservation, ReservationStatus } from '../../types';

interface ReservationTableProps {
  reservations: Reservation[];
  onEdit: (reservation: Reservation) => void;
  onRefresh: () => void;
}

const statusColors: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-red-100 text-red-800',
};

const statusLabels: Record<ReservationStatus, string> = {
  pending: '대기',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
  no_show: '노쇼',
};

export function ReservationTable({ reservations, onEdit, onRefresh }: ReservationTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    setLoading(id);
    try {
      await reservationApi.updateStatus(id, status);
      onRefresh();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setLoading(id);
    try {
      await reservationApi.delete(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setLoading(null);
    }
  };

  if (reservations.length === 0) {
    return (
      <div className="glass-card text-center py-8 text-gray-500">
        예약이 없습니다
      </div>
    );
  }

  return (
    <div className="glass-card overflow-x-auto">
      {/* Desktop 테이블 */}
      <table className="hidden lg:table w-full">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left p-3">날짜</th>
            <th className="text-left p-3">시간</th>
            <th className="text-left p-3">고객</th>
            <th className="text-left p-3">디자이너</th>
            <th className="text-left p-3">서비스</th>
            <th className="text-left p-3">상태</th>
            <th className="text-right p-3">액션</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id} className="border-b border-white/10 hover:bg-white/10">
              <td className="p-3">{r.date}</td>
              <td className="p-3">{r.time}</td>
              <td className="p-3">{r.customerName}</td>
              <td className="p-3">{r.designerId || '-'}</td>
              <td className="p-3">{r.serviceType || '-'}</td>
              <td className="p-3">
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value as ReservationStatus)}
                  disabled={loading === r.id}
                  className={`px-2 py-1 rounded text-sm ${statusColors[r.status]}`}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-right">
                <button
                  onClick={() => onEdit(r)}
                  className="text-blue-600 hover:text-blue-800 mr-2"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={loading === r.id}
                  className="text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile 카드 리스트 */}
      <div className="lg:hidden space-y-3">
        {reservations.map((r) => (
          <div key={r.id} className="p-4 bg-white/10 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{r.customerName}</p>
                <p className="text-sm text-gray-500">{r.date} {r.time}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${statusColors[r.status]}`}>
                {statusLabels[r.status]}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {r.serviceType && <span>{r.serviceType}</span>}
              {r.designerId && <span> · {r.designerId}</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(r)}
                className="flex-1 py-1 text-sm bg-blue-100 text-blue-800 rounded"
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="flex-1 py-1 text-sm bg-red-100 text-red-800 rounded"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
