# Sisters Salon Reservation App - 프로젝트 스펙 개요

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Sisters Salon Reservation App |
| **타입** | 크로스 플랫폼 애플리케이션 (Desktop + Mobile) |
| **프레임워크** | Tauri 2.0 + React 19 + TypeScript |
| **지원 플랫폼** | macOS, Windows, Linux, iOS, Android |
| **예상 개발 기간** | 3-4주 |

---

## Phase별 목차

| Phase | 문서 | 브랜치 | 예상 소요 |
|-------|------|--------|----------|
| 1 | [프로젝트 초기화](./01-project-setup.md) | `task/01-project-setup` | 1-2일 |
| 2 | [데이터베이스](./02-database.md) | `task/02-database` | 2-3일 |
| 3 | [핵심 기능](./03-core-features.md) | `task/03-core-features` | 3-4일 |
| 4 | [반응형 UI](./04-responsive-ui.md) | `task/04-responsive-ui` | 2-3일 |
| 5 | [통계 대시보드](./05-statistics.md) | `task/05-statistics` | 2일 |
| 6 | [내보내기/백업](./06-export-backup.md) | `task/06-export-backup` | 3일 |
| 7 | [앱 잠금](./07-app-lock.md) | `task/07-app-lock` | 2일 |
| 8 | [빌드/배포](./08-build-deploy.md) | `task/08-build-deploy` | 2-3일 |

---

## 예상 일정 (3-4주)

```
Week 1: Phase 1-2 (프로젝트 초기화, 데이터베이스)
├── Day 1-2: Tauri 프로젝트 설정, 폴더 구조
└── Day 3-5: SQLite 스키마, CRUD 커맨드

Week 2: Phase 3-4 (핵심 기능, 반응형 UI)
├── Day 1-4: 예약/디자이너/영업시간 관리
└── Day 5-7: 반응형 레이아웃, 네비게이션

Week 3: Phase 5-6 (통계, 내보내기/백업)
├── Day 1-2: 통계 대시보드
└── Day 3-5: Excel 내보내기, 클라우드 백업

Week 4: Phase 7-8 (앱 잠금, 빌드/배포)
├── Day 1-2: PIN/생체인증
└── Day 3-5: 플랫폼별 빌드, 배포 준비
```

---

## 기술 스택 요약

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.x | UI 프레임워크 |
| TypeScript | 5.x | 타입 시스템 |
| Vite | 5.x | 빌드 도구 |
| Tailwind CSS | 3.4.x | 스타일링 |
| Recharts | 2.x | 차트 |
| date-fns | 3.x | 날짜 처리 |

### Backend (Tauri)
| 기술 | 버전 | 용도 |
|------|------|------|
| Tauri | 2.x | 앱 프레임워크 |
| Rust | 1.75+ | 백엔드 로직 |
| rusqlite | 0.31.x | SQLite |
| rust_xlsxwriter | 0.79.x | Excel 생성 |
| keyring | 3.x | 보안 저장소 |
| bcrypt | 0.15.x | 해싱 |

---

## Git 브랜치 전략

### 브랜치 구조
```
main                    # 릴리즈 브랜치 (프로덕션)
└── develop             # 개발 통합 브랜치 (기준 브랜치)
    ├── task/01-project-setup
    ├── task/02-database
    ├── task/03-core-features
    ├── task/04-responsive-ui
    ├── task/05-statistics
    ├── task/06-export-backup
    ├── task/07-app-lock
    └── task/08-build-deploy
```

### 브랜치 명명 규칙
| 유형 | 패턴 | 예시 |
|------|------|------|
| **기준** | `develop` | 모든 task 브랜치의 base |
| **Task** | `task/[phase번호]-[phase명]` | `task/01-project-setup` |
| **Hotfix** | `hotfix/[이슈명]` | `hotfix/crash-on-startup` |
| **Release** | `release/[버전]` | `release/1.0.0` |

### 작업 흐름
```bash
# 1. develop에서 task 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b task/01-project-setup

# 2. 작업 및 커밋
git add .
git commit -m "feat(setup): Tauri 프로젝트 초기화"

# 3. develop으로 머지 (스쿼시 권장)
git checkout develop
git merge --squash task/01-project-setup
git commit -m "feat: Phase 1 - 프로젝트 초기화 완료"

# 4. task 브랜치 삭제
git branch -d task/01-project-setup
```

### 커밋 메시지 컨벤션
```
<type>(<scope>): <subject>

feat: 새 기능
fix: 버그 수정
docs: 문서 수정
refactor: 리팩토링
test: 테스트
chore: 기타 (빌드, 설정 등)
```

상세: [Git Workflow 문서](../references/git-workflow.md)

---

## 전체 완료 체크리스트

### Phase 1: 프로젝트 초기화
- [ ] Tauri 2.0 프로젝트 생성
- [ ] React + TypeScript + Vite 설정
- [ ] Tailwind CSS 설정
- [ ] iOS/Android 타겟 초기화
- [ ] 폴더 구조 생성
- [ ] **머지 완료**: `task/01-project-setup` → `develop`

### Phase 2: 데이터베이스
- [ ] SQLite 스키마 정의
- [ ] rusqlite 설정
- [ ] 마이그레이션 스크립트
- [ ] CRUD 커맨드 구현
- [ ] **머지 완료**: `task/02-database` → `develop`

### Phase 3: 핵심 기능
- [ ] 예약 관리 (CRUD + 상태)
- [ ] 디자이너 관리
- [ ] 영업시간 관리
- [ ] 고객 관리
- [ ] 기존 컴포넌트 마이그레이션
- [ ] **머지 완료**: `task/03-core-features` → `develop`

### Phase 4: 반응형 UI
- [ ] 브레이크포인트 설정
- [ ] 레이아웃 컴포넌트
- [ ] 적응형 네비게이션
- [ ] useDeviceType 훅
- [ ] 글라스모피즘 스타일
- [ ] **머지 완료**: `task/04-responsive-ui` → `develop`

### Phase 5: 통계 대시보드
- [ ] 통계 계산 로직
- [ ] 차트 컴포넌트
- [ ] 기간별 필터
- [ ] 반응형 차트
- [ ] **머지 완료**: `task/05-statistics` → `develop`

### Phase 6: 내보내기/백업
- [ ] Excel 내보내기
- [ ] CSV/JSON 내보내기
- [ ] iCloud 백업
- [ ] Google Drive 백업
- [ ] 복원 기능
- [ ] **머지 완료**: `task/06-export-backup` → `develop`

### Phase 7: 앱 잠금
- [ ] PIN 잠금
- [ ] 생체인증 (플랫폼별)
- [ ] 자동 잠금
- [ ] 보안 저장소
- [ ] **머지 완료**: `task/07-app-lock` → `develop`

### Phase 8: 빌드/배포
- [ ] macOS 빌드 (DMG)
- [ ] Windows 빌드 (MSI)
- [ ] Linux 빌드 (AppImage)
- [ ] iOS 빌드 (TestFlight)
- [ ] Android 빌드 (APK)
- [ ] **머지 완료**: `task/08-build-deploy` → `develop`

### 최종
- [ ] **릴리즈**: `develop` → `main` 머지
- [ ] 버전 태그 생성 (`v1.0.0`)

---

## 참조 문서

- [CLAUDE.md](../../CLAUDE.md) - AI 어시스턴트 가이드
- [Analysis Report](../analysis-report.md) - 기존 프로젝트 분석
- [API Mapping](../references/api-mapping.md) - API 변환 가이드
- [Git Workflow](../references/git-workflow.md) - Git 작업 흐름
- [Changelog](../progress/changelog.md) - 작업 이력

---

**문서 작성일**: 2026-01-21
**최종 수정일**: 2026-01-21
