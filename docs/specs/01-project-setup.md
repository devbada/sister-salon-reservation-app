# Phase 1: 프로젝트 초기화

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/01-project-setup` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 1-2일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/01-project-setup
```

---

## 목표

Tauri 2.0 기반 크로스 플랫폼 프로젝트의 기본 구조를 설정합니다.

## 산출물

- Tauri + React + TypeScript + Vite 프로젝트
- Tailwind CSS 설정 (반응형 브레이크포인트 포함)
- iOS/Android 타겟 초기화
- 프로젝트 폴더 구조

---

## 사전 요구사항

### 필수 설치

| 도구 | 버전 | 설치 확인 |
|------|------|----------|
| Node.js | 18.x 이상 | `node --version` |
| npm | 9.x 이상 | `npm --version` |
| Rust | 1.75 이상 | `rustc --version` |
| Cargo | 1.75 이상 | `cargo --version` |

### 플랫폼별 추가 요구사항

#### macOS
```bash
# Xcode Command Line Tools
xcode-select --install

# Xcode (iOS 빌드용)
# App Store에서 설치
```

#### Windows
```bash
# Visual Studio Build Tools
# C++ build tools 포함 설치
```

#### iOS 개발
```bash
# CocoaPods
sudo gem install cocoapods

# iOS 시뮬레이터
xcode-select --install
```

#### Android 개발
```bash
# Android Studio 설치
# SDK, NDK, Platform Tools 설정
# 환경변수: ANDROID_HOME, JAVA_HOME
```

---

## 설정 절차

### 1. Tauri 프로젝트 생성

```bash
# Tauri + React + TypeScript 템플릿으로 생성
npm create tauri-app@latest sisters-salon-reservation-app -- --template react-ts

# 프로젝트 디렉토리로 이동
cd sisters-salon-reservation-app

# 의존성 설치
npm install
```

### 2. 추가 의존성 설치

```bash
# Frontend 의존성
npm install recharts react-calendar date-fns clsx

# 개발 의존성
npm install -D tailwindcss postcss autoprefixer @types/node
```

### 3. Tailwind CSS 설정

```bash
# Tailwind 초기화
npx tailwindcss init -p
```

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '375px',    // iPhone SE
        'sm': '640px',    // 태블릿 세로
        'md': '768px',    // 태블릿 가로
        'lg': '1024px',   // 데스크탑
        'xl': '1280px',   // 대형 모니터
        '2xl': '1536px',  // 초대형 모니터
      },
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.25)',
          dark: 'rgba(0, 0, 0, 0.25)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
```

#### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 79 70 229;    /* indigo-600 */
    --color-secondary: 99 102 241; /* indigo-500 */
  }

  .dark {
    --color-primary: 129 140 248;  /* indigo-400 */
    --color-secondary: 165 180 252; /* indigo-300 */
  }
}

@layer components {
  .glass {
    @apply bg-white/25 dark:bg-black/25 backdrop-blur-md;
    @apply border border-white/20 dark:border-white/10;
    @apply rounded-xl shadow-lg;
  }

  .glass-card {
    @apply glass p-4 sm:p-6;
  }
}
```

### 4. iOS/Android 타겟 초기화

```bash
# iOS 초기화 (macOS에서만)
npm run tauri ios init

# Android 초기화
npm run tauri android init
```

### 5. Cargo.toml 의존성 추가

#### src-tauri/Cargo.toml
```toml
[package]
name = "sisters-salon-reservation-app"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
# Core
tauri = { version = "2.0", features = [] }
tauri-plugin-shell = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
tokio = { version = "1.0", features = ["full"] }
uuid = { version = "1.0", features = ["v4", "serde"] }

# Database
rusqlite = { version = "0.31", features = ["bundled"] }

# Excel Export
rust_xlsxwriter = "0.79"

# Security
keyring = "3.0"
bcrypt = "0.15"

[target.'cfg(target_os = "macos")'.dependencies]
objc = "0.2"

[target.'cfg(target_os = "windows")'.dependencies]
windows = { version = "0.52", features = ["Security_Credentials_UI"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

### 6. 폴더 구조 생성

```bash
# Frontend 폴더 구조
mkdir -p src/components/{layout,navigation,reservation,designer,business-hours,statistics,settings}
mkdir -p src/contexts
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/styles

# Tauri 폴더 구조
mkdir -p src-tauri/src/{commands,db,services}
```

#### 최종 폴더 구조
```
sisters-salon-reservation-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DesktopLayout.tsx
│   │   │   ├── TabletLayout.tsx
│   │   │   ├── MobileLayout.tsx
│   │   │   └── ResponsiveContainer.tsx
│   │   ├── navigation/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomTabs.tsx
│   │   │   └── CollapsibleSidebar.tsx
│   │   ├── reservation/
│   │   ├── designer/
│   │   ├── business-hours/
│   │   ├── statistics/
│   │   └── settings/
│   ├── contexts/
│   │   └── AppContext.tsx
│   ├── hooks/
│   │   ├── useDeviceType.ts
│   │   ├── useResponsive.ts
│   │   └── useDatabase.ts
│   ├── lib/
│   │   └── tauri.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── glass.css
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── reservations.rs
│   │   │   ├── designers.rs
│   │   │   ├── business_hours.rs
│   │   │   ├── statistics.rs
│   │   │   ├── export.rs
│   │   │   ├── backup.rs
│   │   │   └── security.rs
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   └── schema.rs
│   │   ├── services/
│   │   │   ├── mod.rs
│   │   │   ├── excel.rs
│   │   │   ├── cloud.rs
│   │   │   └── auth.rs
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── gen/
│   │   ├── android/
│   │   └── apple/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── CLAUDE.md
```

### 7. 기본 파일 생성

#### src/types/index.ts
```typescript
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

// 고객
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
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
```

#### src/lib/tauri.ts
```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Reservation, Designer, BusinessHours, Customer, BackupInfo, ExportPeriod, CloudService } from '../types';

// 예약 관리
export const reservationApi = {
  getAll: (date?: string) => invoke<Reservation[]>('get_reservations', { date }),
  getById: (id: string) => invoke<Reservation>('get_reservation', { id }),
  create: (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>) =>
    invoke<Reservation>('create_reservation', { data }),
  update: (id: string, data: Partial<Reservation>) =>
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
};
```

#### src/hooks/useDeviceType.ts
```typescript
import { useState, useEffect } from 'react';
import type { DeviceType } from '../types';

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.mobile) {
        setDeviceType('mobile');
      } else if (width < BREAKPOINTS.tablet) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return deviceType;
}
```

---

## 커밋 메시지 가이드

```bash
# 프로젝트 생성
git commit -m "chore(setup): Tauri 프로젝트 초기 생성"

# Tailwind 설정
git commit -m "feat(setup): Tailwind CSS 반응형 설정 추가"

# 폴더 구조
git commit -m "chore(setup): 프로젝트 폴더 구조 생성"

# 타입 정의
git commit -m "feat(setup): TypeScript 타입 정의 추가"

# Tauri API 래퍼
git commit -m "feat(setup): Tauri API 래퍼 함수 추가"

# 모바일 타겟
git commit -m "feat(setup): iOS/Android 타겟 초기화"
```

---

## 완료 기준 체크리스트

- [ ] `npm run tauri dev` 로 Desktop 앱 실행 가능
- [ ] `npm run tauri ios dev` 로 iOS 시뮬레이터 실행 가능 (macOS)
- [ ] `npm run tauri android dev` 로 Android 에뮬레이터 실행 가능
- [ ] Tailwind CSS 스타일 적용 확인
- [ ] 반응형 브레이크포인트 동작 확인
- [ ] 폴더 구조 완성
- [ ] 타입 정의 파일 생성
- [ ] Tauri API 래퍼 파일 생성

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. Desktop, iOS, Android 모두 빌드 성공
3. 콘솔 에러 없음
4. 코드 리뷰 완료

```bash
# 머지 절차
git checkout develop
git merge --squash task/01-project-setup
git commit -m "feat: Phase 1 - 프로젝트 초기화 완료

- Tauri 2.0 + React + TypeScript + Vite 설정
- Tailwind CSS 반응형 브레이크포인트 설정
- iOS/Android 타겟 초기화
- 프로젝트 폴더 구조 생성
- TypeScript 타입 정의
- Tauri API 래퍼 함수

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
git branch -d task/01-project-setup
```

---

## 다음 단계

Phase 2: [데이터베이스](./02-database.md)로 진행
