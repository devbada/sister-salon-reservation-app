import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { reservationApi } from './lib/tauri';
import { ResponsiveContainer } from './components/layout/ResponsiveContainer';
import { AppointmentForm } from './components/reservation/AppointmentForm';
import { ReservationTable } from './components/reservation/ReservationTable';
import { CustomerManagement } from './components/customer/CustomerManagement';
import { DesignerManagement } from './components/designer/DesignerManagement';
import { BusinessHours } from './components/business-hours/BusinessHours';
import { StatisticsDashboard } from './components/statistics/StatisticsDashboard';
import { SettingsPage } from './components/settings/SettingsPage';
import type { Reservation } from './types';

type Page = 'reservations' | 'customers' | 'designers' | 'business-hours' | 'statistics' | 'settings';

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    };
    return date.toLocaleDateString('ko-KR', options);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'reservations':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="heading-2">예약 관리</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input py-2 px-3 w-auto"
                  />
                  <span className="text-sm text-gray-500 hidden sm:block">
                    {formatDate(selectedDate)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingReservation(undefined);
                  setShowForm(true);
                }}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                새 예약
              </button>
            </div>

            {/* Modal */}
            {showForm && (
              <div className="modal-overlay" onClick={handleCancel}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <AppointmentForm
                    reservation={editingReservation}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            )}

            {/* Table */}
            <ReservationTable
              reservations={reservations}
              onEdit={handleEdit}
              onRefresh={loadReservations}
            />
          </div>
        );

      case 'customers':
        return <CustomerManagement />;

      case 'designers':
        return <DesignerManagement />;

      case 'business-hours':
        return <BusinessHours />;

      case 'statistics':
        return <StatisticsDashboard />;

      case 'settings':
        return <SettingsPage />;

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
