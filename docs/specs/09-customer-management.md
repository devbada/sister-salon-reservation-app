# Phase 9: 고객 관리

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/09-customer-management` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 2-3일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/09-customer-management
```

---

## 목표

고객 정보를 독립적으로 관리하고, 예약 시 기존 고객을 검색/선택하여 자동 완성할 수 있는 기능을 구현합니다.

## 산출물

- 고객 CRUD Tauri 커맨드 (Rust)
- 고객 검색 API (전화번호/이름 자동완성)
- 고객 관리 UI 컴포넌트
- 예약 폼에서 고객 검색/선택 기능
- 고객별 예약 이력 조회

---

## 기존 웹 프로젝트 분석 결과

### 데이터베이스 스키마 (웹 프로젝트)

```sql
-- 고객 테이블
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    birthdate DATE,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    preferred_stylist TEXT,
    preferred_service TEXT,
    allergies TEXT,
    vip_status BOOLEAN DEFAULT 0,
    vip_level INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    last_visit_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 고객 노트 테이블
CREATE TABLE customer_notes (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_important BOOLEAN DEFAULT 0,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
```

### 웹 프로젝트 주요 기능

1. **고객 검색 자동완성**
   - 이름 또는 전화번호로 검색
   - 300ms 디바운스
   - 최대 10개 결과 표시
   - 키보드 네비게이션 지원

2. **고객 정보 자동 완성**
   - 기존 고객 선택 시 이름/전화번호 자동 입력
   - 중복 고객 방지 (전화번호 UNIQUE)

3. **고객 관리 UI**
   - 고객 목록 (테이블/카드 뷰)
   - 검색/필터 기능
   - VIP 고객 관리
   - 생일 알림 표시

4. **예약 이력 조회**
   - 고객별 완료된 예약 이력
   - 총 방문 횟수 자동 계산

---

## 현재 앱 프로젝트 상태

### 존재하는 것 ✅

| 항목 | 위치 | 상태 |
|------|------|------|
| DB 스키마 | `src-tauri/src/db/schema.rs` | 기본 필드만 정의됨 |
| TypeScript 타입 | `src/types/index.ts` | Customer 인터페이스 존재 |

### 누락된 것 ❌

| 항목 | 예정 위치 |
|------|----------|
| Rust 커맨드 | `src-tauri/src/commands/customers.rs` |
| API 래퍼 | `src/lib/tauri.ts` (customerApi) |
| UI 컴포넌트 | `src/components/customer/` |
| 예약폼 통합 | `src/components/reservation/AppointmentForm.tsx` |

---

## 구현 내용

### 1. 데이터베이스 스키마 확장

현재 스키마를 확장하여 더 많은 고객 정보를 저장합니다.

#### src-tauri/src/db/schema.rs (수정)
```sql
-- 기존 customers 테이블 확장
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    birthdate TEXT,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    preferred_designer_id TEXT REFERENCES designers(id),
    preferred_service TEXT,
    allergies TEXT,
    total_visits INTEGER DEFAULT 0,
    last_visit_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
```

### 2. Rust 커맨드

#### src-tauri/src/commands/customers.rs
```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub birthdate: Option<String>,
    pub gender: Option<String>,
    pub preferred_designer_id: Option<String>,
    pub preferred_service: Option<String>,
    pub allergies: Option<String>,
    pub total_visits: i32,
    pub last_visit_date: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCustomerInput {
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub birthdate: Option<String>,
    pub gender: Option<String>,
    pub preferred_designer_id: Option<String>,
    pub preferred_service: Option<String>,
    pub allergies: Option<String>,
    pub notes: Option<String>,
}

#[tauri::command]
pub fn get_customers(db: State<DbState>) -> Result<Vec<Customer>, String>;

#[tauri::command]
pub fn get_customer(id: String, db: State<DbState>) -> Result<Customer, String>;

#[tauri::command]
pub fn create_customer(data: CreateCustomerInput, db: State<DbState>) -> Result<Customer, String>;

#[tauri::command]
pub fn update_customer(id: String, data: CreateCustomerInput, db: State<DbState>) -> Result<Customer, String>;

#[tauri::command]
pub fn delete_customer(id: String, db: State<DbState>) -> Result<(), String>;

#[tauri::command]
pub fn search_customers(query: String, db: State<DbState>) -> Result<Vec<Customer>, String>;

#[tauri::command]
pub fn get_customer_by_phone(phone: String, db: State<DbState>) -> Result<Option<Customer>, String>;

#[tauri::command]
pub fn get_customer_reservations(customer_id: String, db: State<DbState>) -> Result<Vec<Reservation>, String>;
```

### 3. Frontend API 래퍼

#### src/lib/tauri.ts (추가)
```typescript
// 고객 관리
export const customerApi = {
  getAll: () => invoke<Customer[]>('get_customers'),
  getById: (id: string) => invoke<Customer>('get_customer', { id }),
  create: (data: CreateCustomerInput) => invoke<Customer>('create_customer', { data }),
  update: (id: string, data: CreateCustomerInput) => invoke<Customer>('update_customer', { id, data }),
  delete: (id: string) => invoke<void>('delete_customer', { id }),
  search: (query: string) => invoke<Customer[]>('search_customers', { query }),
  getByPhone: (phone: string) => invoke<Customer | null>('get_customer_by_phone', { phone }),
  getReservations: (customerId: string) => invoke<Reservation[]>('get_customer_reservations', { customerId }),
};
```

### 4. TypeScript 타입 확장

#### src/types/index.ts (수정)
```typescript
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
```

### 5. UI 컴포넌트

#### src/components/customer/CustomerManagement.tsx
- 고객 목록 테이블/카드 뷰
- 검색 및 필터 기능
- 고객 추가/수정/삭제 기능
- 반응형 레이아웃 (모바일/태블릿/데스크탑)

#### src/components/customer/CustomerForm.tsx
- 고객 정보 입력 폼
- 모달 형태
- 유효성 검사

#### src/components/customer/CustomerSearch.tsx
- 자동완성 검색 컴포넌트
- 디바운스 적용 (300ms)
- 키보드 네비게이션
- 예약 폼에서 재사용

#### src/components/customer/CustomerProfile.tsx
- 고객 상세 정보 표시
- 예약 이력 조회
- 알레르기/특이사항 표시

### 6. 예약 폼 통합

#### src/components/reservation/AppointmentForm.tsx (수정)
- CustomerSearch 컴포넌트 추가
- 기존 고객 선택 시 정보 자동 완성
- 신규 고객 자동 등록 옵션

---

## 커밋 메시지 가이드

```bash
# 데이터베이스 스키마
git commit -m "feat(db): 고객 테이블 스키마 확장

- birthdate, gender, preferred_designer_id 필드 추가
- total_visits, last_visit_date 필드 추가
- allergies 필드 추가

Co-Authored-By: Claude <noreply@anthropic.com>"

# Rust 커맨드
git commit -m "feat(customer): 고객 관리 Tauri 커맨드 구현

- get_customers, get_customer, create_customer
- update_customer, delete_customer
- search_customers (이름/전화번호 검색)
- get_customer_by_phone, get_customer_reservations

Co-Authored-By: Claude <noreply@anthropic.com>"

# 고객 관리 UI
git commit -m "feat(customer): 고객 관리 UI 컴포넌트 구현

- CustomerManagement (목록/검색)
- CustomerForm (추가/수정 모달)
- CustomerSearch (자동완성)
- CustomerProfile (상세 정보)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 예약 폼 통합
git commit -m "feat(reservation): 예약 폼에 고객 검색 기능 통합

- CustomerSearch 컴포넌트 연동
- 기존 고객 선택 시 자동 완성
- 신규 고객 자동 등록

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 완료 기준 체크리스트

### Backend (Rust)
- [ ] customers 테이블 스키마 확장
- [ ] get_customers 커맨드
- [ ] get_customer 커맨드
- [ ] create_customer 커맨드
- [ ] update_customer 커맨드
- [ ] delete_customer 커맨드
- [ ] search_customers 커맨드 (이름/전화번호)
- [ ] get_customer_by_phone 커맨드
- [ ] get_customer_reservations 커맨드

### Frontend
- [ ] Customer 타입 확장
- [ ] customerApi 래퍼 추가
- [ ] CustomerManagement 컴포넌트
- [ ] CustomerForm 컴포넌트
- [ ] CustomerSearch 컴포넌트 (자동완성)
- [ ] CustomerProfile 컴포넌트
- [ ] AppointmentForm 고객 검색 통합

### UI/UX
- [ ] 반응형 레이아웃 (모바일/태블릿/데스크탑)
- [ ] 검색 디바운스 (300ms)
- [ ] 키보드 네비게이션
- [ ] 로딩/에러 상태 표시
- [ ] 중복 전화번호 검사

### 네비게이션
- [ ] 사이드바/탭에 "고객" 메뉴 추가
- [ ] App.tsx에 CustomerManagement 라우팅

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. TypeScript 빌드 성공 (`npm run build`)
3. Rust 빌드 성공 (`cargo check`)
4. 고객 CRUD 동작 확인
5. 예약 폼에서 고객 검색/자동완성 동작 확인
6. 반응형 UI 테스트 완료

```bash
# 머지 절차
git checkout develop
git merge --squash task/09-customer-management
git commit -m "feat: Phase 9 - 고객 관리 기능 완료

- 고객 CRUD (Rust 커맨드)
- 고객 검색/자동완성
- 고객 관리 UI 컴포넌트
- 예약 폼 통합
- 고객별 예약 이력

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
git branch -d task/09-customer-management
```

---

## 다음 단계

Phase 7: [앱 잠금](./07-app-lock.md)으로 진행
