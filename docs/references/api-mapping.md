# API 매핑 가이드

기존 Express.js API를 Tauri Commands로 변환하는 매핑 참고 문서입니다.

---

## 개요

| 구분 | 기존 (Web) | 변환 (Tauri) |
|------|-----------|-------------|
| 통신 방식 | HTTP REST API | IPC (invoke) |
| 서버 | Express.js | Rust Commands |
| 데이터베이스 | MongoDB | SQLite |
| 인증 | JWT | 없음 (로컬 전용) |

---

## 예약 API 매핑

### 기존 Express.js API

```javascript
// routes/appointments.js

// GET /api/appointments
router.get('/', async (req, res) => {
  const { date } = req.query;
  const appointments = await Appointment.find({ date });
  res.json(appointments);
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  res.json(appointment);
});

// POST /api/appointments
router.post('/', async (req, res) => {
  const appointment = new Appointment(req.body);
  await appointment.save();
  res.json(appointment);
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(appointment);
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  res.json(appointment);
});
```

### 변환된 Tauri Commands

```rust
// src-tauri/src/commands/reservations.rs

#[tauri::command]
pub async fn get_reservations(
    db: State<'_, Database>,
    date: Option<String>,
) -> Result<Vec<Reservation>, String> {
    db.get_reservations(date.as_deref())
}

#[tauri::command]
pub async fn get_reservation(
    db: State<'_, Database>,
    id: String,
) -> Result<Reservation, String> {
    db.get_reservation_by_id(&id)
}

#[tauri::command]
pub async fn create_reservation(
    db: State<'_, Database>,
    data: CreateReservationData,
) -> Result<Reservation, String> {
    db.create_reservation(data)
}

#[tauri::command]
pub async fn update_reservation(
    db: State<'_, Database>,
    id: String,
    data: UpdateReservationData,
) -> Result<Reservation, String> {
    db.update_reservation(&id, data)
}

#[tauri::command]
pub async fn delete_reservation(
    db: State<'_, Database>,
    id: String,
) -> Result<(), String> {
    db.delete_reservation(&id)
}

#[tauri::command]
pub async fn update_reservation_status(
    db: State<'_, Database>,
    id: String,
    status: String,
) -> Result<Reservation, String> {
    db.update_reservation_status(&id, &status)
}
```

### Frontend 호출 변환

```typescript
// 기존: fetch API
const response = await fetch('/api/appointments?date=2024-01-15');
const appointments = await response.json();

// 변환: Tauri invoke
import { invoke } from '@tauri-apps/api/core';
const appointments = await invoke<Reservation[]>('get_reservations', { date: '2024-01-15' });
```

---

## 디자이너 API 매핑

### 기존 Express.js API

```javascript
// routes/designers.js

// GET /api/designers
router.get('/', async (req, res) => {
  const designers = await Designer.find();
  res.json(designers);
});

// GET /api/designers/active
router.get('/active', async (req, res) => {
  const designers = await Designer.find({ isActive: true });
  res.json(designers);
});

// POST /api/designers
router.post('/', async (req, res) => {
  const designer = new Designer(req.body);
  await designer.save();
  res.json(designer);
});

// PUT /api/designers/:id
router.put('/:id', async (req, res) => {
  const designer = await Designer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(designer);
});

// DELETE /api/designers/:id
router.delete('/:id', async (req, res) => {
  await Designer.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
```

### 변환된 Tauri Commands

```rust
// src-tauri/src/commands/designers.rs

#[tauri::command]
pub async fn get_designers(db: State<'_, Database>) -> Result<Vec<Designer>, String> {
    db.get_all_designers()
}

#[tauri::command]
pub async fn get_active_designers(db: State<'_, Database>) -> Result<Vec<Designer>, String> {
    db.get_active_designers()
}

#[tauri::command]
pub async fn create_designer(
    db: State<'_, Database>,
    data: CreateDesignerData,
) -> Result<Designer, String> {
    db.create_designer(data)
}

#[tauri::command]
pub async fn update_designer(
    db: State<'_, Database>,
    id: String,
    data: UpdateDesignerData,
) -> Result<Designer, String> {
    db.update_designer(&id, data)
}

#[tauri::command]
pub async fn delete_designer(
    db: State<'_, Database>,
    id: String,
) -> Result<(), String> {
    db.delete_designer(&id)
}
```

---

## 영업시간 API 매핑

### 기존 Express.js API

```javascript
// routes/business-hours.js

// GET /api/business-hours
router.get('/', async (req, res) => {
  const hours = await BusinessHours.find().sort({ dayOfWeek: 1 });
  res.json(hours);
});

// PUT /api/business-hours
router.put('/', async (req, res) => {
  const { hours } = req.body;
  for (const hour of hours) {
    await BusinessHours.findOneAndUpdate(
      { dayOfWeek: hour.dayOfWeek },
      hour,
      { upsert: true }
    );
  }
  res.json({ success: true });
});
```

### 변환된 Tauri Commands

```rust
// src-tauri/src/commands/business_hours.rs

#[tauri::command]
pub async fn get_business_hours(db: State<'_, Database>) -> Result<Vec<BusinessHours>, String> {
    db.get_business_hours()
}

#[tauri::command]
pub async fn update_business_hours(
    db: State<'_, Database>,
    data: Vec<BusinessHours>,
) -> Result<(), String> {
    db.update_business_hours(data)
}
```

---

## 통계 API 매핑

### 기존 Express.js API

```javascript
// routes/statistics.js

// GET /api/statistics/summary
router.get('/summary', async (req, res) => {
  const { period } = req.query;
  const stats = await calculateSummary(period);
  res.json(stats);
});

// GET /api/statistics/daily
router.get('/daily', async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await getDailyStats(startDate, endDate);
  res.json(stats);
});
```

### 변환된 Tauri Commands

```rust
// src-tauri/src/commands/statistics.rs

#[tauri::command]
pub async fn get_statistics_summary(
    db: State<'_, Database>,
    period: String,
) -> Result<StatisticsSummary, String> {
    db.get_statistics_summary(&period)
}

#[tauri::command]
pub async fn get_daily_statistics(
    db: State<'_, Database>,
    start_date: String,
    end_date: String,
) -> Result<Vec<DailyStatistics>, String> {
    db.get_daily_statistics(&start_date, &end_date)
}
```

---

## Frontend API Wrapper

### 기존 코드 (fetch 기반)

```typescript
// services/api.ts

const API_BASE = '/api';

export const appointmentApi = {
  getAll: async (date?: string) => {
    const url = date ? `${API_BASE}/appointments?date=${date}` : `${API_BASE}/appointments`;
    const res = await fetch(url);
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/appointments/${id}`);
    return res.json();
  },

  create: async (data: CreateAppointmentData) => {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: UpdateAppointmentData) => {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string) => {
    await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
  },

  updateStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
};
```

### 변환된 코드 (Tauri invoke 기반)

```typescript
// lib/tauri.ts

import { invoke } from '@tauri-apps/api/core';
import type { Reservation, Designer, BusinessHours } from '../types';

export const reservationApi = {
  getAll: (date?: string) =>
    invoke<Reservation[]>('get_reservations', { date }),

  getById: (id: string) =>
    invoke<Reservation>('get_reservation', { id }),

  create: (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>) =>
    invoke<Reservation>('create_reservation', { data }),

  update: (id: string, data: Partial<Reservation>) =>
    invoke<Reservation>('update_reservation', { id, data }),

  delete: (id: string) =>
    invoke<void>('delete_reservation', { id }),

  updateStatus: (id: string, status: Reservation['status']) =>
    invoke<Reservation>('update_reservation_status', { id, status }),
};

export const designerApi = {
  getAll: () =>
    invoke<Designer[]>('get_designers'),

  getActive: () =>
    invoke<Designer[]>('get_active_designers'),

  create: (data: Omit<Designer, 'id' | 'createdAt' | 'updatedAt'>) =>
    invoke<Designer>('create_designer', { data }),

  update: (id: string, data: Partial<Designer>) =>
    invoke<Designer>('update_designer', { id, data }),

  delete: (id: string) =>
    invoke<void>('delete_designer', { id }),
};

export const businessHoursApi = {
  getAll: () =>
    invoke<BusinessHours[]>('get_business_hours'),

  update: (data: BusinessHours[]) =>
    invoke<void>('update_business_hours', { data }),
};

export const statisticsApi = {
  getSummary: (period: string) =>
    invoke<StatisticsSummary>('get_statistics_summary', { period }),

  getDaily: (startDate: string, endDate: string) =>
    invoke<DailyStatistics[]>('get_daily_statistics', { startDate, endDate }),
};
```

---

## 데이터 타입 매핑

### MongoDB Document → SQLite Row

```typescript
// 기존 MongoDB 스키마
const appointmentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: String,
  date: { type: String, required: true },
  time: { type: String, required: true },
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer' },
  serviceType: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  notes: String,
}, { timestamps: true });
```

```sql
-- 변환된 SQLite 스키마
CREATE TABLE reservations (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    designer_id TEXT REFERENCES designers(id),
    service_type TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### TypeScript 타입 변환

```typescript
// 기존 (MongoDB ObjectId 사용)
interface Appointment {
  _id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  time: string;
  designerId?: string;
  serviceType?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 변환 (UUID 사용)
interface Reservation {
  id: string;  // UUID v4
  customerName: string;
  customerPhone?: string;
  date: string;  // ISO 날짜 문자열
  time: string;  // HH:mm 형식
  designerId?: string;
  serviceType?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;  // ISO datetime 문자열
  updatedAt: string;  // ISO datetime 문자열
}
```

---

## 에러 처리 매핑

### 기존 (HTTP 상태 코드)

```javascript
// Express.js 에러 처리
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 변환 (Rust Result)

```rust
// Tauri Command 에러 처리
#[tauri::command]
pub async fn get_reservation(
    db: State<'_, Database>,
    id: String,
) -> Result<Reservation, String> {
    db.get_reservation_by_id(&id)
        .map_err(|e| match e {
            DbError::NotFound => "예약을 찾을 수 없습니다".to_string(),
            DbError::InvalidId => "잘못된 ID 형식입니다".to_string(),
            _ => format!("데이터베이스 오류: {}", e),
        })
}
```

### Frontend 에러 처리

```typescript
// 기존 (fetch)
try {
  const response = await fetch(`/api/appointments/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('예약을 찾을 수 없습니다');
    }
    throw new Error('서버 오류');
  }
  const data = await response.json();
} catch (error) {
  console.error(error);
}

// 변환 (Tauri invoke)
try {
  const data = await invoke<Reservation>('get_reservation', { id });
} catch (error) {
  // error는 Rust에서 반환한 String
  console.error(error); // "예약을 찾을 수 없습니다" 등
}
```

---

## 추가 API (신규)

기존 웹 버전에 없던 새로운 기능들:

### 내보내기 API

```typescript
export const exportApi = {
  toExcel: (period: ExportPeriod, outputPath?: string) =>
    invoke<string>('export_to_excel', { period, outputPath }),

  toCsv: (period: ExportPeriod, outputPath?: string) =>
    invoke<string>('export_to_csv', { period, outputPath }),
};
```

### 백업 API

```typescript
export const backupApi = {
  list: (service: CloudService) =>
    invoke<BackupInfo[]>('list_backups', { service }),

  create: (service: CloudService) =>
    invoke<BackupInfo>('backup_to_cloud', { service }),

  restore: (backupId: string) =>
    invoke<void>('restore_from_backup', { backupId }),
};
```

### 보안 API

```typescript
export const securityApi = {
  setPin: (pin: string) =>
    invoke<void>('set_lock_pin', { pin }),

  verifyPin: (pin: string) =>
    invoke<boolean>('verify_lock_pin', { pin }),

  removePin: () =>
    invoke<void>('remove_lock_pin'),

  authenticateBiometric: () =>
    invoke<boolean>('authenticate_biometric'),

  isLockEnabled: () =>
    invoke<boolean>('is_lock_enabled'),

  getSettings: () =>
    invoke<LockSettings>('get_lock_settings'),

  updateSettings: (settings: LockSettings) =>
    invoke<void>('update_lock_settings', { settings }),

  isBiometricAvailable: () =>
    invoke<boolean>('is_biometric_available'),
};
```

---

## 참고 문서

- [Tauri v2 Command Guide](https://tauri.app/develop/calling-rust/)
- [프로젝트 개요](../specs/00-overview.md)
- [데이터베이스 스키마](../specs/02-database.md)
