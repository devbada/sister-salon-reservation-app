import { useState, useEffect, useMemo } from 'react';
import {
  Pencil, Trash2, MoreVertical, Calendar, Clock, User, Scissors, Loader2,
  CheckCircle2, XCircle, UserX, CircleDot,
} from 'lucide-react';
import { reservationApi, designerApi } from '../../lib/tauri';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { Reservation, ReservationStatus, Designer } from '../../types';

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

// Valid status transitions
const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

// Icon and color for each status action button
const statusActionStyle: Record<ReservationStatus, {
  icon: typeof CheckCircle2;
  className: string;
}> = {
  confirmed: { icon: CircleDot, className: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950' },
  completed: { icon: CheckCircle2, className: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950' },
  cancelled: { icon: XCircle, className: 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950' },
  no_show: { icon: UserX, className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950' },
  pending: { icon: CircleDot, className: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900' },
};

export function ReservationTable({ reservations, onEdit, onRefresh }: ReservationTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [designers, setDesigners] = useState<Designer[]>([]);

  useEffect(() => {
    designerApi.getAll().then(setDesigners).catch(() => {});
  }, []);

  const designerMap = useMemo(() => {
    const map = new Map<string, string>();
    designers.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [designers]);

  const getDesignerName = (id?: string) => {
    if (!id) return '-';
    return designerMap.get(id) || '-';
  };

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    setLoading(id);
    setOpenMenu(null);
    try {
      await reservationApi.updateStatus(id, status);
      onRefresh();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
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

  const getNextStatuses = (current: ReservationStatus): ReservationStatus[] => {
    return validTransitions[current] || [];
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
    <>
      <div className="glass-card p-0 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="table-header text-left">시간</th>
                <th className="table-header text-left">연락처</th>
                <th className="table-header text-left">디자이너</th>
                <th className="table-header text-left">서비스</th>
                <th className="table-header text-left">상태</th>
                <th className="table-header text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r, index) => {
                const nextStatuses = getNextStatuses(r.status);
                return (
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
                        <p className="font-medium">{r.customerPhone || '-'}</p>
                        {r.customerName && (
                          <p className="text-caption text-sm">{r.customerName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 dark:text-gray-400">
                        {getDesignerName(r.designerId)}
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
                      <div className="flex items-center gap-2">
                        <span className={`badge ${statusConfig[r.status].className}`}>
                          {statusConfig[r.status].label}
                        </span>
                        {nextStatuses.length > 0 && (
                          <div className="flex items-center gap-1">
                            {nextStatuses.map((nextStatus) => {
                              const style = statusActionStyle[nextStatus];
                              const Icon = style.icon;
                              return (
                                <button
                                  key={nextStatus}
                                  onClick={() => handleStatusChange(r.id, nextStatus)}
                                  disabled={loading === r.id}
                                  className={`btn btn-ghost btn-sm btn-icon ${style.className}`}
                                  title={statusConfig[nextStatus].label}
                                >
                                  <Icon className="w-4 h-4" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
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
                          onClick={() => setDeleteTarget(r.id)}
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="lg:hidden divide-y divide-black/5 dark:divide-white/5">
          {reservations.map((r, index) => {
            const nextStatuses = getNextStatuses(r.status);
            return (
              <div
                key={r.id}
                className="p-4 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{r.customerPhone || '-'}</span>
                      <span className={`badge ${statusConfig[r.status].className}`}>
                        {statusConfig[r.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      {r.customerName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {r.customerName}
                        </span>
                      )}
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
                        {getDesignerName(r.designerId)}
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
                        <div className="absolute right-0 top-full mt-1 w-40 glass-card p-1 z-20 animate-scale-in">
                          {/* Status change actions */}
                          {nextStatuses.length > 0 && (
                            <>
                              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                                상태 변경
                              </div>
                              {nextStatuses.map((nextStatus) => {
                                const style = statusActionStyle[nextStatus];
                                const Icon = style.icon;
                                return (
                                  <button
                                    key={nextStatus}
                                    onClick={() => handleStatusChange(r.id, nextStatus)}
                                    disabled={loading === r.id}
                                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg ${style.className}`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    {statusConfig[nextStatus].label}
                                  </button>
                                );
                              })}
                              <div className="my-1 border-t border-black/5 dark:border-white/5" />
                            </>
                          )}

                          {/* Edit */}
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

                          {/* Delete */}
                          <button
                            onClick={() => {
                              setDeleteTarget(r.id);
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

                {/* Inline status action buttons for mobile */}
                {nextStatuses.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                    {nextStatuses.map((nextStatus) => {
                      const style = statusActionStyle[nextStatus];
                      const Icon = style.icon;
                      return (
                        <button
                          key={nextStatus}
                          onClick={() => handleStatusChange(r.id, nextStatus)}
                          disabled={loading === r.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-current/10 ${style.className}`}
                        >
                          {loading === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                          {statusConfig[nextStatus].label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="예약 삭제"
        message="이 예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
