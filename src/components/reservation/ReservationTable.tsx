import { useState } from 'react';
import { Pencil, Trash2, MoreVertical, Calendar, Clock, User, Scissors, Loader2 } from 'lucide-react';
import { reservationApi } from '../../lib/tauri';
import type { Reservation, ReservationStatus } from '../../types';

interface ReservationTableProps {
  reservations: Reservation[];
  onEdit: (reservation: Reservation) => void;
  onRefresh: () => void;
}

const statusConfig: Record<ReservationStatus, { label: string; className: string }> = {
  pending: { label: '대기', className: 'badge-pending' },
  confirmed: { label: '확정', className: 'badge-confirmed' },
  completed: { label: '완료', className: 'badge-completed' },
  cancelled: { label: '취소', className: 'badge-cancelled' },
  no_show: { label: '노쇼', className: 'badge-no-show' },
};

export function ReservationTable({ reservations, onEdit, onRefresh }: ReservationTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

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
      <div className="glass-card empty-state">
        <Calendar className="empty-state-icon" />
        <h3 className="heading-3 mb-2">예약이 없습니다</h3>
        <p className="text-caption">선택한 날짜에 예약이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-0 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="table-header text-left">시간</th>
              <th className="table-header text-left">고객</th>
              <th className="table-header text-left">디자이너</th>
              <th className="table-header text-left">서비스</th>
              <th className="table-header text-left">상태</th>
              <th className="table-header text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r, index) => (
              <tr
                key={r.id}
                className="table-row animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{r.time}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{r.customerName}</p>
                    {r.customerPhone && (
                      <p className="text-caption text-sm">{r.customerPhone}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600 dark:text-gray-400">
                    {r.designerId || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.serviceType ? (
                    <div className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-gray-400" />
                      <span>{r.serviceType}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value as ReservationStatus)}
                    disabled={loading === r.id}
                    className={`badge cursor-pointer border-0 ${statusConfig[r.status].className}`}
                  >
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(r)}
                      className="btn btn-ghost btn-sm btn-icon"
                      title="수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={loading === r.id}
                      className="btn btn-ghost btn-sm btn-icon text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      title="삭제"
                    >
                      {loading === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden divide-y divide-black/5 dark:divide-white/5">
        {reservations.map((r, index) => (
          <div
            key={r.id}
            className="p-4 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold truncate">{r.customerName}</span>
                  <span className={`badge ${statusConfig[r.status].className}`}>
                    {statusConfig[r.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {r.time}
                  </span>
                  {r.serviceType && (
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3.5 h-3.5" />
                      {r.serviceType}
                    </span>
                  )}
                </div>
                {r.designerId && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <User className="w-3.5 h-3.5" />
                    {r.designerId}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)}
                  className="btn btn-ghost btn-sm btn-icon"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {openMenu === r.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenu(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-32 glass-card p-1 z-20 animate-scale-in">
                      <button
                        onClick={() => {
                          onEdit(r);
                          setOpenMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <Pencil className="w-4 h-4" />
                        수정
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(r.id);
                          setOpenMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
