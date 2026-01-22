# Phase 4: 반응형 UI

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/04-responsive-ui` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 2-3일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/04-responsive-ui
```

---

## 목표

모바일, 태블릿, 데스크탑에 최적화된 반응형 UI 구현

## 산출물

- 디바이스별 레이아웃 컴포넌트
- 적응형 네비게이션
- 반응형 훅 (useDeviceType, useResponsive)
- 글라스모피즘 스타일 시스템

---

## 브레이크포인트 정의

```typescript
// src/constants/breakpoints.ts
export const BREAKPOINTS = {
  xs: 375,    // iPhone SE
  sm: 640,    // 태블릿 세로
  md: 768,    // 태블릿 가로
  lg: 1024,   // 데스크탑
  xl: 1280,   // 대형 모니터
  '2xl': 1536, // 초대형 모니터
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
```

| 디바이스 | 너비 | Tailwind | 레이아웃 |
|----------|------|----------|----------|
| **모바일** | < 640px | (기본) | 단일 컬럼, 바텀 탭 |
| **태블릿** | 640-1023px | `sm:`, `md:` | 2컬럼, 접이식 사이드바 |
| **데스크탑** | ≥ 1024px | `lg:`, `xl:` | 3컬럼, 고정 사이드바 |

---

## 디바이스별 레이아웃 설계

### iPhone (< 640px)
```
┌─────────────────────┐
│  Sisters Salon  ☰   │ ← 헤더 (햄버거 메뉴)
├─────────────────────┤
│                     │
│   [  캘린더 뷰  ]   │ ← 전체 너비
│                     │
│   ┌─────────────┐   │
│   │ 예약 카드 1 │   │ ← 카드 리스트
│   └─────────────┘   │
│   ┌─────────────┐   │
│   │ 예약 카드 2 │   │
│   └─────────────┘   │
│                     │
├─────────────────────┤
│ 📅  ➕  👨‍🎨  📊  ⚙️ │ ← 바텀 탭 (5개 아이콘)
└─────────────────────┘
```

### iPad (640-1023px)
```
┌───────────────────────────────────────┐
│  Sisters Salon                    ☰   │
├─────────┬─────────────────────────────┤
│ 📅 예약 │                             │
│ ➕ 새예약│     [   캘린더 뷰   ]       │
│ 👨‍🎨 디자│                             │
│ 📊 통계 │  ┌─────────┬─────────┐      │
│ ⚙️ 설정 │  │ 예약 1  │ 예약 2  │      │
│         │  └─────────┴─────────┘      │
│  [접기] │                             │
└─────────┴─────────────────────────────┘
     ↑ 접이식 사이드바 (토글 가능)
```

### Desktop (≥ 1024px)
```
┌─────────────────────────────────────────────────────────┐
│  Sisters Salon Reservation                              │
├───────────┬─────────────────────────┬───────────────────┤
│           │                         │                   │
│ 📅 예약   │    [   캘린더 뷰   ]    │  오늘의 예약      │
│ ➕ 새예약 │                         │  ────────────     │
│ 👨‍🎨 디자이│                         │  10:00 김민재    │
│ 📊 통계   │  ┌───────┬───────┬────┐ │  11:00 이영희    │
│ ⚙️ 설정   │  │예약 1 │예약 2 │... │ │  14:00 박철수    │
│           │  └───────┴───────┴────┘ │                   │
│           │                         │                   │
└───────────┴─────────────────────────┴───────────────────┘
  고정 사이드바 (200px)  메인 컨텐츠      사이드 패널 (280px)
```

---

## 반응형 컴포넌트 구현

### src/hooks/useDeviceType.ts

```typescript
import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < BREAKPOINTS.mobile) return 'mobile';
    if (width < BREAKPOINTS.tablet) return 'tablet';
    return 'desktop';
  });

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

    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return deviceType;
}
```

### src/hooks/useResponsive.ts

```typescript
import { useMemo } from 'react';
import { useDeviceType, DeviceType } from './useDeviceType';

interface ResponsiveValues<T> {
  mobile?: T;
  tablet?: T;
  desktop: T;
}

export function useResponsive<T>(values: ResponsiveValues<T>): T {
  const deviceType = useDeviceType();

  return useMemo(() => {
    switch (deviceType) {
      case 'mobile':
        return values.mobile ?? values.tablet ?? values.desktop;
      case 'tablet':
        return values.tablet ?? values.desktop;
      default:
        return values.desktop;
    }
  }, [deviceType, values]);
}

// 유틸리티 훅들
export function useIsMobile(): boolean {
  return useDeviceType() === 'mobile';
}

export function useIsTablet(): boolean {
  return useDeviceType() === 'tablet';
}

export function useIsDesktop(): boolean {
  return useDeviceType() === 'desktop';
}
```

### src/components/layout/ResponsiveContainer.tsx

```tsx
import { ReactNode } from 'react';
import { useDeviceType, DeviceType } from '../../hooks/useDeviceType';
import { DesktopLayout } from './DesktopLayout';
import { TabletLayout } from './TabletLayout';
import { MobileLayout } from './MobileLayout';

interface ResponsiveContainerProps {
  children: ReactNode;
}

export function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  const deviceType = useDeviceType();

  const layouts: Record<DeviceType, typeof DesktopLayout> = {
    mobile: MobileLayout,
    tablet: TabletLayout,
    desktop: DesktopLayout,
  };

  const Layout = layouts[deviceType];

  return <Layout>{children}</Layout>;
}
```

### src/components/layout/MobileLayout.tsx

```tsx
import { ReactNode, useState } from 'react';
import { BottomTabs } from '../navigation/BottomTabs';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-indigo-950">
      {/* 헤더 */}
      <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Sisters Salon
        </h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-white/20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* 바텀 탭 */}
      <BottomTabs />
    </div>
  );
}
```

### src/components/layout/TabletLayout.tsx

```tsx
import { ReactNode, useState } from 'react';
import { CollapsibleSidebar } from '../navigation/CollapsibleSidebar';

interface TabletLayoutProps {
  children: ReactNode;
}

export function TabletLayout({ children }: TabletLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-indigo-950">
      {/* 접이식 사이드바 */}
      <CollapsibleSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* 메인 콘텐츠 */}
      <main className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'ml-48' : 'ml-16'}`}>
        {children}
      </main>
    </div>
  );
}
```

### src/components/layout/DesktopLayout.tsx

```tsx
import { ReactNode } from 'react';
import { Sidebar } from '../navigation/Sidebar';

interface DesktopLayoutProps {
  children: ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-indigo-950">
      {/* 고정 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-52 p-6 overflow-y-auto">
        {children}
      </main>

      {/* 사이드 패널 (오늘의 예약) */}
      <aside className="w-72 glass-card m-4 p-4 hidden xl:block">
        <h2 className="font-bold mb-4">오늘의 예약</h2>
        {/* 오늘의 예약 목록 */}
      </aside>
    </div>
  );
}
```

---

## 네비게이션 컴포넌트

### src/components/navigation/Sidebar.tsx

```tsx
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: '📅', label: '예약 관리' },
  { to: '/new', icon: '➕', label: '새 예약' },
  { to: '/designers', icon: '👨‍🎨', label: '디자이너' },
  { to: '/hours', icon: '🕐', label: '영업시간' },
  { to: '/statistics', icon: '📊', label: '통계' },
  { to: '/settings', icon: '⚙️', label: '설정' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-52 glass p-4 z-40">
      <h1 className="text-xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Sisters Salon
      </h1>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-white/20'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

### src/components/navigation/BottomTabs.tsx

```tsx
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: '📅', label: '예약' },
  { to: '/new', icon: '➕', label: '새 예약' },
  { to: '/designers', icon: '👨‍🎨', label: '디자이너' },
  { to: '/statistics', icon: '📊', label: '통계' },
  { to: '/settings', icon: '⚙️', label: '설정' },
];

export function BottomTabs() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 safe-area-inset-bottom">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs mt-1">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

### src/components/navigation/CollapsibleSidebar.tsx

```tsx
import { NavLink } from 'react-router-dom';

interface CollapsibleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: '📅', label: '예약 관리' },
  { to: '/new', icon: '➕', label: '새 예약' },
  { to: '/designers', icon: '👨‍🎨', label: '디자이너' },
  { to: '/hours', icon: '🕐', label: '영업시간' },
  { to: '/statistics', icon: '📊', label: '통계' },
  { to: '/settings', icon: '⚙️', label: '설정' },
];

export function CollapsibleSidebar({ isOpen, onToggle }: CollapsibleSidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full glass p-4 z-40 transition-all duration-300 ${
        isOpen ? 'w-48' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        {isOpen && (
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Sisters
          </h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/20"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'hover:bg-white/20'
              }`
            }
            title={item.label}
          >
            <span>{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

---

## 글라스모피즘 스타일 가이드

### src/styles/glass.css

```css
/* 기본 글라스 효과 */
.glass {
  @apply bg-white/25 dark:bg-black/25;
  @apply backdrop-blur-md;
  @apply border border-white/20 dark:border-white/10;
  @apply shadow-lg;
}

/* 글라스 카드 */
.glass-card {
  @apply glass rounded-xl p-4 sm:p-6;
}

/* 글라스 버튼 */
.glass-button {
  @apply glass rounded-lg px-4 py-2;
  @apply hover:bg-white/30 dark:hover:bg-black/30;
  @apply transition-colors;
}

/* 글라스 인풋 */
.glass-input {
  @apply bg-white/50 dark:bg-black/50;
  @apply border border-white/20 dark:border-white/10;
  @apply rounded-lg px-3 py-2;
  @apply focus:outline-none focus:ring-2 focus:ring-indigo-500;
}

/* Safe area (모바일 노치) */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.safe-area-inset-top {
  padding-top: env(safe-area-inset-top, 0);
}
```

---

## 커밋 메시지 가이드

```bash
# 훅 구현
git commit -m "feat(hooks): useDeviceType, useResponsive 훅 구현"

# 레이아웃 컴포넌트
git commit -m "feat(layout): Desktop/Tablet/Mobile 레이아웃 구현"

# 네비게이션
git commit -m "feat(navigation): Sidebar, BottomTabs, CollapsibleSidebar 구현"

# 글라스모피즘
git commit -m "feat(styles): 글라스모피즘 스타일 시스템 구현"

# 반응형 적용
git commit -m "feat(responsive): 전체 컴포넌트 반응형 스타일 적용"
```

---

## 완료 기준 체크리스트

- [x] useDeviceType 훅 정상 동작
- [x] MobileLayout - 바텀 탭 네비게이션, 헤더
- [x] TabletLayout - 접이식 사이드바
- [x] DesktopLayout - 고정 사이드바
- [x] 글라스모피즘 스타일 적용
- [x] Safe Area 처리 (iOS/Android)
- [x] iOS 수평 스크롤/바운스 방지
- [x] Android 프로젝트 초기화 및 테스트

## 완료일: 2026-01-22

**커밋**:
- `c1c9b908` - feat: Phase 4 - 반응형 UI 개선 및 크로스 플랫폼 지원
- `999012a7` - chore: Add Android project configuration

### 실제 구현된 컴포넌트
- `src/components/layout/ResponsiveContainer.tsx` - 반응형 컨테이너
- `src/components/layout/MobileLayout.tsx` - 모바일 레이아웃 (< 640px)
- `src/components/layout/TabletLayout.tsx` - 태블릿 레이아웃 (640-1023px)
- `src/components/layout/DesktopLayout.tsx` - 데스크탑 레이아웃 (>= 1024px)
- `src/components/navigation/Sidebar.tsx` - 데스크탑 고정 사이드바
- `src/components/navigation/CollapsibleSidebar.tsx` - 태블릿 접이식 사이드바
- `src/components/navigation/BottomTabs.tsx` - 모바일 바텀 탭
- `src/hooks/useDeviceType.ts` - 디바이스 타입 감지 훅

### Safe Area 처리
```css
/* iOS: env(safe-area-inset-*) */
/* Android: max() fallback 사용 */
padding-top: max(env(safe-area-inset-top, 0px), 36px);
```

### iOS 수평 스크롤 방지
`src/main.tsx`에 터치 이벤트 핸들러로 수평 스크롤/바운스 방지 구현

### 테스트 완료 플랫폼
- [x] macOS (Desktop)
- [x] iOS Simulator (iPhone)
- [x] iOS Simulator (iPad)
- [x] Android Emulator

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. 모든 디바이스에서 레이아웃 정상 표시
3. 네비게이션 전환 정상 동작
4. 콘솔 에러 없음

```bash
# 머지 절차
git checkout develop
git merge --squash task/04-responsive-ui
git commit -m "feat: Phase 4 - 반응형 UI 구현 완료

- 디바이스별 레이아웃 (Mobile/Tablet/Desktop)
- 적응형 네비게이션 컴포넌트
- useDeviceType, useResponsive 훅
- 글라스모피즘 스타일 시스템

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
git branch -d task/04-responsive-ui
```

---

## 다음 단계

Phase 5: [통계 대시보드](./05-statistics.md)로 진행
