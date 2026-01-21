import { invoke } from '@tauri-apps/api/core';
import type { Reservation, Designer, BusinessHours, BackupInfo, ExportPeriod, CloudService, LockSettings } from '../types';

// 예약 생성 입력 타입
interface CreateReservationInput {
  customerName: string;
  customerPhone?: string;
  date: string;
  time: string;
  designerId?: string;
  serviceType?: string;
  notes?: string;
}

// 예약 관리
export const reservationApi = {
  getAll: (date?: string) => invoke<Reservation[]>('get_reservations', { date }),
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
};

// 통계
export const statisticsApi = {
  getSummary: (period: string) => invoke<any>('get_statistics_summary', { period }),
  getDaily: (startDate: string, endDate: string) =>
    invoke<any[]>('get_daily_statistics', { startDate, endDate }),
};

// 내보내기
export const exportApi = {
  toExcel: (period: ExportPeriod, outputPath?: string) =>
    invoke<string>('export_to_excel', { period, outputPath }),
  toCsv: (period: ExportPeriod, outputPath?: string) =>
    invoke<string>('export_to_csv', { period, outputPath }),
};

// 백업
export const backupApi = {
  list: (service: CloudService) => invoke<BackupInfo[]>('list_backups', { service }),
  create: (service: CloudService) => invoke<BackupInfo>('backup_to_cloud', { service }),
  restore: (backupId: string) => invoke<void>('restore_from_backup', { backupId }),
};

// 보안
export const securityApi = {
  setPin: (pin: string) => invoke<void>('set_lock_pin', { pin }),
  verifyPin: (pin: string) => invoke<boolean>('verify_lock_pin', { pin }),
  removePin: () => invoke<void>('remove_lock_pin'),
  authenticateBiometric: () => invoke<boolean>('authenticate_biometric'),
  isLockEnabled: () => invoke<boolean>('is_lock_enabled'),
  getSettings: () => invoke<LockSettings>('get_lock_settings'),
  updateSettings: (settings: LockSettings) => invoke<void>('update_lock_settings', { settings }),
  isBiometricAvailable: () => invoke<boolean>('is_biometric_available'),
};
