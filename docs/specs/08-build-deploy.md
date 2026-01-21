# Phase 8: 빌드 & 배포

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/08-build-deploy` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 2-3일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/08-build-deploy
```

---

## 목표

각 플랫폼별 최종 빌드 설정 및 배포 파이프라인을 구축합니다.

## 산출물

- macOS 앱 빌드 (.dmg, .app)
- Windows 앱 빌드 (.msi, .exe)
- Linux 앱 빌드 (.deb, .AppImage)
- iOS 앱 빌드 (.ipa, App Store)
- Android 앱 빌드 (.apk, .aab)
- CI/CD 파이프라인 (GitHub Actions)

---

## 플랫폼별 빌드 요구사항

| 플랫폼 | 빌드 환경 | 출력 형식 | 배포처 |
|--------|----------|----------|--------|
| macOS | macOS | .dmg, .app | 직접 배포, App Store |
| Windows | Windows/Linux | .msi, .exe | 직접 배포, Microsoft Store |
| Linux | Linux | .deb, .AppImage | 직접 배포 |
| iOS | macOS | .ipa | App Store, TestFlight |
| Android | 모든 OS | .apk, .aab | Google Play Store |

---

## 구현 내용

### 1. Tauri 빌드 설정

#### src-tauri/tauri.conf.json
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Sisters Salon",
  "version": "1.0.0",
  "identifier": "com.sisters.salon",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "windows": [
      {
        "title": "Sisters Salon",
        "width": 1200,
        "height": 800,
        "minWidth": 375,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "targets": "all",
    "macOS": {
      "minimumSystemVersion": "10.15",
      "dmg": {
        "appPosition": { "x": 180, "y": 170 },
        "applicationFolderPosition": { "x": 480, "y": 170 },
        "windowSize": { "width": 660, "height": 400 }
      },
      "entitlements": "./entitlements.plist",
      "exceptionDomain": null,
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": null
    },
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "",
      "wix": {
        "language": "ko-KR"
      },
      "nsis": {
        "languages": ["Korean"],
        "displayLanguageSelector": false
      }
    },
    "linux": {
      "appimage": {
        "bundleMediaFramework": true
      },
      "deb": {
        "depends": ["libwebkit2gtk-4.1-0", "libssl3"]
      }
    },
    "iOS": {
      "developmentTeam": "YOUR_TEAM_ID",
      "minimumSystemVersion": "13.0"
    },
    "android": {
      "minSdkVersion": 24,
      "targetSdkVersion": 34
    }
  },
  "plugins": {
    "shell": {
      "open": true
    }
  }
}
```

### 2. 앱 아이콘 생성

```bash
# 아이콘 폴더 구조
src-tauri/icons/
├── 32x32.png
├── 128x128.png
├── 128x128@2x.png
├── icon.icns      # macOS
├── icon.ico       # Windows
├── icon.png       # Linux
├── ios/           # iOS 아이콘들
│   ├── AppIcon-20x20@1x.png
│   ├── AppIcon-20x20@2x.png
│   ├── AppIcon-20x20@3x.png
│   ├── AppIcon-29x29@1x.png
│   ├── AppIcon-29x29@2x.png
│   ├── AppIcon-29x29@3x.png
│   ├── AppIcon-40x40@1x.png
│   ├── AppIcon-40x40@2x.png
│   ├── AppIcon-40x40@3x.png
│   ├── AppIcon-60x60@2x.png
│   ├── AppIcon-60x60@3x.png
│   ├── AppIcon-76x76@1x.png
│   ├── AppIcon-76x76@2x.png
│   ├── AppIcon-83.5x83.5@2x.png
│   └── AppIcon-1024x1024@1x.png
└── android/       # Android 아이콘들
    ├── mipmap-mdpi/
    ├── mipmap-hdpi/
    ├── mipmap-xhdpi/
    ├── mipmap-xxhdpi/
    └── mipmap-xxxhdpi/
```

#### 아이콘 생성 스크립트 (scripts/generate-icons.sh)
```bash
#!/bin/bash

# 원본 이미지 (1024x1024 권장)
SOURCE="icon-source.png"

# macOS/Windows/Linux 아이콘
sips -z 32 32 $SOURCE --out src-tauri/icons/32x32.png
sips -z 128 128 $SOURCE --out src-tauri/icons/128x128.png
sips -z 256 256 $SOURCE --out src-tauri/icons/128x128@2x.png

# macOS .icns
mkdir -p icon.iconset
sips -z 16 16 $SOURCE --out icon.iconset/icon_16x16.png
sips -z 32 32 $SOURCE --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 $SOURCE --out icon.iconset/icon_32x32.png
sips -z 64 64 $SOURCE --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 $SOURCE --out icon.iconset/icon_128x128.png
sips -z 256 256 $SOURCE --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 $SOURCE --out icon.iconset/icon_256x256.png
sips -z 512 512 $SOURCE --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 $SOURCE --out icon.iconset/icon_512x512.png
sips -z 1024 1024 $SOURCE --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o src-tauri/icons/icon.icns
rm -rf icon.iconset

# Windows .ico (ImageMagick 필요)
convert $SOURCE -define icon:auto-resize=256,128,64,48,32,16 src-tauri/icons/icon.ico

# iOS 아이콘들
mkdir -p src-tauri/icons/ios
sips -z 20 20 $SOURCE --out src-tauri/icons/ios/AppIcon-20x20@1x.png
sips -z 40 40 $SOURCE --out src-tauri/icons/ios/AppIcon-20x20@2x.png
sips -z 60 60 $SOURCE --out src-tauri/icons/ios/AppIcon-20x20@3x.png
sips -z 29 29 $SOURCE --out src-tauri/icons/ios/AppIcon-29x29@1x.png
sips -z 58 58 $SOURCE --out src-tauri/icons/ios/AppIcon-29x29@2x.png
sips -z 87 87 $SOURCE --out src-tauri/icons/ios/AppIcon-29x29@3x.png
sips -z 40 40 $SOURCE --out src-tauri/icons/ios/AppIcon-40x40@1x.png
sips -z 80 80 $SOURCE --out src-tauri/icons/ios/AppIcon-40x40@2x.png
sips -z 120 120 $SOURCE --out src-tauri/icons/ios/AppIcon-40x40@3x.png
sips -z 120 120 $SOURCE --out src-tauri/icons/ios/AppIcon-60x60@2x.png
sips -z 180 180 $SOURCE --out src-tauri/icons/ios/AppIcon-60x60@3x.png
sips -z 76 76 $SOURCE --out src-tauri/icons/ios/AppIcon-76x76@1x.png
sips -z 152 152 $SOURCE --out src-tauri/icons/ios/AppIcon-76x76@2x.png
sips -z 167 167 $SOURCE --out src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
sips -z 1024 1024 $SOURCE --out src-tauri/icons/ios/AppIcon-1024x1024@1x.png

# Android 아이콘들
mkdir -p src-tauri/icons/android/{mipmap-mdpi,mipmap-hdpi,mipmap-xhdpi,mipmap-xxhdpi,mipmap-xxxhdpi}
sips -z 48 48 $SOURCE --out src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
sips -z 72 72 $SOURCE --out src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
sips -z 96 96 $SOURCE --out src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
sips -z 144 144 $SOURCE --out src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
sips -z 192 192 $SOURCE --out src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png

echo "아이콘 생성 완료!"
```

### 3. macOS Entitlements

#### src-tauri/entitlements.plist
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- 네트워크 접근 (선택) -->
    <key>com.apple.security.network.client</key>
    <true/>

    <!-- 파일 접근 -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>

    <!-- iCloud 접근 -->
    <key>com.apple.developer.icloud-container-identifiers</key>
    <array>
        <string>iCloud.com.sisters.salon</string>
    </array>
    <key>com.apple.developer.icloud-services</key>
    <array>
        <string>CloudDocuments</string>
    </array>

    <!-- Keychain 접근 -->
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)com.sisters.salon</string>
    </array>
</dict>
</plist>
```

### 4. 빌드 스크립트

#### package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",

    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",

    "tauri:build:mac": "tauri build --target universal-apple-darwin",
    "tauri:build:win": "tauri build --target x86_64-pc-windows-msvc",
    "tauri:build:linux": "tauri build --target x86_64-unknown-linux-gnu",

    "tauri:ios:dev": "tauri ios dev",
    "tauri:ios:build": "tauri ios build",

    "tauri:android:dev": "tauri android dev",
    "tauri:android:build": "tauri android build",

    "build:all": "npm run build && npm run tauri:build",
    "release": "npm run build:all && npm run generate:checksums"
  }
}
```

### 5. GitHub Actions CI/CD

#### .github/workflows/build.yml
```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-desktop:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            target: universal-apple-darwin
            name: macOS
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
            name: Linux
          - platform: windows-latest
            target: x86_64-pc-windows-msvc
            name: Windows

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Rust
        uses: dtolnay/rust-action@stable

      - name: Install dependencies (Linux)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

      - name: Install npm dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        with:
          tagName: v__VERSION__
          releaseName: 'Sisters Salon v__VERSION__'
          releaseBody: 'See the assets to download this version and install.'
          releaseDraft: true
          prerelease: false
          args: --target ${{ matrix.target }}

  build-ios:
    runs-on: macos-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Rust
        uses: dtolnay/rust-action@stable

      - name: Add iOS target
        run: rustup target add aarch64-apple-ios

      - name: Install npm dependencies
        run: npm ci

      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable

      - name: Install CocoaPods
        run: sudo gem install cocoapods

      - name: Build iOS
        run: npm run tauri ios build
        env:
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_PROVISIONING_PROFILE: ${{ secrets.APPLE_PROVISIONING_PROFILE }}

      - name: Upload to TestFlight
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
        run: |
          xcrun altool --upload-app \
            --type ios \
            --file "src-tauri/gen/apple/build/arm64/Sisters Salon.ipa" \
            --username ${{ secrets.APPLE_ID }} \
            --password ${{ secrets.APPLE_APP_PASSWORD }}

  build-android:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Rust
        uses: dtolnay/rust-action@stable

      - name: Add Android targets
        run: |
          rustup target add aarch64-linux-android
          rustup target add armv7-linux-androideabi
          rustup target add i686-linux-android
          rustup target add x86_64-linux-android

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Android NDK
        uses: nttld/setup-ndk@v1
        with:
          ndk-version: r25c

      - name: Install npm dependencies
        run: npm ci

      - name: Build Android APK
        run: npm run tauri android build
        env:
          NDK_HOME: ${{ env.ANDROID_NDK_HOME }}

      - name: Sign APK
        uses: r0adkll/sign-android-release@v1
        with:
          releaseDirectory: src-tauri/gen/android/app/build/outputs/apk/universal/release
          signingKeyBase64: ${{ secrets.ANDROID_SIGNING_KEY }}
          alias: ${{ secrets.ANDROID_KEY_ALIAS }}
          keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Build Android AAB (Play Store)
        run: |
          cd src-tauri/gen/android
          ./gradlew bundleRelease

      - name: Upload to Play Store
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.sisters.salon
          releaseFiles: src-tauri/gen/android/app/build/outputs/bundle/release/app-release.aab
          track: internal
```

### 6. 버전 관리

#### scripts/bump-version.sh
```bash
#!/bin/bash

# 사용법: ./scripts/bump-version.sh [major|minor|patch]

TYPE=${1:-patch}

# 현재 버전 읽기
CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"\([0-9]*\.[0-9]*\.[0-9]*\)".*/\1/')

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case $TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "버전 업데이트: $CURRENT_VERSION -> $NEW_VERSION"

# package.json 업데이트
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# tauri.conf.json 업데이트
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json

# Cargo.toml 업데이트
sed -i '' "s/version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml

echo "버전 업데이트 완료: $NEW_VERSION"
echo ""
echo "다음 명령어로 릴리스:"
echo "  git add -A"
echo "  git commit -m 'chore: bump version to $NEW_VERSION'"
echo "  git tag v$NEW_VERSION"
echo "  git push origin main --tags"
```

### 7. 플랫폼별 빌드 가이드

#### macOS 빌드
```bash
# 개발 빌드
npm run tauri:dev

# 릴리스 빌드 (Universal Binary: Intel + Apple Silicon)
npm run tauri:build:mac

# 출력 파일
# - src-tauri/target/universal-apple-darwin/release/bundle/dmg/Sisters Salon_x.x.x_universal.dmg
# - src-tauri/target/universal-apple-darwin/release/bundle/macos/Sisters Salon.app
```

#### Windows 빌드
```bash
# 릴리스 빌드
npm run tauri:build:win

# 출력 파일
# - src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/Sisters Salon_x.x.x_x64.msi
# - src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Sisters Salon_x.x.x_x64-setup.exe
```

#### Linux 빌드
```bash
# 릴리스 빌드
npm run tauri:build:linux

# 출력 파일
# - src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/sisters-salon_x.x.x_amd64.deb
# - src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/sisters-salon_x.x.x_amd64.AppImage
```

#### iOS 빌드
```bash
# 개발 빌드 (시뮬레이터)
npm run tauri:ios:dev

# 릴리스 빌드
npm run tauri:ios:build

# Xcode에서 Archive & Upload
# 1. Xcode에서 src-tauri/gen/apple 프로젝트 열기
# 2. Product > Archive
# 3. Distribute App > App Store Connect
```

#### Android 빌드
```bash
# 개발 빌드 (에뮬레이터)
npm run tauri:android:dev

# 릴리스 빌드 (APK)
npm run tauri:android:build

# AAB 빌드 (Play Store)
cd src-tauri/gen/android
./gradlew bundleRelease

# 출력 파일
# - src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
# - src-tauri/gen/android/app/build/outputs/bundle/release/app-release.aab
```

### 8. 코드 서명

#### macOS 코드 서명
```bash
# 개발자 인증서 설치 필요
# Apple Developer Program 가입 필요

# 환경 변수 설정
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_CERTIFICATE="path/to/certificate.p12"
export APPLE_CERTIFICATE_PASSWORD="password"

# Notarization을 위한 추가 설정
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAM_ID"
```

#### Windows 코드 서명
```bash
# 코드 서명 인증서 필요
# Windows SDK의 signtool.exe 사용

signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 "Sisters Salon.exe"
```

#### Android 키 생성
```bash
# 릴리스 키 생성
keytool -genkey -v -keystore sisters-salon-release-key.keystore \
  -alias sisters-salon \
  -keyalg RSA -keysize 2048 -validity 10000

# 환경 변수로 설정 (GitHub Secrets)
# ANDROID_SIGNING_KEY: base64로 인코딩된 keystore 파일
# ANDROID_KEY_ALIAS: sisters-salon
# ANDROID_KEYSTORE_PASSWORD: keystore 비밀번호
# ANDROID_KEY_PASSWORD: key 비밀번호
```

---

## 커밋 메시지 가이드

```bash
# Tauri 빌드 설정
git commit -m "chore(build): Tauri 빌드 설정 구성

- tauri.conf.json 빌드 옵션 설정
- 플랫폼별 번들 설정
- 앱 메타데이터 설정

Co-Authored-By: Claude <noreply@anthropic.com>"

# 앱 아이콘
git commit -m "chore(build): 앱 아이콘 추가

- Desktop 아이콘 (macOS, Windows, Linux)
- iOS 앱 아이콘 세트
- Android 앱 아이콘 세트
- 아이콘 생성 스크립트

Co-Authored-By: Claude <noreply@anthropic.com>"

# CI/CD 파이프라인
git commit -m "ci: GitHub Actions 빌드 파이프라인 구성

- Desktop 빌드 (macOS, Windows, Linux)
- iOS 빌드 및 TestFlight 업로드
- Android 빌드 및 Play Store 업로드
- 자동 릴리스 생성

Co-Authored-By: Claude <noreply@anthropic.com>"

# 코드 서명
git commit -m "chore(build): 코드 서명 설정 추가

- macOS Entitlements
- Windows 서명 설정
- Android 릴리스 키 설정

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 완료 기준 체크리스트

### Desktop 빌드
- [ ] macOS .dmg 빌드 성공
- [ ] macOS .app 빌드 성공
- [ ] macOS Universal Binary (Intel + Apple Silicon)
- [ ] Windows .msi 빌드 성공
- [ ] Windows .exe (NSIS) 빌드 성공
- [ ] Linux .deb 빌드 성공
- [ ] Linux .AppImage 빌드 성공

### Mobile 빌드
- [ ] iOS .ipa 빌드 성공
- [ ] iOS 시뮬레이터 실행 확인
- [ ] Android .apk 빌드 성공
- [ ] Android .aab 빌드 성공
- [ ] Android 에뮬레이터 실행 확인

### 코드 서명
- [ ] macOS 코드 서명 설정
- [ ] macOS Notarization 설정
- [ ] Windows 코드 서명 설정
- [ ] iOS 프로비저닝 프로파일 설정
- [ ] Android 릴리스 키 생성

### CI/CD
- [ ] GitHub Actions 빌드 워크플로우
- [ ] 자동 릴리스 생성
- [ ] TestFlight 자동 업로드
- [ ] Play Store 자동 업로드

### 배포
- [ ] macOS 앱 실행 테스트
- [ ] Windows 앱 실행 테스트
- [ ] Linux 앱 실행 테스트
- [ ] iOS 실제 기기 테스트
- [ ] Android 실제 기기 테스트

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. 각 플랫폼에서 빌드 성공
3. 코드 서명 완료
4. CI/CD 파이프라인 동작 확인
5. 실제 기기 테스트 완료

```bash
# 머지 절차
git checkout develop
git merge --squash task/08-build-deploy
git commit -m "feat: Phase 8 - 빌드 & 배포 설정 완료

- Tauri 빌드 설정 (Desktop, iOS, Android)
- 앱 아이콘 생성
- GitHub Actions CI/CD 파이프라인
- 코드 서명 설정
- 버전 관리 스크립트

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
git branch -d task/08-build-deploy
```

---

## 릴리스 절차

### 1. 버전 업데이트
```bash
./scripts/bump-version.sh patch  # 또는 minor, major
```

### 2. 변경사항 커밋
```bash
git add -A
git commit -m "chore: bump version to x.x.x"
```

### 3. 태그 생성 및 푸시
```bash
git tag vx.x.x
git push origin main --tags
```

### 4. GitHub Actions 자동 빌드
- 태그 푸시 시 자동으로 빌드 시작
- Draft 릴리스 생성
- 각 플랫폼 빌드 결과물 첨부

### 5. 릴리스 발행
- GitHub Releases에서 Draft 확인
- Release Notes 작성
- 릴리스 발행

### 6. 앱 스토어 제출
- iOS: TestFlight 검토 후 App Store 제출
- Android: Internal Testing 후 Production 릴리스

---

## 프로젝트 완료

모든 Phase가 완료되면 `develop` 브랜치를 `main`으로 머지합니다.

```bash
git checkout main
git merge --squash develop
git commit -m "feat: Sisters Salon Reservation App v1.0.0

크로스 플랫폼 미용실 예약 관리 앱 첫 릴리스

## 주요 기능
- 예약 관리 (CRUD)
- 디자이너 관리
- 영업시간 설정
- 통계 대시보드 (Recharts)
- Excel/CSV 내보내기
- 클라우드 백업 (iCloud, Google Drive)
- 앱 잠금 (PIN, 생체인증)

## 지원 플랫폼
- macOS (Intel, Apple Silicon)
- Windows
- Linux
- iOS
- Android

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
git tag v1.0.0
git push origin v1.0.0
```
