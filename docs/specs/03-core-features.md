# Phase 3: 핵심 기능

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/03-core-features` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 3-4일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/03-core-features
```

---

## 목표

기존 웹 프로젝트의 핵심 기능을 Tauri 앱으로 마이그레이션

## 산출물

- 예약 관리 (CRUD + 상태 관리)
- 디자이너 관리
- 영업시간 관리
- 고객 관리
- 기존 컴포넌트 마이그레이션

---

## 기존 컴포넌트 마이그레이션 목록

### 복사할 컴포넌트

| 기존 파일 | 신규 위치 | 수정 사항 |
|----------|----------|----------|
| `AppointmentForm.tsx` | `src/components/reservation/AppointmentForm.tsx` | Axios → Tauri invoke |
| `ReservationTable.tsx` | `src/components/reservation/ReservationTable.tsx` | Axios → Tauri invoke |
| `Calendar.tsx` | `src/components/reservation/Calendar.tsx` | 스타일 조정 |
| `SearchFilter.tsx` | `src/components/reservation/SearchFilter.tsx` | 거의 그대로 |
| `DesignerManagement.tsx` | `src/components/designer/DesignerManagement.tsx` | Axios → Tauri invoke |
| `BusinessHours.tsx` | `src/components/business-hours/BusinessHours.tsx` | Axios → Tauri invoke |

### 기존 경로
```
/Users/minam.cho/workspaces/study/sisters-salon-reservation/salon-reservation-client/src/components/
```

---

## API → Tauri invoke 변환 가이드

### 변환 패턴

```typescript
// 기존 (Axios)
import axios from 'axios';

const fetchReservations = async (date: string) => {
  const response = await axios.get(`/api/reservations?date=${date}`);
  return response.data;
};

// 신규 (Tauri invoke)
import { invoke } from '@tauri-apps/api/core';

const fetchReservations = async (date: string) => {
  return invoke<Reservation[]>('get_reservations', { date });
};
```

### 변환 매핑 테이블

| 기존 Axios | Tauri Command | 파라미터 |
|------------|---------------|----------|
| `GET /api/reservations` | `get_reservations` | `{ date?: string }` |
| `POST /api/reservations` | `create_reservation` | `{ data: CreateReservationInput }` |
| `PUT /api/reservations/:id` | `update_reservation` | `{ id: string, data: ... }` |
| `DELETE /api/reservations/:id` | `delete_reservation` | `{ id: string }` |
| `PATCH /api/reservations/:id/status` | `update_reservation_status` | `{ id: string, status: string }` |
| `GET /api/designers` | `get_designers` | - |
| `GET /api/designers/active` | `get_active_designers` | - |
| `POST /api/designers` | `create_designer` | `{ data: ... }` |
| `PUT /api/designers/:id` | `update_designer` | `{ id: string, data: ... }` |
| `DELETE /api/designers/:id` | `delete_designer` | `{ id: string }` |
| `GET /api/business-hours` | `get_business_hours` | - |
| `PUT /api/business-hours` | `update_business_hours` | `{ data: BusinessHours[] }` |

---

## 예약 관리 구현

### src/components/reservation/AppointmentForm.tsx

```tsx
import { useState, useEffect } from 'react';
import { reservationApi, designerApi } from '../../lib/tauri';
import type { Reservation, Designer, CreateReservationInput } from '../../types';

interface AppointmentFormProps {
  reservation?: Reservation;
  onSubmit: (reservation: Reservation) => void;
  onCancel: () => void;
}

export function AppointmentForm({ reservation, onSubmit, onCancel }: AppointmentFormProps) {
  const [formData, setFormData] = useState<CreateReservationInput>({
    customerName: reservation?.customerName || '',
    customerPhone: reservation?.customerPhone || '',
    date: reservation?.date || '',
    time: reservation?.time || '',
    designerId: reservation?.designerId || '',
    serviceType: reservation?.serviceType || '',
    notes: reservation?.notes || '',
  });
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDesigners();
  }, []);

  const loadDesigners = async () => {
    try {
      const data = await designerApi.getActive();
      setDesigners(data);
    } catch (error) {
      console.error('Failed to load designers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result: Reservation;
      if (reservation) {
        result = await reservationApi.update(reservation.id, formData);
      } else {
        result = await reservationApi.create(formData);
      }
      onSubmit(result);
    } catch (error) {
      console.error('Failed to save reservation:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceTypes = ['Haircut', 'Coloring', 'Styling', 'Treatment'];

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4">
      <h2 className="text-xl font-bold">
        {reservation ? '예약 수정' : '새 예약'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객명 *</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">연락처</label>
          <input
            type="tel"
            value={formData.customerPhone || ''}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">날짜 *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">시간 *</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">디자이너</label>
          <select
            value={formData.designerId || ''}
            onChange={(e) => setFormData({ ...formData, designerId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          >
            <option value="">선택</option>
            {designers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">서비스</label>
          <select
            value={formData.serviceType || ''}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          >
            <option value="">선택</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">메모</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:opacity-80"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
```

### src/components/reservation/ReservationTable.tsx

```tsx
import { useState } from 'react';
import { reservationApi } from '../../lib/tauri';
import type { Reservation, ReservationStatus } from '../../types';

interface ReservationTableProps {
  reservations: Reservation[];
  onEdit: (reservation: Reservation) => void;
  onRefresh: () => void;
}

const statusColors: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-red-100 text-red-800',
};

const statusLabels: Record<ReservationStatus, string> = {
  pending: '대기',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
  no_show: '노쇼',
};

export function ReservationTable({ reservations, onEdit, onRefresh }: ReservationTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

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
      <div className="glass-card text-center py-8 text-gray-500">
        예약이 없습니다
      </div>
    );
  }

  return (
    <div className="glass-card overflow-x-auto">
      {/* Desktop 테이블 */}
      <table className="hidden lg:table w-full">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left p-3">날짜</th>
            <th className="text-left p-3">시간</th>
            <th className="text-left p-3">고객</th>
            <th className="text-left p-3">디자이너</th>
            <th className="text-left p-3">서비스</th>
            <th className="text-left p-3">상태</th>
            <th className="text-right p-3">액션</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id} className="border-b border-white/10 hover:bg-white/10">
              <td className="p-3">{r.date}</td>
              <td className="p-3">{r.time}</td>
              <td className="p-3">{r.customerName}</td>
              <td className="p-3">{r.designerId || '-'}</td>
              <td className="p-3">{r.serviceType || '-'}</td>
              <td className="p-3">
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value as ReservationStatus)}
                  disabled={loading === r.id}
                  className={`px-2 py-1 rounded text-sm ${statusColors[r.status as ReservationStatus]}`}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="p-3 text-right">
                <button
                  onClick={() => onEdit(r)}
                  className="text-blue-600 hover:text-blue-800 mr-2"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={loading === r.id}
                  className="text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile 카드 리스트 */}
      <div className="lg:hidden space-y-3">
        {reservations.map((r) => (
          <div key={r.id} className="p-4 bg-white/10 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{r.customerName}</p>
                <p className="text-sm text-gray-500">{r.date} {r.time}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${statusColors[r.status as ReservationStatus]}`}>
                {statusLabels[r.status as ReservationStatus]}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {r.serviceType && <span>{r.serviceType}</span>}
              {r.designerId && <span> · {r.designerId}</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(r)}
                className="flex-1 py-1 text-sm bg-blue-100 text-blue-800 rounded"
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="flex-1 py-1 text-sm bg-red-100 text-red-800 rounded"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 디자이너 관리 구현

### src/components/designer/DesignerManagement.tsx

```tsx
import { useState, useEffect } from 'react';
import { designerApi } from '../../lib/tauri';
import type { Designer } from '../../types';

export function DesignerManagement() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', specialty: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDesigners();
  }, []);

  const loadDesigners = async () => {
    try {
      const data = await designerApi.getAll();
      setDesigners(data);
    } catch (error) {
      console.error('Failed to load designers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await designerApi.update(editingId, formData);
      } else {
        await designerApi.create({ ...formData, isActive: true });
      }
      setFormData({ name: '', specialty: '' });
      setEditingId(null);
      loadDesigners();
    } catch (error) {
      console.error('Failed to save designer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (designer: Designer) => {
    setEditingId(designer.id);
    setFormData({ name: designer.name, specialty: designer.specialty || '' });
  };

  const handleToggleActive = async (designer: Designer) => {
    try {
      await designerApi.update(designer.id, { isActive: !designer.isActive });
      loadDesigners();
    } catch (error) {
      console.error('Failed to toggle active:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await designerApi.delete(id);
      loadDesigners();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">디자이너 관리</h1>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="glass-card">
        <h2 className="text-lg font-medium mb-4">
          {editingId ? '디자이너 수정' : '새 디자이너'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="이름"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
            required
          />
          <input
            type="text"
            placeholder="전문분야"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            className="px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {loading ? '저장 중...' : editingId ? '수정' : '추가'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', specialty: '' });
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 목록 */}
      <div className="glass-card">
        <h2 className="text-lg font-medium mb-4">디자이너 목록</h2>
        <div className="space-y-2">
          {designers.map((d) => (
            <div
              key={d.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                d.isActive ? 'bg-white/10' : 'bg-gray-200/50 dark:bg-gray-800/50'
              }`}
            >
              <div>
                <p className={`font-medium ${!d.isActive && 'text-gray-500'}`}>
                  {d.name}
                </p>
                {d.specialty && (
                  <p className="text-sm text-gray-500">{d.specialty}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(d)}
                  className={`px-2 py-1 text-xs rounded ${
                    d.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {d.isActive ? '활성' : '비활성'}
                </button>
                <button
                  onClick={() => handleEdit(d)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 커밋 메시지 가이드

```bash
# 예약 폼
git commit -m "feat(reservation): AppointmentForm 컴포넌트 마이그레이션"

# 예약 테이블
git commit -m "feat(reservation): ReservationTable 컴포넌트 마이그레이션"

# 디자이너 관리
git commit -m "feat(designer): DesignerManagement 컴포넌트 구현"

# 영업시간 관리
git commit -m "feat(business-hours): BusinessHours 컴포넌트 구현"

# 캘린더
git commit -m "feat(reservation): Calendar 컴포넌트 마이그레이션"
```

---

## 완료 기준 체크리스트

- [ ] 예약 생성/조회/수정/삭제 동작
- [ ] 예약 상태 변경 동작
- [ ] 디자이너 CRUD 동작
- [ ] 영업시간 조회/수정 동작
- [ ] 캘린더 예약 현황 표시
- [ ] 검색/필터 동작
- [ ] Desktop/Mobile 레이아웃 확인

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. 모든 CRUD 작업 정상 동작
3. 데이터 저장 및 불러오기 정상
4. 콘솔 에러 없음

```bash
# 머지 절차
git checkout develop
git merge --squash task/03-core-features
git commit -m "feat: Phase 3 - 핵심 기능 구현 완료

- 예약 관리 (CRUD + 상태 관리)
- 디자이너 관리
- 영업시간 관리
- 기존 컴포넌트 마이그레이션

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
git branch -d task/03-core-features
```

---

## 다음 단계

Phase 4: [반응형 UI](./04-responsive-ui.md)로 진행
