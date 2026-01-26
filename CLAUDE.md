# CLAUDE.md - AI 어시스턴트 프로젝트 가이드

## 프로젝트 개요

**Sisters Salon Reservation App** - 헤어 살롱 예약 관리 크로스 플랫폼 애플리케이션

기존 웹 애플리케이션을 Tauri 2.0 기반 크로스 플랫폼 앱 (Desktop + Mobile)으로 전환하는 프로젝트입니다.

## 지원 플랫폼

| 플랫폼 | 지원 | 빌드 명령어 |
|--------|------|-------------|
| **macOS** | ✅ | `npm run tauri build -- --target universal-apple-darwin` |
| **Windows** | ✅ | `npm run tauri build -- --target x86_64-pc-windows-msvc` |
| **Linux** | ✅ | `npm run tauri build -- --target x86_64-unknown-linux-gnu` |
| **iOS (iPad/iPhone)** | ✅ | `npm run tauri ios build` |
| **Android (태블릿/폰)** | ✅ | `npm run tauri android build` |

## 기술 스택

### Frontend
- **React 19** + **TypeScript**
- **Tailwind CSS** - 글라스모피즘 UI 디자인 + 반응형
- **Vite** - 빌드 도구
- **Recharts** - 차트/데이터 시각화
- **React Calendar** - 달력 컴포넌트
- **date-fns** - 날짜 처리

### Backend (Tauri)
- **Tauri 2.0** - 크로스 플랫폼 앱 프레임워크 (Desktop + Mobile)
- **Rust** - 백엔드 로직
- **rusqlite** - SQLite 데이터베이스
- **serde** - 직렬화/역직렬화
- **rust_xlsxwriter** - Excel 파일 생성
- **keyring** - OS 보안 저장소 (Keychain/Credential Manager/Keystore)
- **bcrypt** - PIN 해시

## 반응형 UI 설계

### 브레이크포인트
| 디바이스 | 너비 | 레이아웃 |
|----------|------|----------|
| **모바일 (iPhone)** | < 640px | 단일 컬럼, 바텀 탭 네비게이션 |
| **태블릿 (iPad)** | 640-1024px | 2컬럼, 접이식 사이드바 |
| **데스크탑** | > 1024px | 3컬럼, 고정 사이드바 |

### 적응형 컴포넌트
- **네비게이션**: 데스크탑(사이드바) ↔ 모바일(바텀탭)
- **캘린더**: 데스크탑(월간+일간 동시) ↔ 모바일(월간만, 스와이프)
- **예약 테이블**: 데스크탑(전체 컬럼) ↔ 모바일(카드 리스트)
- **통계 대시보드**: 데스크탑(그리드) ↔ 모바일(스크롤)

### Tailwind 반응형 규칙
```css
/* 모바일 우선 설계 (기본 = 모바일) */
sm: (640px+)   /* 태블릿 세로 */
md: (768px+)   /* 태블릿 가로 */
lg: (1024px+)  /* 데스크탑 */
xl: (1280px+)  /* 대형 모니터 */
```

## 프로젝트 구조

```
sisters-salon-reservation-app/
├── src/                    # React 프론트엔드
│   ├── components/         # UI 컴포넌트
│   │   ├── AppointmentForm.tsx
│   │   ├── ReservationTable.tsx
│   │   ├── Calendar.tsx
│   │   ├── DesignerManagement.tsx
│   │   ├── BusinessHours.tsx
│   │   ├── StatisticsDashboard.tsx
│   │   ├── SearchFilter.tsx
│   │   ├── layout/             # 반응형 레이아웃
│   │   │   ├── DesktopLayout.tsx
│   │   │   ├── TabletLayout.tsx
│   │   │   ├── MobileLayout.tsx
│   │   │   └── ResponsiveContainer.tsx
│   │   └── navigation/         # 적응형 네비게이션
│   │       ├── Sidebar.tsx         # 데스크탑용 고정 사이드바
│   │       ├── BottomTabs.tsx      # 모바일용 하단 탭
│   │       └── CollapsibleSidebar.tsx  # 태블릿용 접이식
│   ├── contexts/           # React Context
│   ├── hooks/              # 커스텀 훅
│   │   ├── useDeviceType.ts    # 디바이스 타입 감지
│   │   ├── useResponsive.ts    # 반응형 유틸
│   │   ├── useDatabase.ts      # 데이터베이스 훅
│   │   └── useCloudBackup.ts   # 클라우드 백업 훅
│   ├── lib/                # 유틸리티
│   │   └── tauri.ts        # Tauri API 래퍼
│   ├── types/              # TypeScript 타입 정의
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/              # Tauri 백엔드 (Rust)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/       # Tauri 커맨드 (API 대체)
│   │   │   ├── reservations.rs
│   │   │   ├── designers.rs
│   │   │   ├── business_hours.rs
│   │   │   ├── statistics.rs
│   │   │   ├── export.rs       # Excel 내보내기
│   │   │   ├── backup.rs       # 클라우드 백업
│   │   │   └── security.rs     # 앱 잠금/인증
│   │   ├── db/             # 데이터베이스 모듈
│   │   └── services/       # 비즈니스 로직
│   │       ├── excel.rs        # Excel 생성 로직
│   │       ├── cloud.rs        # iCloud/Google Drive
│   │       └── auth.rs         # PIN/생체인증
│   ├── gen/                # Tauri Mobile 생성 파일
│   │   ├── android/        # Android 프로젝트
│   │   └── apple/          # iOS/macOS 프로젝트
│   ├── Cargo.toml
│   └── tauri.conf.json     # 멀티 플랫폼 설정
├── docs/
│   └── analysis-report.md  # 기존 프로젝트 분석 보고서
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── CLAUDE.md               # 이 파일
```

## 주요 기능

### 1. 예약 관리
- 예약 CRUD (생성/조회/수정/삭제)
- 5단계 상태 관리: 대기 → 확정 → 완료 / 취소 / 노쇼
- 캘린더 기반 예약 현황 시각화
- 고급 검색 및 필터링

### 2. 디자이너 관리
- 디자이너 등록/수정/삭제
- 전문분야, 활성상태 관리

### 3. 영업시간 관리
- 요일별 영업시간 설정
- 특별 영업시간/휴일 관리

### 4. 통계 대시보드
- 예약 통계 및 차트
- 기간별 분석

### 5. 로컬 앱 전용 기능
- 자동 백업
- 데이터 내보내기/가져오기 (JSON, CSV)
- 시스템 알림

### 6. Excel 내보내기 기능
- **라이브러리**: rust_xlsxwriter
- **시트 구성**:
  - 예약목록: 기간 내 전체 예약 데이터
  - 월별통계: 월별 예약 현황 및 매출 추정
  - 디자이너실적: 디자이너별 성과 분석
- **기간 옵션**: 이번 달 / 최근 3개월 / 전체
- **플랫폼별 내보내기**:
  | 플랫폼 | 방식 |
  |--------|------|
  | Desktop | 파일 저장 다이얼로그 |
  | iOS | 공유 시트 (Share Sheet) |
  | Android | Intent로 공유 또는 다운로드 폴더 저장 |

### 7. 클라우드 백업 기능

#### 플랫폼별 클라우드 서비스
| 서비스 | 플랫폼 | 구현 방식 |
|--------|--------|----------|
| **iCloud** | iOS/macOS | NSUbiquitousKeyValueStore / iCloud Drive |
| **Google Drive** | Android/선택적 | Google Drive API + OAuth |

#### iCloud (iOS/macOS)
```
경로: iCloud Drive/SistersSalon/
├── backups/
│   ├── backup_2026-01-21.db
│   └── ...
└── sync_metadata.json
```

#### 백업 설정
- **자동 백업 주기**: 매일 / 매주 / 수동
- **백업 형식**: SQLite 파일 또는 JSON
- **복원 기능**: 백업 목록에서 선택하여 복원

### 8. 앱 잠금 기능

#### 플랫폼별 잠금 방식
| 방식 | iOS | macOS | Windows | Android |
|------|-----|-------|---------|---------|
| **PIN (4-6자리)** | ✅ | ✅ | ✅ | ✅ |
| **Face ID** | ✅ | - | - | - |
| **Touch ID** | ✅ | ✅ | - | - |
| **Windows Hello** | - | - | ✅ | - |
| **지문인식** | - | - | - | ✅ |

#### 플랫폼별 보안 저장소
| 플랫폼 | 저장소 |
|--------|--------|
| iOS | Keychain Services |
| macOS | Keychain |
| Windows | Credential Manager |
| Android | Keystore |

#### 잠금 설정 옵션
- **잠금 사용**: on/off
- **잠금 방식**: PIN / 생체인증 / 둘 다
- **자동 잠금**: 즉시 / 1분 / 5분 / 백그라운드 전환 시
- **실패 처리**: 5회 실패 시 30초 대기, 6회 이상 5분 대기

## 데이터베이스 스키마

```sql
-- 예약
CREATE TABLE reservations (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    designer_id TEXT,
    service_type TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT,
    updated_at TEXT
);

-- 디자이너
CREATE TABLE designers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT
);

-- 영업시간
CREATE TABLE business_hours (
    id INTEGER PRIMARY KEY,
    day_of_week INTEGER NOT NULL,
    open_time TEXT,
    close_time TEXT,
    break_start TEXT,
    break_end TEXT,
    is_closed INTEGER DEFAULT 0
);

-- 휴일
CREATE TABLE holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    description TEXT,
    is_recurring INTEGER DEFAULT 0
);

-- 고객
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TEXT
);
```

## 개발 가이드라인

### 코딩 컨벤션

#### TypeScript
- 모든 컴포넌트는 함수형 + TypeScript
- Props는 인터페이스로 정의
- 명확한 타입 어노테이션 사용

```typescript
interface ReservationProps {
  id: string;
  customerName: string;
  date: string;
  time: string;
  status: ReservationStatus;
}
```

#### React 컴포넌트
- 파일명: PascalCase (예: `ReservationTable.tsx`)
- 훅 사용: `useState`, `useEffect`, `useMemo`, `useCallback`
- Context API로 전역 상태 관리

#### Tailwind CSS
- 글라스모피즘 스타일 유지
- 반응형 클래스 순서: `sm:` → `md:` → `lg:`
- 다크모드 지원: `dark:` 접두사

### Tauri 커맨드 작성

```rust
// src-tauri/src/commands/reservations.rs
#[tauri::command]
pub fn get_reservations(date: Option<String>) -> Result<Vec<Reservation>, String> {
    // 구현
}

#[tauri::command]
pub fn create_reservation(data: CreateReservationInput) -> Result<Reservation, String> {
    // 구현
}

// src-tauri/src/commands/export.rs
#[tauri::command]
pub async fn export_to_excel(
    period: ExportPeriod,  // "this_month" | "last_3_months" | "all"
    output_path: String
) -> Result<String, String> {
    // rust_xlsxwriter로 Excel 파일 생성
}

// src-tauri/src/commands/backup.rs
#[tauri::command]
pub async fn backup_to_cloud(service: CloudService) -> Result<BackupInfo, String>;

#[tauri::command]
pub async fn restore_from_backup(backup_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn list_backups(service: CloudService) -> Result<Vec<BackupInfo>, String>;

// src-tauri/src/commands/security.rs
#[tauri::command]
pub async fn set_lock_pin(pin: String) -> Result<(), String>;

#[tauri::command]
pub async fn verify_lock_pin(pin: String) -> Result<bool, String>;

#[tauri::command]
pub async fn authenticate_biometric() -> Result<bool, String>;

#[tauri::command]
pub async fn set_auto_lock_timeout(minutes: u32) -> Result<(), String>;
```

### Frontend에서 Tauri 호출

```typescript
// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';

// 예약 관리
export async function getReservations(date?: string) {
  return invoke<Reservation[]>('get_reservations', { date });
}

export async function createReservation(data: CreateReservationInput) {
  return invoke<Reservation>('create_reservation', { data });
}

// Excel 내보내기
export async function exportToExcel(period: ExportPeriod, outputPath: string) {
  return invoke<string>('export_to_excel', { period, outputPath });
}

// 클라우드 백업
export async function backupToCloud(service: CloudService) {
  return invoke<BackupInfo>('backup_to_cloud', { service });
}

export async function restoreFromBackup(backupId: string) {
  return invoke<void>('restore_from_backup', { backupId });
}

export async function listBackups(service: CloudService) {
  return invoke<BackupInfo[]>('list_backups', { service });
}

// 앱 잠금
export async function setLockPin(pin: string) {
  return invoke<void>('set_lock_pin', { pin });
}

export async function verifyLockPin(pin: string) {
  return invoke<boolean>('verify_lock_pin', { pin });
}

export async function authenticateBiometric() {
  return invoke<boolean>('authenticate_biometric');
}
```

## 빌드 및 실행

### 개발 모드
```bash
# 의존성 설치
npm install

# Desktop 개발 서버
npm run tauri dev

# iOS 개발 (시뮬레이터)
npm run tauri ios dev

# Android 개발 (에뮬레이터)
npm run tauri android dev
```

### 프로덕션 빌드

#### Desktop
```bash
# macOS (Universal Binary)
npm run tauri build -- --target universal-apple-darwin

# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

#### Mobile
```bash
# iOS (IPA for App Store)
npm run tauri ios build --release

# Android (APK/AAB)
npm run tauri android build --release
```

### 빌드 결과물 위치
```
src-tauri/target/release/bundle/
├── dmg/          # macOS
├── msi/          # Windows
├── deb/          # Linux
├── ios/          # iOS IPA
└── android/      # Android APK/AAB
```

### iOS Xcode 빌드 설정 (nvm 사용자)

nvm을 사용하는 환경에서 Xcode로 iOS 빌드 시, npm/node 경로를 찾지 못하는 문제가 발생할 수 있습니다.

#### 문제 증상
```
error: Build Rust Code: npm: command not found
```

#### 해결 방법

1. Xcode에서 프로젝트 열기 (`src-tauri/gen/apple/`)
2. 프로젝트 네비게이터에서 프로젝트 선택
3. **Build Phases** 탭 선택
4. **Build Rust Code** 스크립트 찾기
5. 스크립트 시작 부분에 다음 코드 추가:

```bash
# nvm 환경 로드
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 또는 직접 PATH 설정 (nvm default 버전 사용 시)
export PATH="$HOME/.nvm/versions/node/$(cat $HOME/.nvm/alias/default)/bin:$PATH"
```

#### 전체 스크립트 예시
```bash
#!/bin/bash
# nvm PATH 설정
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 기존 Tauri 빌드 스크립트
npm run tauri ios build -- --target aarch64-apple-ios
```

> **참고**: Homebrew로 설치한 node를 사용하는 경우에는 이 설정이 필요하지 않습니다.

## 마이그레이션 체크리스트

### Phase 1: 프로젝트 초기화 ✅ (2026-01-21)
- [x] Tauri 2.0 프로젝트 생성 (`npm create tauri-app@latest`)
- [x] React + TypeScript + Vite 설정
- [x] Tailwind CSS v4 설정 (반응형 브레이크포인트 포함)
- [x] 프로젝트 구조 구성
- [x] **Tauri iOS/Android 타겟 설정**
  - [x] `npm run tauri ios init`
  - [x] `npm run tauri android init`

### Phase 2: 데이터베이스 ✅ (2026-01-21)
- [x] rusqlite 설정
- [x] 스키마 생성 (7개 테이블)
- [x] 기본 CRUD 커맨드 구현

### Phase 3: 핵심 기능 ✅ (2026-01-21)
- [x] 기존 컴포넌트 마이그레이션
- [x] Axios → Tauri invoke 변환
- [x] 타입 정의
- [x] 예약 관리 (CRUD + 상태)
- [x] 디자이너 관리
- [x] 영업시간 관리

### Phase 4: 반응형 UI ✅ (2026-01-22)
- [x] **반응형 레이아웃 컴포넌트 생성**
  - [x] ResponsiveContainer.tsx
  - [x] DesktopLayout / TabletLayout / MobileLayout
  - [x] Sidebar / BottomTabs / CollapsibleSidebar
- [x] **반응형 스타일 적용**
  - [x] 모바일 카드 리스트 뷰
  - [x] 태블릿 접이식 사이드바
  - [x] 데스크탑 고정 사이드바
- [x] Safe Area 처리 (iOS/Android)
- [x] iOS 수평 스크롤/바운스 방지
- [x] Android 프로젝트 설정 및 테스트

### Phase 5: 통계 대시보드 (예정)
- [ ] 통계 계산 로직
- [ ] 차트 컴포넌트 (Recharts)
- [ ] 기간별 필터링

### Phase 6: 내보내기 & 백업 (예정)
- [ ] Excel 내보내기 (rust_xlsxwriter)
  - [ ] 예약목록 시트
  - [ ] 월별통계 시트
  - [ ] 디자이너실적 시트
  - [ ] **모바일 공유 시트 연동**
- [ ] 클라우드 백업
  - [ ] iCloud 백업 (iOS/macOS)
  - [ ] Google Drive 연동 (Android/선택적)
  - [ ] 자동 백업 스케줄러
  - [ ] 백업 복원 기능

### Phase 7: 앱 잠금 (예정)
- [ ] PIN 설정/해제
- [ ] **생체인증 (플랫폼별)**
  - [ ] Face ID / Touch ID (iOS)
  - [ ] Touch ID (macOS)
  - [ ] Windows Hello
  - [ ] 지문인식 (Android)
- [ ] 자동 잠금 타이머
- [ ] 앱 설정 화면

### Phase 8: 빌드 & 배포 (예정)
- [ ] 기능 테스트 (모든 플랫폼)
- [ ] **Desktop 빌드**
  - [ ] macOS (DMG)
  - [ ] Windows (MSI)
  - [ ] Linux (DEB)
- [ ] **Mobile 빌드**
  - [ ] iOS 빌드 및 TestFlight 배포
  - [ ] Android 빌드 및 APK/AAB 생성

## 참조 자료

### 기존 프로젝트
- 경로: `/Users/minam.cho/workspaces/study/sisters-salon-reservation`
- 분석 보고서: `docs/analysis-report.md`

### 외부 문서
- [Tauri 2.0 가이드](https://v2.tauri.app/)
- [Tauri Mobile 가이드](https://v2.tauri.app/start/prerequisites/)
- [React 공식 문서](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [rusqlite](https://docs.rs/rusqlite/)
- [rust_xlsxwriter](https://docs.rs/rust_xlsxwriter/) - Excel 파일 생성
- [keyring](https://docs.rs/keyring/) - OS 보안 저장소
- [bcrypt](https://docs.rs/bcrypt/) - 비밀번호 해싱

## 주의사항

1. **기존 코드 재사용**: 대부분의 React 컴포넌트는 기존 프로젝트에서 복사하여 사용
2. **API 변환**: `axios.get('/api/...')` → `invoke('command_name', {...})`
3. **인증 제거**: JWT 인증 대신 선택적 PIN 잠금으로 대체
4. **데이터 위치**: 사용자 앱 데이터 디렉토리에 SQLite 파일 저장
5. **백업 중요**: 자동 백업 기능 구현 필수
6. **Excel 내보내기**: rust_xlsxwriter는 비동기로 실행하여 UI 블로킹 방지
7. **클라우드 백업**:
   - iCloud는 iOS/macOS에서 사용 가능
   - Google Drive는 OAuth 토큰 관리 필요
8. **앱 잠금 보안**:
   - PIN은 반드시 bcrypt로 해시하여 저장
   - 각 플랫폼별 보안 저장소 사용 (Keychain/Credential Manager/Keystore)
   - 생체인증은 플랫폼별 조건부 컴파일 필요
9. **반응형 UI**:
   - 모바일 우선 설계 (기본 스타일 = 모바일)
   - useDeviceType 훅으로 레이아웃 분기
   - 터치 친화적 UI (최소 터치 영역 44px)
10. **모바일 빌드**:
    - iOS: Xcode 및 Apple Developer 계정 필요
    - Android: Android Studio 및 SDK 필요
    - 모바일 권한 설정 (파일 접근, iCloud 등)

11. **Safe Area 처리**:
    - iOS: `env(safe-area-inset-*)` 사용
    - Android: `max()` fallback 사용 (WebView에서 safe-area-inset 미지원)
    - 예: `padding-top: max(env(safe-area-inset-top, 0px), 36px);`

12. **Android 개발 환경**:
    - Android SDK cmdline-tools 필요
    - NDK 27.0 설치 필요
    - Java 17 필요 (JAVA_HOME 설정)

---

**프로젝트 시작일**: 2026-01-21
**최종 업데이트**: 2026-01-22
**현재 진행 상황**: Phase 1-4 완료, Phase 5 대기중
**지원 플랫폼**: macOS, Windows, Linux, iOS, Android
**테스트 완료 플랫폼**: macOS, iOS (iPhone/iPad), Android
