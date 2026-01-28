#!/bin/bash

# =============================================================================
# Sisters Salon - App Store & Google Play 스크린샷 캡처 스크립트
# =============================================================================
#
# 사용법:
#   ./scripts/capture-screenshots.sh [ios|android|all]
#
# 옵션:
#   ios     - iOS 시뮬레이터 스크린샷만 캡처
#   android - Android 에뮬레이터 스크린샷만 캡처
#   all     - 모든 플랫폼 캡처 (기본값)
#
# =============================================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOT_DIR="$PROJECT_DIR/docs/screenshots"

# 캡처할 화면 목록
SCREENS=(
    "01-calendar"
    "02-reservation-form"
    "03-reservation-list"
    "04-customers"
    "05-designers"
    "06-statistics"
    "07-settings"
    "08-business-hours"
)

# iOS 디바이스 목록
IOS_DEVICES=(
    "iPhone 15 Pro Max|6.9-inch"
    "iPhone 14 Pro Max|6.7-inch"
    "iPhone 11 Pro Max|6.5-inch"
    "iPhone 8 Plus|5.5-inch"
    "iPad Pro (12.9-inch) (6th generation)|ipad-12.9"
)

# =============================================================================
# 유틸리티 함수
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# iOS 스크린샷 캡처
# =============================================================================

setup_ios_status_bar() {
    local device_udid=$1
    log_info "상태바 설정 중... (시간: 9:41, 배터리: 100%)"

    xcrun simctl status_bar "$device_udid" override \
        --time "9:41" \
        --batteryState charged \
        --batteryLevel 100 \
        --cellularMode active \
        --cellularBars 4 \
        --wifiBars 3 2>/dev/null || true
}

clear_ios_status_bar() {
    local device_udid=$1
    xcrun simctl status_bar "$device_udid" clear 2>/dev/null || true
}

get_booted_device_udid() {
    xcrun simctl list devices | grep "Booted" | head -1 | grep -oE "[A-F0-9-]{36}" || echo ""
}

capture_ios_screenshot() {
    local device_name=$1
    local folder_name=$2
    local screen_name=$3
    local output_dir="$SCREENSHOT_DIR/ios/$folder_name"

    mkdir -p "$output_dir"

    local output_file="$output_dir/${screen_name}.png"

    log_info "캡처 중: $device_name - $screen_name"

    xcrun simctl io booted screenshot "$output_file" 2>/dev/null

    if [ -f "$output_file" ]; then
        log_success "저장됨: $output_file"
    else
        log_error "캡처 실패: $output_file"
    fi
}

capture_ios_screenshots() {
    log_info "=== iOS 스크린샷 캡처 시작 ==="

    for device_info in "${IOS_DEVICES[@]}"; do
        IFS='|' read -r device_name folder_name <<< "$device_info"

        echo ""
        log_info "디바이스: $device_name"
        log_info "폴더: $folder_name"

        # 기존 시뮬레이터 종료
        xcrun simctl shutdown all 2>/dev/null || true
        sleep 1

        # 시뮬레이터 부팅
        log_info "시뮬레이터 부팅 중: $device_name"
        xcrun simctl boot "$device_name" 2>/dev/null || {
            log_warning "시뮬레이터를 찾을 수 없음: $device_name (건너뜀)"
            continue
        }

        # 시뮬레이터 앱 열기
        open -a Simulator
        sleep 3

        # 상태바 설정
        local udid=$(get_booted_device_udid)
        if [ -n "$udid" ]; then
            setup_ios_status_bar "$udid"
        fi

        sleep 2

        echo ""
        echo -e "${YELLOW}========================================${NC}"
        echo -e "${YELLOW}  화면을 준비하고 Enter를 누르세요${NC}"
        echo -e "${YELLOW}  캡처할 화면: ${SCREENS[0]}${NC}"
        echo -e "${YELLOW}========================================${NC}"

        for screen in "${SCREENS[@]}"; do
            echo ""
            echo -e "${BLUE}다음 화면을 준비하세요: ${screen}${NC}"
            read -p "Enter를 누르면 캡처합니다... (s: 건너뛰기, q: 종료) " choice

            case $choice in
                s|S)
                    log_warning "건너뜀: $screen"
                    continue
                    ;;
                q|Q)
                    log_info "캡처 종료"
                    return
                    ;;
                *)
                    capture_ios_screenshot "$device_name" "$folder_name" "$screen"
                    ;;
            esac
        done

        # 상태바 초기화
        if [ -n "$udid" ]; then
            clear_ios_status_bar "$udid"
        fi

        log_success "$device_name 캡처 완료!"
    done

    # 시뮬레이터 종료
    xcrun simctl shutdown all 2>/dev/null || true

    log_success "=== iOS 스크린샷 캡처 완료 ==="
}

# =============================================================================
# Android 스크린샷 캡처
# =============================================================================

setup_android_demo_mode() {
    log_info "Android Demo Mode 설정 중..."

    adb shell settings put global sysui_demo_allowed 1 2>/dev/null || true

    adb shell am broadcast -a com.android.systemui.demo \
        -e command clock -e hhmm 0941 2>/dev/null || true
    adb shell am broadcast -a com.android.systemui.demo \
        -e command battery -e level 100 -e plugged false 2>/dev/null || true
    adb shell am broadcast -a com.android.systemui.demo \
        -e command network -e wifi show -e level 4 2>/dev/null || true
    adb shell am broadcast -a com.android.systemui.demo \
        -e command network -e mobile show -e level 4 -e datatype none 2>/dev/null || true
    adb shell am broadcast -a com.android.systemui.demo \
        -e command notifications -e visible false 2>/dev/null || true
}

clear_android_demo_mode() {
    adb shell am broadcast -a com.android.systemui.demo -e command exit 2>/dev/null || true
}

capture_android_screenshot() {
    local screen_name=$1
    local device_type=$2  # phone or tablet
    local output_dir="$SCREENSHOT_DIR/android/$device_type"

    mkdir -p "$output_dir"

    local output_file="$output_dir/${screen_name}.png"
    local temp_file="/sdcard/screenshot_temp.png"

    log_info "캡처 중: $screen_name ($device_type)"

    adb shell screencap -p "$temp_file" 2>/dev/null
    adb pull "$temp_file" "$output_file" 2>/dev/null
    adb shell rm "$temp_file" 2>/dev/null

    if [ -f "$output_file" ]; then
        log_success "저장됨: $output_file"
    else
        log_error "캡처 실패: $output_file"
    fi
}

capture_android_screenshots() {
    log_info "=== Android 스크린샷 캡처 시작 ==="

    # ADB 연결 확인
    if ! adb devices | grep -q "device$"; then
        log_error "연결된 Android 디바이스/에뮬레이터가 없습니다."
        log_info "에뮬레이터를 실행하거나 디바이스를 연결하세요."
        return 1
    fi

    echo ""
    echo -e "${YELLOW}디바이스 타입을 선택하세요:${NC}"
    echo "  1) Phone (1080x1920+)"
    echo "  2) Tablet (1920x1200)"
    read -p "선택 [1]: " device_choice

    local device_type="phone"
    case $device_choice in
        2)
            device_type="tablet"
            ;;
        *)
            device_type="phone"
            ;;
    esac

    # Demo Mode 설정
    setup_android_demo_mode
    sleep 2

    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  화면을 준비하고 Enter를 누르세요${NC}"
    echo -e "${YELLOW}========================================${NC}"

    for screen in "${SCREENS[@]}"; do
        echo ""
        echo -e "${BLUE}다음 화면을 준비하세요: ${screen}${NC}"
        read -p "Enter를 누르면 캡처합니다... (s: 건너뛰기, q: 종료) " choice

        case $choice in
            s|S)
                log_warning "건너뜀: $screen"
                continue
                ;;
            q|Q)
                log_info "캡처 종료"
                break
                ;;
            *)
                capture_android_screenshot "$screen" "$device_type"
                ;;
        esac
    done

    # Demo Mode 해제
    clear_android_demo_mode

    log_success "=== Android 스크린샷 캡처 완료 ==="
}

# =============================================================================
# 메인 실행
# =============================================================================

show_help() {
    echo "Sisters Salon 스크린샷 캡처 스크립트"
    echo ""
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  ios       iOS 시뮬레이터 스크린샷만 캡처"
    echo "  android   Android 에뮬레이터 스크린샷만 캡처"
    echo "  all       모든 플랫폼 캡처 (기본값)"
    echo "  help      이 도움말 표시"
    echo ""
    echo "캡처할 화면:"
    for screen in "${SCREENS[@]}"; do
        echo "  - $screen"
    done
}

main() {
    local platform=${1:-all}

    echo ""
    echo "=================================================="
    echo "  Sisters Salon 스크린샷 캡처 도구"
    echo "=================================================="
    echo ""

    case $platform in
        ios)
            capture_ios_screenshots
            ;;
        android)
            capture_android_screenshots
            ;;
        all)
            capture_ios_screenshots
            echo ""
            capture_android_screenshots
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "알 수 없는 옵션: $platform"
            show_help
            exit 1
            ;;
    esac

    echo ""
    log_success "스크린샷 저장 위치: $SCREENSHOT_DIR"
    echo ""
}

main "$@"
