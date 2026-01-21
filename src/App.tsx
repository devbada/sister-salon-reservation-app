import { useState, useEffect } from 'react';
import { reservationApi } from './lib/tauri';
import { ResponsiveContainer } from './components/layout/ResponsiveContainer';
import { AppointmentForm } from './components/reservation/AppointmentForm';
import { ReservationTable } from './components/reservation/ReservationTable';
import { DesignerManagement } from './components/designer/DesignerManagement';
import { BusinessHours } from './components/business-hours/BusinessHours';
import type { Reservation } from './types';

type Page = 'reservations' | 'designers' | 'business-hours' | 'statistics' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | undefined>();

  useEffect(() => {
    if (currentPage === 'reservations') {
      loadReservations();
    }
  }, [currentPage, selectedDate]);

  const loadReservations = async () => {
    try {
      const data = await reservationApi.getAll(selectedDate);
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingReservation(undefined);
    loadReservations();
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReservation(undefined);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'reservations':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-2xl font-bold">예약 관리</h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
                />
              </div>
              <button
                onClick={() => {
                  setEditingReservation(undefined);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
              >
                + 새 예약
              </button>
            </div>

            {showForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-auto">
                  <AppointmentForm
                    reservation={editingReservation}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            )}

            <ReservationTable
              reservations={reservations}
              onEdit={handleEdit}
              onRefresh={loadReservations}
            />
          </div>
        );

      case 'designers':
        return <DesignerManagement />;

      case 'business-hours':
        return <BusinessHours />;

      case 'statistics':
        return (
          <div className="glass-card text-center py-12">
            <h2 className="text-2xl font-bold mb-4">통계</h2>
            <p className="text-gray-500">통계 기능은 준비 중입니다.</p>
          </div>
        );

      case 'settings':
        return (
          <div className="glass-card text-center py-12">
            <h2 className="text-2xl font-bold mb-4">설정</h2>
            <p className="text-gray-500">설정 기능은 준비 중입니다.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer currentPage={currentPage} onNavigate={handleNavigate}>
      {renderContent()}
    </ResponsiveContainer>
  );
}

export default App;
