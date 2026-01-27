# Phase 11: iOS 모달 UX 및 반응형 개선

> iOS/iPad에서 모달 및 레이아웃 UX 개선

## 개요

iOS 시뮬레이터 테스트 과정에서 발견된 UI/UX 이슈들을 수정하고, 태블릿(iPad)에서의 레이아웃을 개선합니다.

### 주요 개선 사항

| 항목 | 개선 내용 |
|------|----------|
| **모달 오버레이** | iOS safe-area 영역까지 완전히 커버 |
| **모달 버튼** | 취소/저장 버튼 하단 고정 (스크롤 시에도 항상 표시) |
| **하단 네비게이션** | 모달 열림 시 자동 숨김 |
| **영업시간 레이아웃** | 태블릿에서 2열 그리드 배치 |
| **iOS 빌드** | 시뮬레이터/실기기 자동 타겟 분기 |

---

## 1. 모달 오버레이 개선

### 문제점
- iOS에서 모달 열림 시 safe-area-inset-bottom 영역에 회색 배경이 보임
- 모달이 화면 전체를 덮지 못함

### 해결 방법

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  /* iOS safe-area 영역까지 완전히 덮기 */
  min-height: 100vh;
  min-height: 100dvh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  /* ... */
}

/* iOS safe-area 하단 영역 커버 */
.modal-overlay::after {
  content: '';
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: env(safe-area-inset-bottom, 0px);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: -1;
}
```

---

## 2. 모달 버튼 하단 고정

### 문제점
- 폼 내용이 길어지면 취소/저장 버튼이 스크롤 영역에 포함되어 보이지 않음
- 사용자가 버튼을 찾기 위해 스크롤해야 함

### 해결 방법

모달 구조를 header/body/footer로 분리하여 버튼을 항상 하단에 고정:

```css
/* 모달 내부 폼/컨테이너 - flex 레이아웃 */
.modal-content > form,
.modal-content > div {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 32px);
}

/* 모달 헤더 - 항상 상단 고정 */
.modal-header {
  flex-shrink: 0;
  padding: 20px 20px 0 20px;
}

/* 모달 본문 - 스크롤 가능 영역 */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

/* 모달 푸터 - 항상 하단 고정 */
.modal-footer {
  flex-shrink: 0;
  padding: 16px 20px 20px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
}
```

### 컴포넌트 구조

```tsx
<form onSubmit={handleSubmit}>
  {/* Header */}
  <div className="modal-header">
    <div className="flex items-center justify-between">
      <h2>제목</h2>
      <button onClick={onCancel}>
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>

  {/* Body - Scrollable */}
  <div className="modal-body space-y-4">
    {/* 폼 필드들 */}
  </div>

  {/* Footer - Fixed */}
  <div className="modal-footer flex justify-end gap-3">
    <button type="button" onClick={onCancel}>취소</button>
    <button type="submit">저장</button>
  </div>
</form>
```

---

## 3. 모달 열림 시 하단 네비게이션 숨김

### 문제점
- 모달이 열려도 하단 탭 네비게이션이 보여 시각적으로 산만함
- 모달과 네비게이션이 겹쳐 보이는 경우 발생

### 해결 방법

#### ModalContext 생성

```tsx
// src/contexts/ModalContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <ModalContext.Provider value={{ isModalOpen, setModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
```

#### BottomTabs 숨김 처리

```tsx
// src/components/navigation/BottomTabs.tsx
interface BottomTabsProps {
  // ...
  hidden?: boolean;
}

export function BottomTabs({ hidden = false, ... }: BottomTabsProps) {
  return (
    <nav
      className={`fixed bottom-0 ... transition-transform duration-200 ${
        hidden ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* ... */}
    </nav>
  );
}
```

#### 사용 예시

```tsx
// App.tsx 또는 해당 컴포넌트
const { setModalOpen } = useModal();

useEffect(() => {
  setModalOpen(showForm);
}, [showForm, setModalOpen]);
```

---

## 4. 영업시간 반응형 레이아웃

### 문제점
- iPad에서 영업시간의 "휴식" 입력 필드가 화면 밖으로 잘림
- 세로 배치 시 우측에 빈 공간이 남아 디자인이 어색함

### 해결 방법

태블릿(md+)에서 영업/휴식을 2열 그리드로 배치:

```tsx
{/* Time Inputs */}
{!h.isClosed && (
  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
    {/* Operating Hours */}
    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-white/5">
      <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
      <span className="text-sm text-gray-600 w-10">영업</span>
      <div className="flex items-center gap-2 flex-1">
        <input type="time" className="input flex-1 min-w-0" />
        <span>~</span>
        <input type="time" className="input flex-1 min-w-0" />
      </div>
    </div>

    {/* Break Time */}
    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-white/5">
      <Coffee className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span className="text-sm text-gray-600 w-10">휴식</span>
      <div className="flex items-center gap-2 flex-1">
        <input type="time" className="input flex-1 min-w-0" />
        <span>~</span>
        <input type="time" className="input flex-1 min-w-0" />
      </div>
    </div>
  </div>
)}
```

### 레이아웃 특징

| 화면 크기 | 레이아웃 |
|----------|----------|
| 모바일 (< 768px) | 1열 - 영업/휴식 세로 배치 |
| 태블릿+ (>= 768px) | 2열 - 영업/휴식 가로 배치 |

### 디자인 개선
- 각 섹션에 배경색 카드 적용 (`bg-white/50`)
- 아이콘 색상으로 구분: 영업(파란색), 휴식(주황색)
- 입력 필드 유동 너비 (`flex-1 min-w-0`)

---

## 5. 안내 메시지 위치 개선

### 문제점
- "영업시간 변경 후 저장 버튼을 클릭해야 반영됩니다" 안내 메시지가 하단에 위치
- 스크롤하지 않으면 사용자가 확인할 수 없음

### 해결 방법

안내 메시지를 상단(헤더 바로 아래)으로 이동:

```tsx
{/* Info Card - 상단에 배치 */}
<div className="flex items-start gap-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
  <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
  <div className="text-sm text-primary-700 dark:text-primary-300">
    <span className="font-medium">영업시간 변경 후 저장 버튼을 클릭해야 반영됩니다.</span>
    <span className="text-primary-600 dark:text-primary-400 ml-1">휴식시간은 선택사항입니다.</span>
  </div>
</div>
```

---

## 6. iOS 빌드 스크립트 개선

### 문제점
- Xcode에서 빌드 시 시뮬레이터/실기기 타겟이 자동 분기되지 않음
- 잘못된 타겟으로 빌드 시 링킹 에러 발생

### 해결 방법

`project.yml`의 Build Rust Code 스크립트 수정:

```yaml
script: |
  # nvm 환경 로드
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  # Rust 빌드 - 시뮬레이터/기기 타겟 분기
  echo "Building Rust code for iOS..."
  echo "PLATFORM_NAME: $PLATFORM_NAME"

  if [[ "$PLATFORM_NAME" == *"simulator"* ]]; then
    RUST_TARGET="aarch64-apple-ios-sim"
    echo "Building for iOS Simulator..."
  else
    RUST_TARGET="aarch64-apple-ios"
    echo "Building for iOS Device..."
  fi

  cd "${SRCROOT}/../../"
  cargo build --target $RUST_TARGET --release
```

---

## 7. iOS 확대/더블탭 방지

### 문제점
- iOS WebView에서 더블탭 시 화면 확대됨
- 핀치 제스처로 의도치 않은 확대 발생

### 해결 방법

#### viewport 메타 태그

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
<meta name="format-detection" content="telephone=no" />
```

#### CSS touch-action

```css
html {
  -ms-touch-action: manipulation;
  touch-action: manipulation;
}

* {
  touch-action: manipulation;
}
```

---

## 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/index.css` | 모달 스타일, safe-area 처리, touch-action |
| `src/contexts/ModalContext.tsx` | 모달 상태 관리 Context (신규) |
| `src/App.tsx` | ModalProvider 적용, 모달 상태 연동 |
| `src/components/navigation/BottomTabs.tsx` | hidden prop 추가 |
| `src/components/layout/MobileLayout.tsx` | ModalContext 연동 |
| `src/components/reservation/AppointmentForm.tsx` | 모달 구조 변경 |
| `src/components/customer/CustomerManagement.tsx` | 모달 구조 변경, 버튼 텍스트 수정 |
| `src/components/business-hours/BusinessHours.tsx` | 반응형 그리드, 안내 메시지 위치 |
| `index.html` | viewport 메타 태그 |
| `src-tauri/gen/apple/project.yml` | iOS 빌드 스크립트 개선 |

---

## 테스트 환경

| 플랫폼 | 디바이스 | 상태 |
|--------|----------|:----:|
| iOS Simulator | iPhone 16 Pro | ✅ |
| iOS Simulator | iPad Pro 11-inch (M4) | ✅ |
| iOS Device | iPhone 16 Pro | ✅ |

---

## 완료일

**2026-01-27**
