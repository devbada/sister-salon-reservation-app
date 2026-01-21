import { useState, useEffect } from 'react';
import { reservationApi } from './lib/tauri';
import { AppointmentForm } from './components/reservation/AppointmentForm';
import { ReservationTable } from './components/reservation/ReservationTable';
import { DesignerManagement } from './components/designer/DesignerManagement';
import { BusinessHours } from './components/business-hours/BusinessHours';
import type { Reservation } from './types';

type Page = 'reservations' | 'designers' | 'business-hours';

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

  const navItems: { page: Page; label: string }[] = [
    { page: 'reservations', label: '예약 관리' },
    { page: 'designers', label: '디자이너' },
    { page: 'business-hours', label: '영업시간' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* 헤더 */}
      <header className="glass-card m-0 rounded-none border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              Sisters Salon
            </h1>
            <nav className="flex gap-1 overflow-x-auto">
              {navItems.map(({ page, label }) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/50 dark:bg-black/30 hover:bg-white/70 dark:hover:bg-black/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'reservations' && (
          <div className="space-y-6">
            {/* 예약 페이지 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
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
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                + 새 예약
              </button>
            </div>

            {/* 예약 폼 (모달 형태) */}
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

            {/* 예약 테이블 */}
            <ReservationTable
              reservations={reservations}
              onEdit={handleEdit}
              onRefresh={loadReservations}
            />
          </div>
        )}

        {currentPage === 'designers' && <DesignerManagement />}

        {currentPage === 'business-hours' && <BusinessHours />}
      </main>
    </div>
  );
}

export default App;
