import { invoke } from '@tauri-apps/api/core';
import type {
  Reservation,
  Designer,
  BusinessHours,
  Holiday,
  CreateHolidayInput,
  Customer,
  CreateCustomerInput,
  CustomerReservation,
  BackupInfo,
  ExportPeriod,
  CloudService,
  LockSettings,
  StatisticsSummary,
  DailyStatistic,
  HourlyStatistic,
  DesignerStatistic,
  StatisticsPeriod,
} from '../types';

// 예약 생성 입력 타입
interface CreateReservationInput {
  customerName?: string;
  customerPhone?: string;
  date: string;
  time: string;
  designerId?: string;
  serviceType?: string;
  notes?: string;
}

// 예약 관리
export const reservationApi = {
  getAll: (date?: string, dateFrom?: string, dateTo?: string) =>
    invoke<Reservation[]>('get_reservations', { date, dateFrom, dateTo }),
  getById: (id: string) => invoke<Reservation>('get_reservation', { id }),
  create: (data: CreateReservationInput) =>
    invoke<Reservation>('create_reservation', { data }),
  update: (id: string, data: Partial<CreateReservationInput>) =>
    invoke<Reservation>('update_reservation', { id, data }),
  delete: (id: string) => invoke<void>('delete_reservation', { id }),
  updateStatus: (id: string, status: Reservation['status']) =>
    invoke<Reservation>('update_reservation_status', { id, status }),
};

// 디자이너 관리
export const designerApi = {
  getAll: () => invoke<Designer[]>('get_designers'),
  getActive: () => invoke<Designer[]>('get_active_designers'),
  create: (data: Omit<Designer, 'id' | 'createdAt' | 'updatedAt'>) =>
    invoke<Designer>('create_designer', { data }),
  update: (id: string, data: Partial<Designer>) =>
    invoke<Designer>('update_designer', { id, data }),
  delete: (id: string) => invoke<void>('delete_designer', { id }),
};

// 영업시간 관리
export const businessHoursApi = {
  getAll: () => invoke<BusinessHours[]>('get_business_hours'),
  update: (data: BusinessHours[]) => invoke<void>('update_business_hours', { data }),
  // 휴일 관리
  getHolidays: () => invoke<Holiday[]>('get_holidays'),
  addHoliday: (data: CreateHolidayInput) => invoke<Holiday>('add_holiday', { data }),
  deleteHoliday: (id: string) => invoke<void>('delete_holiday', { id }),
};

// 고객 관리
export const customerApi = {
  getAll: () => invoke<Customer[]>('get_customers'),
  getById: (id: string) => invoke<Customer>('get_customer', { id }),
  create: (data: CreateCustomerInput) => invoke<Customer>('create_customer', { data }),
  update: (id: string, data: Partial<CreateCustomerInput>) =>
    invoke<Customer>('update_customer', { id, data }),
  delete: (id: string) => invoke<void>('delete_customer', { id }),
  search: (query: string) => invoke<Customer[]>('search_customers', { query }),
  getByPhone: (phone: string) => invoke<Customer | null>('get_customer_by_phone', { phone }),
  getReservations: (customerId: string) =>
    invoke<CustomerReservation[]>('get_customer_reservations', { customerId }),
  updateVisitStats: (customerId: string) =>
    invoke<void>('update_customer_visit_stats', { customerId }),
};

// 통계
export const statisticsApi = {
  getSummary: (period: StatisticsPeriod) =>
    invoke<StatisticsSummary>('get_statistics_summary', { period }),
  getDaily: (startDate: string, endDate: string) =>
    invoke<DailyStatistic[]>('get_daily_statistics', { startDate, endDate }),
  getHourly: (period: StatisticsPeriod) =>
    invoke<HourlyStatistic[]>('get_hourly_statistics', { period }),
  getByDesigner: (period: StatisticsPeriod) =>
    invoke<DesignerStatistic[]>('get_designer_statistics', { period }),
};

// 내보내기
export const exportApi = {
  toExcel: (period: ExportPeriod) =>
    invoke<string>('export_to_excel', { period }),
  toCsv: (period: ExportPeriod) =>
    invoke<string>('export_to_csv', { period }),
  getExportPath: () => invoke<string>('get_export_path'),
};

// 백업
export const backupApi = {
  list: (service: CloudService) => invoke<BackupInfo[]>('list_backups', { service }),
  create: (service: CloudService) => invoke<BackupInfo>('create_backup', { service }),
  restore: (backupFilename: string, service: CloudService) =>
    invoke<void>('restore_backup', { backupFilename, service }),
  delete: (backupFilename: string, service: CloudService) =>
    invoke<void>('delete_backup', { backupFilename, service }),
  cleanup: (keepCount: number, service: CloudService) =>
    invoke<void>('cleanup_old_backups', { keepCount, service }),
  isIcloudAvailable: () => invoke<boolean>('is_icloud_available'),
  getDebugInfo: (service: CloudService) => invoke<string>('get_backup_debug_info', { service }),
};

// 보안
export const securityApi = {
  setPin: (pin: string) => invoke<void>('set_lock_pin', { pin }),
  verifyPin: (pin: string) => invoke<boolean>('verify_lock_pin', { pin }),
  removePin: () => invoke<void>('remove_lock_pin'),
  changePin: (oldPin: string, newPin: string) =>
    invoke<void>('change_lock_pin', { oldPin, newPin }),
  authenticateBiometric: () => invoke<boolean>('authenticate_biometric'),
  isLockEnabled: () => invoke<boolean>('is_lock_enabled'),
  getSettings: () => invoke<LockSettings>('get_lock_settings'),
  updateSettings: (settings: LockSettings) => invoke<void>('update_lock_settings', { settings }),
  isBiometricAvailable: () => invoke<boolean>('is_biometric_available'),
  getBiometricType: () => invoke<string>('get_biometric_type'),
};
