import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { reservationApi } from './lib/tauri';
import { ResponsiveContainer } from './components/layout/ResponsiveContainer';
import { AppointmentForm } from './components/reservation/AppointmentForm';
import { ReservationTable } from './components/reservation/ReservationTable';
import { DateRangeFilter, type DateRange, type DateRangePreset } from './components/reservation/DateRangeFilter';
import { CustomerManagement } from './components/customer/CustomerManagement';
import { DesignerManagement } from './components/designer/DesignerManagement';
import { BusinessHours } from './components/business-hours/BusinessHours';
import { StatisticsDashboard } from './components/statistics/StatisticsDashboard';
import { SettingsPage } from './components/settings/SettingsPage';
import { LockScreen } from './components/lock/LockScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { DisplaySettingsProvider } from './contexts/DisplaySettingsContext';
import { UnsavedChangesProvider, useUnsavedChanges } from './contexts/UnsavedChangesContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { UnsavedChangesDialog } from './components/common/UnsavedChangesDialog';
import { useAppLock } from './hooks/useAppLock';
import { useOnboarding } from './hooks/useOnboarding';
import type { Reservation } from './types';

type Page = 'reservations' | 'customers' | 'designers' | 'business-hours' | 'statistics' | 'settings';

// Reset state keys for each page
type ResetKey = number;
interface PageResetKeys {
  reservations: ResetKey;
  customers: ResetKey;
  designers: ResetKey;
  settings: ResetKey;
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>('today');
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | undefined>();

  // Reset keys to force component remounting
  const [resetKeys, setResetKeys] = useState<PageResetKeys>({
    reservations: 0,
    customers: 0,
    designers: 0,
    settings: 0,
  });

  // App lock
  const { isLocked, isInitializing, unlock, unlockBiometric, settings, isBiometricAvailable, biometricType, refreshSettings } = useAppLock();

  // Onboarding
  const { completed: onboardingCompleted, isChecking: onboardingChecking, currentStep, nextStep, goToStep, completeOnboarding } = useOnboarding();

  // Unsaved changes context
  const { checkAndNavigate, setHasUnsavedChanges } = useUnsavedChanges();

  // Modal context for hiding bottom tabs
  const { setModalOpen } = useModal();

  // --- All function definitions BEFORE any early returns ---

  const loadReservations = useCallback(async () => {
    try {
      let data: Reservation[];
      if (dateRange) {
        data = await reservationApi.getAll(undefined, dateRange.from, dateRange.to);
      } else {
        data = await reservationApi.getAll(selectedDate);
      }
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  }, [selectedDate, dateRange]);

  const handleDateRangeChange = useCallback((range: DateRange | null, preset: DateRangePreset) => {
    setDateRange(range);
    setDatePreset(preset);
  }, []);

  const handleFormSubmit = useCallback(() => {
    setShowForm(false);
    setEditingReservation(undefined);
    setHasUnsavedChanges(false);
    loadReservations();
  }, [loadReservations, setHasUnsavedChanges]);

  const handleEdit = useCallback((reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowForm(true);
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingReservation(undefined);
    setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);

  const handleNavigate = useCallback((page: string) => {
    const doNavigate = () => {
      setCurrentPage(page as Page);
      setHasUnsavedChanges(false);
    };

    checkAndNavigate(doNavigate);
  }, [checkAndNavigate, setHasUnsavedChanges]);

  const handleResetTab = useCallback((page: string) => {
    const doReset = () => {
      // Increment reset key to force component remount
      setResetKeys(prev => ({
        ...prev,
        [page]: prev[page as keyof PageResetKeys] + 1,
      }));
      // Clear any unsaved changes
      setHasUnsavedChanges(false);

      // Page-specific reset logic
      if (page === 'reservations') {
        // Reset to today
        const today = new Date();
        setSelectedDate(today.toISOString().split('T')[0]);
        setDateRange(null);
        setDatePreset('today');
        setShowForm(false);
        setEditingReservation(undefined);
      }
    };

    checkAndNavigate(doReset);
  }, [checkAndNavigate, setHasUnsavedChanges]);

  // --- Effects ---

  // Sync showForm state with modal context
  useEffect(() => {
    setModalOpen(showForm);
  }, [showForm, setModalOpen]);

  useEffect(() => {
    if (currentPage === 'reservations') {
      loadReservations();
    }
  }, [currentPage, loadReservations]);

  // --- Early returns (after all hooks and function definitions) ---

  // Show nothing while checking lock status or onboarding to prevent content flash
  if (isInitializing || onboardingChecking) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      />
    );
  }

  // Show lock screen if locked
  if (isLocked) {
    return (
      <LockScreen
        onUnlock={unlock}
        onBiometricUnlock={isBiometricAvailable && settings?.useBiometric ? unlockBiometric : undefined}
        biometricType={biometricType}
      />
    );
  }

  // Show onboarding if not completed
  if (!onboardingCompleted) {
    return (
      <OnboardingFlow
        currentStep={currentStep}
        onNextStep={nextStep}
        onGoToStep={goToStep}
        onComplete={completeOnboarding}
        onNavigateToBusinessHours={() => {
          completeOnboarding();
          setCurrentPage('business-hours');
        }}
      />
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'reservations':
        return (
          <div className="space-y-6" key={`reservations-${resetKeys.reservations}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="heading-2">예약 관리</h2>
                <DateRangeFilter
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onDateRangeChange={handleDateRangeChange}
                  currentPreset={datePreset}
                />
                {dateRange && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {reservations.length}건
                  </span>
                )}
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
        return <CustomerManagement key={`customers-${resetKeys.customers}`} />;

      case 'designers':
        return <DesignerManagement key={`designers-${resetKeys.designers}`} />;

      case 'business-hours':
        return <BusinessHours />;

      case 'statistics':
        return <StatisticsDashboard />;

      case 'settings':
        return <SettingsPage key={`settings-${resetKeys.settings}`} onLockSettingsChange={refreshSettings} />;

      default:
        return null;
    }
  };

  return (
    <>
      <ResponsiveContainer
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onResetTab={handleResetTab}
      >
        {renderContent()}
      </ResponsiveContainer>
      <UnsavedChangesDialog />
    </>
  );
}

function App() {
  return (
    <DisplaySettingsProvider>
      <ModalProvider>
        <UnsavedChangesProvider>
          <AppContent />
        </UnsavedChangesProvider>
      </ModalProvider>
    </DisplaySettingsProvider>
  );
}

export default App;
