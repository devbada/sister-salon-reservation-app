// 예약 상태
export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

// 예약
export interface Reservation {
  id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  time: string;
  designerId?: string;
  serviceType?: string;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 디자이너
export interface Designer {
  id: string;
  name: string;
  specialty?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 영업시간
export interface BusinessHours {
  id: number;
  dayOfWeek: number; // 0-6 (일-토)
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
  isClosed: boolean;
}

// 휴일
export interface Holiday {
  id: string;
  date: string;
  description?: string;
  isRecurring: boolean;
}

// 휴일 생성 입력
export interface CreateHolidayInput {
  date: string;
  description?: string;
  isRecurring: boolean;
}

// 고객
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthdate?: string;
  gender?: 'male' | 'female' | 'other';
  preferredDesignerId?: string;
  preferredService?: string;
  allergies?: string;
  totalVisits: number;
  lastVisitDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 고객 생성 입력
export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  birthdate?: string;
  gender?: 'male' | 'female' | 'other';
  preferredDesignerId?: string;
  preferredService?: string;
  allergies?: string;
  notes?: string;
}

// 고객 예약 이력
export interface CustomerReservation {
  id: string;
  date: string;
  time: string;
  serviceType?: string;
  designerName?: string;
  status: string;
  notes?: string;
}

// 디바이스 타입
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 내보내기 기간
export type ExportPeriod = 'this_month' | 'last_3_months' | 'all';

// 클라우드 서비스
export type CloudService = 'icloud' | 'google_drive' | 'local';

// 백업 정보
export interface BackupInfo {
  id: string;
  service: CloudService;
  filename: string;
  size: number;
  createdAt: string;
}

// 잠금 설정
export interface LockSettings {
  isEnabled: boolean;
  useBiometric: boolean;
  autoLockTimeout: number;
  lockOnBackground: boolean;
}

// 통계 기간
export type StatisticsPeriod = '7d' | '30d' | '90d' | 'all';

// 통계 요약
export interface StatisticsSummary {
  totalReservations: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  averagePerDay: number;
  busiestDay?: string;
  busiestHour?: string;
  topDesigner?: { name: string; count: number };
  topService?: { name: string; count: number };
  period: string;
}

// 일별 통계
export interface DailyStatistic {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

// 시간대별 통계
export interface HourlyStatistic {
  hour: string;
  count: number;
}

// 디자이너별 통계
export interface DesignerStatistic {
  designerId: string;
  designerName: string;
  total: number;
  completed: number;
  completionRate: number;
}
