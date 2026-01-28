# App Store & Google Play 스크린샷 가이드

Sisters Salon 앱의 스토어 등록을 위한 스크린샷 준비 가이드입니다.

## 폴더 구조

```
docs/screenshots/
├── README.md           # 이 파일
├── ios/
│   ├── 6.9-inch/       # iPhone 15 Pro Max (1320 x 2868)
│   ├── 6.7-inch/       # iPhone 14 Pro Max (1290 x 2796)
│   ├── 6.5-inch/       # iPhone 11 Pro Max (1284 x 2778)
│   ├── 5.5-inch/       # iPhone 8 Plus (1242 x 2208)
│   └── ipad-12.9/      # iPad Pro 12.9" (2048 x 2732)
├── android/
│   ├── phone/          # 1080 x 1920 (minimum)
│   └── tablet/         # 1920 x 1200
└── marketing/
    └── feature-graphic.png  # Google Play (1024 x 500)
```

---

## 필수 스크린샷 사이즈

### iOS (App Store Connect)

| 디바이스 | 해상도 (px) | 필수 여부 | 시뮬레이터 |
|----------|-------------|-----------|------------|
| iPhone 6.9" | 1320 x 2868 | ✅ 필수 | iPhone 15 Pro Max |
| iPhone 6.7" | 1290 x 2796 | ✅ 필수 | iPhone 14 Pro Max |
| iPhone 6.5" | 1284 x 2778 | ✅ 필수 | iPhone 11 Pro Max |
| iPhone 5.5" | 1242 x 2208 | ✅ 필수 | iPhone 8 Plus |
| iPad 12.9" (6세대) | 2048 x 2732 | ✅ 필수 | iPad Pro (12.9-inch) (6th gen) |

> **참고**: 각 사이즈당 최소 1장, 최대 10장 업로드 가능

### Android (Google Play Console)

| 타입 | 해상도 (px) | 필수 여부 | 에뮬레이터 |
|------|-------------|-----------|------------|
| Phone | 1080 x 1920+ | ✅ 필수 | Pixel 7 Pro |
| 7" Tablet | 1200 x 1920 | 권장 | Nexus 7 |
| 10" Tablet | 1920 x 1200 | 권장 | Pixel Tablet |

> **참고**: 최소 2장, 최대 8장 업로드 가능

---

## 캡처할 화면 (8개)

앱의 주요 기능을 보여주는 스크린샷입니다.

| # | 화면 | 설명 | 파일명 |
|---|------|------|--------|
| 1 | 예약 캘린더 | 메인 화면, 월간 캘린더와 예약 목록 | `01-calendar.png` |
| 2 | 예약 상세 | 예약 추가/편집 폼 | `02-reservation-form.png` |
| 3 | 예약 목록 | 일간 예약 리스트 뷰 | `03-reservation-list.png` |
| 4 | 고객 관리 | 고객 목록 및 상세 정보 | `04-customers.png` |
| 5 | 디자이너 관리 | 디자이너 목록 | `05-designers.png` |
| 6 | 통계 대시보드 | 매출 및 예약 통계 차트 | `06-statistics.png` |
| 7 | 설정 | 앱 설정 메뉴 | `07-settings.png` |
| 8 | 영업시간 | 요일별 영업시간 설정 | `08-business-hours.png` |

---

## iOS 스크린샷 캡처 방법

### 1. 시뮬레이터 준비

```bash
# 사용 가능한 시뮬레이터 목록 확인
xcrun simctl list devices

# 시뮬레이터 부팅
xcrun simctl boot "iPhone 15 Pro Max"

# 시뮬레이터 앱 열기
open -a Simulator
```

### 2. 클린 상태바 설정 (Demo Mode)

```bash
# 상태바를 깔끔하게 설정 (시간: 9:41, 배터리: 100%, 신호: 풀)
xcrun simctl status_bar booted override \
    --time "9:41" \
    --batteryState charged \
    --batteryLevel 100 \
    --cellularMode active \
    --cellularBars 4 \
    --wifiBars 3

# 상태바 초기화
xcrun simctl status_bar booted clear
```

### 3. 스크린샷 캡처

```bash
# 현재 화면 캡처
xcrun simctl io booted screenshot ~/Desktop/screenshot.png

# 또는 시뮬레이터에서 Cmd + S
```

### 4. 각 디바이스별 캡처

```bash
# iPhone 15 Pro Max (6.9")
xcrun simctl boot "iPhone 15 Pro Max"
xcrun simctl io booted screenshot docs/screenshots/ios/6.9-inch/01-calendar.png

# iPhone 14 Pro Max (6.7")
xcrun simctl boot "iPhone 14 Pro Max"
xcrun simctl io booted screenshot docs/screenshots/ios/6.7-inch/01-calendar.png

# iPhone 11 Pro Max (6.5")
xcrun simctl boot "iPhone 11 Pro Max"
xcrun simctl io booted screenshot docs/screenshots/ios/6.5-inch/01-calendar.png

# iPhone 8 Plus (5.5")
xcrun simctl boot "iPhone 8 Plus"
xcrun simctl io booted screenshot docs/screenshots/ios/5.5-inch/01-calendar.png

# iPad Pro 12.9"
xcrun simctl boot "iPad Pro (12.9-inch) (6th generation)"
xcrun simctl io booted screenshot docs/screenshots/ios/ipad-12.9/01-calendar.png
```

---

## Android 스크린샷 캡처 방법

### 1. 에뮬레이터 준비

```bash
# 사용 가능한 AVD 목록
emulator -list-avds

# 에뮬레이터 실행
emulator -avd Pixel_7_Pro_API_34
```

### 2. 스크린샷 캡처

```bash
# ADB로 스크린샷 캡처
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png docs/screenshots/android/phone/01-calendar.png

# 또는 Android Studio > Logcat > 카메라 아이콘
```

### 3. Demo Mode 설정 (클린 상태바)

```bash
# Demo Mode 활성화
adb shell settings put global sysui_demo_allowed 1

# 상태바 설정
adb shell am broadcast -a com.android.systemui.demo \
    -e command clock -e hhmm 0941
adb shell am broadcast -a com.android.systemui.demo \
    -e command battery -e level 100 -e plugged false
adb shell am broadcast -a com.android.systemui.demo \
    -e command network -e wifi show -e level 4
adb shell am broadcast -a com.android.systemui.demo \
    -e command network -e mobile show -e level 4 -e datatype none

# Demo Mode 해제
adb shell am broadcast -a com.android.systemui.demo -e command exit
```

---

## 마케팅 에셋

### App Store

| 에셋 | 사이즈 | 파일 |
|------|--------|------|
| 앱 아이콘 | 1024 x 1024 | `public/icon-1024.png` |

> 아이콘은 투명 배경 없이, 둥근 모서리 없이 제출

### Google Play

| 에셋 | 사이즈 | 파일 |
|------|--------|------|
| 앱 아이콘 | 512 x 512 | `marketing/icon-512.png` |
| Feature Graphic | 1024 x 500 | `marketing/feature-graphic.png` |

---

## 스크린샷 가이드라인

### Do's ✅

- **실제 데이터 사용**: 현실적인 한국어 이름과 예약 정보 사용
- **핵심 기능 강조**: 각 스크린샷은 하나의 주요 기능을 보여줄 것
- **일관된 스타일**: 동일한 시간, 배터리 레벨 유지
- **깔끔한 상태바**: Demo Mode 사용
- **한국어**: 모든 텍스트는 한국어로

### Don'ts ❌

- 개인정보가 포함된 실제 고객 데이터 사용 금지
- 빈 화면이나 로딩 화면 캡처 금지
- 에러 메시지가 보이는 화면 캡처 금지
- 상태바에 알림 아이콘이 많은 상태 금지

---

## 샘플 데이터

스크린샷용 예시 데이터:

### 예약
| 고객명 | 시간 | 서비스 | 디자이너 |
|--------|------|--------|----------|
| 김민지 | 10:00 | 커트 | 이수진 |
| 박서연 | 11:30 | 펌 | 김하늘 |
| 이지은 | 14:00 | 염색 | 이수진 |
| 최유나 | 15:30 | 커트+염색 | 박미영 |
| 정소희 | 17:00 | 클리닉 | 김하늘 |

### 디자이너
| 이름 | 전문분야 |
|------|----------|
| 이수진 | 커트, 펌 |
| 김하늘 | 염색, 클리닉 |
| 박미영 | 커트, 염색 |

---

## 스크린샷 텍스트 오버레이 (선택사항)

마케팅용 텍스트 추가 시:

| # | 화면 | 마케팅 문구 |
|---|------|-------------|
| 1 | 캘린더 | "한눈에 보는 예약 현황" |
| 2 | 예약 폼 | "간편한 예약 등록" |
| 3 | 예약 목록 | "일정 관리가 쉬워집니다" |
| 4 | 고객 관리 | "고객 정보를 체계적으로" |
| 5 | 디자이너 | "디자이너별 스케줄 관리" |
| 6 | 통계 | "매출 분석 한눈에" |
| 7 | 설정 | "나에게 맞는 설정" |
| 8 | 영업시간 | "유연한 영업시간 설정" |

---

## 체크리스트

### 캡처 전
- [ ] 앱에 샘플 데이터 입력
- [ ] 시뮬레이터/에뮬레이터 Demo Mode 설정
- [ ] 시간 9:41, 배터리 100% 확인

### 캡처 후
- [ ] 파일명 규칙 준수 확인
- [ ] 해상도 확인
- [ ] 민감한 정보 없는지 확인
- [ ] 모든 디바이스 사이즈 캡처 완료

### 업로드 전
- [ ] App Store Connect 업로드 (iOS)
- [ ] Google Play Console 업로드 (Android)
- [ ] 미리보기에서 순서 확인

---

## 관련 스크립트

- `scripts/capture-screenshots.sh` - 자동 스크린샷 캡처 스크립트

---

*마지막 업데이트: 2026-01-28*
