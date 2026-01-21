# Git 워크플로우 가이드

프로젝트의 Git 브랜치 전략과 커밋 규칙을 정의합니다.

---

## 브랜치 전략

### 브랜치 구조

```
main                    # 프로덕션 릴리스
├── develop             # 개발 통합 브랜치
│   ├── task/01-project-setup
│   ├── task/02-database
│   ├── task/03-core-features
│   ├── task/04-responsive-ui
│   ├── task/05-statistics
│   ├── task/06-export-backup
│   ├── task/07-app-lock
│   └── task/08-build-deploy
└── hotfix/*            # 긴급 버그 수정
```

### 브랜치 명명 규칙

| 유형 | 패턴 | 예시 |
|------|------|------|
| 기능 개발 | `task/[phase]-[name]` | `task/01-project-setup` |
| 버그 수정 | `fix/[issue]-[description]` | `fix/123-reservation-crash` |
| 긴급 수정 | `hotfix/[version]-[description]` | `hotfix/1.0.1-login-error` |
| 실험 | `experiment/[description]` | `experiment/new-calendar` |

---

## 작업 흐름

### 1. 새 기능 개발

```bash
# 1. develop 브랜치 최신화
git checkout develop
git pull origin develop

# 2. 작업 브랜치 생성
git checkout -b task/01-project-setup

# 3. 작업 수행 및 커밋
git add .
git commit -m "feat(setup): Tauri 프로젝트 초기 생성"

# 4. 추가 작업 및 커밋
git add .
git commit -m "feat(setup): Tailwind CSS 반응형 설정 추가"

# 5. develop에 병합 (Squash Merge)
git checkout develop
git merge --squash task/01-project-setup
git commit -m "feat: Phase 1 - 프로젝트 초기화 완료

- Tauri 2.0 + React + TypeScript + Vite 설정
- Tailwind CSS 반응형 브레이크포인트 설정
- iOS/Android 타겟 초기화

Co-Authored-By: Claude <noreply@anthropic.com>"

# 6. 원격 저장소 푸시
git push origin develop

# 7. 작업 브랜치 삭제
git branch -d task/01-project-setup
```

### 2. 버그 수정

```bash
# 1. develop에서 수정 브랜치 생성
git checkout develop
git checkout -b fix/reservation-date-format

# 2. 버그 수정 및 커밋
git add .
git commit -m "fix(reservation): 날짜 포맷 오류 수정

- ISO 날짜 문자열 파싱 로직 수정
- 시간대 변환 처리 추가

Fixes #42"

# 3. develop에 병합
git checkout develop
git merge --squash fix/reservation-date-format
git commit -m "fix: 예약 날짜 포맷 오류 수정

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. 긴급 수정 (Hotfix)

```bash
# 1. main에서 hotfix 브랜치 생성
git checkout main
git checkout -b hotfix/1.0.1-crash-on-startup

# 2. 수정 및 커밋
git add .
git commit -m "fix: 앱 시작 시 크래시 수정"

# 3. main에 병합
git checkout main
git merge hotfix/1.0.1-crash-on-startup
git tag v1.0.1

# 4. develop에도 병합
git checkout develop
git merge hotfix/1.0.1-crash-on-startup

# 5. 푸시
git push origin main develop --tags

# 6. hotfix 브랜치 삭제
git branch -d hotfix/1.0.1-crash-on-startup
```

---

## 커밋 메시지 규칙

### 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (필수)

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 | `feat(reservation): 예약 생성 기능 추가` |
| `fix` | 버그 수정 | `fix(calendar): 날짜 선택 오류 수정` |
| `docs` | 문서 변경 | `docs: README 업데이트` |
| `style` | 코드 포맷팅 | `style: 코드 포맷팅 적용` |
| `refactor` | 리팩토링 | `refactor(api): API 호출 로직 개선` |
| `test` | 테스트 추가/수정 | `test: 예약 생성 테스트 추가` |
| `chore` | 빌드/설정 변경 | `chore: 의존성 업데이트` |
| `perf` | 성능 개선 | `perf: 쿼리 최적화` |
| `ci` | CI/CD 설정 | `ci: GitHub Actions 추가` |

### Scope (선택)

관련 모듈 또는 기능 영역:

- `setup`: 프로젝트 설정
- `db`: 데이터베이스
- `reservation`: 예약
- `designer`: 디자이너
- `business-hours`: 영업시간
- `statistics`: 통계
- `export`: 내보내기
- `backup`: 백업
- `security`: 보안/잠금
- `ui`: UI 컴포넌트
- `build`: 빌드 설정

### Subject (필수)

- 50자 이내
- 명령형 현재 시제 사용 (Add, Fix, Update...)
- 첫 글자 소문자
- 마침표 없음

### Body (선택)

- 72자 마다 줄바꿈
- What과 Why 설명 (How는 코드에서)
- 변경 이유, 이전 동작과의 차이점

### Footer (선택)

- 관련 이슈 참조: `Fixes #123`, `Closes #456`
- Breaking Changes: `BREAKING CHANGE: 설명`
- Co-Author: `Co-Authored-By: Name <email>`

### 예시

```bash
# 간단한 커밋
git commit -m "feat(reservation): 예약 상태 변경 기능 추가"

# 상세한 커밋
git commit -m "feat(backup): iCloud 백업 기능 구현

- CloudKit 프레임워크 연동
- 백업 파일 압축 및 암호화
- 자동 백업 스케줄링

Closes #78

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase별 브랜치 작업

### Phase 1: 프로젝트 초기화

```bash
git checkout develop
git checkout -b task/01-project-setup

# 작업 후
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
```

### Phase 2: 데이터베이스

```bash
git checkout develop
git checkout -b task/02-database

# 작업 후
git checkout develop
git merge --squash task/02-database
git commit -m "feat: Phase 2 - 데이터베이스 설정 완료

- SQLite 데이터베이스 스키마 설계
- Rust DB 모듈 구현
- 마이그레이션 시스템
- 초기 데이터 (영업시간)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Phase 3-8: 동일 패턴

각 Phase마다:
1. `develop`에서 `task/[phase]-[name]` 브랜치 생성
2. 작업 수행 및 중간 커밋
3. `develop`으로 Squash Merge
4. 작업 브랜치 삭제

---

## 릴리스 워크플로우

### 버전 태그

```bash
# 버전 업데이트 스크립트 실행
./scripts/bump-version.sh patch  # 1.0.0 -> 1.0.1
./scripts/bump-version.sh minor  # 1.0.0 -> 1.1.0
./scripts/bump-version.sh major  # 1.0.0 -> 2.0.0

# 변경사항 커밋
git add -A
git commit -m "chore: bump version to 1.0.1"

# develop에서 main으로 머지
git checkout main
git merge develop

# 태그 생성
git tag v1.0.1

# 푸시 (태그 포함)
git push origin main --tags
```

### 릴리스 노트 작성

```markdown
## v1.0.0 (2024-01-15)

### 새로운 기능
- 예약 관리 (생성, 수정, 삭제, 상태 변경)
- 디자이너 관리
- 영업시간 설정
- 통계 대시보드
- Excel/CSV 내보내기
- 클라우드 백업 (iCloud, Google Drive)
- 앱 잠금 (PIN, 생체인증)

### 지원 플랫폼
- macOS (Intel, Apple Silicon)
- Windows
- Linux
- iOS
- Android

### 알려진 이슈
- Windows에서 일부 폰트가 깨지는 현상 (#123)
```

---

## 코드 리뷰 가이드

### PR 체크리스트

- [ ] 코드가 정상적으로 빌드되는가?
- [ ] 테스트가 통과하는가?
- [ ] 코딩 스타일 가이드를 따르는가?
- [ ] 불필요한 파일이 포함되지 않았는가?
- [ ] 커밋 메시지가 규칙을 따르는가?
- [ ] 문서가 업데이트되었는가?

### 리뷰 포인트

1. **기능**: 요구사항을 충족하는가?
2. **디자인**: 아키텍처와 일관성이 있는가?
3. **복잡도**: 더 간단한 방법이 있는가?
4. **테스트**: 충분히 테스트되었는가?
5. **명명**: 변수/함수명이 명확한가?
6. **주석**: 코드가 자명하지 않은 부분에 주석이 있는가?
7. **보안**: 보안 취약점이 없는가?

---

## Git 명령어 참고

### 자주 사용하는 명령어

```bash
# 브랜치 목록
git branch -a

# 브랜치 전환
git checkout <branch>
git switch <branch>  # Git 2.23+

# 브랜치 생성 및 전환
git checkout -b <branch>
git switch -c <branch>  # Git 2.23+

# 변경사항 확인
git status
git diff
git diff --staged

# 스테이징
git add <file>
git add .
git add -p  # 대화형 추가

# 커밋
git commit -m "message"
git commit --amend  # 마지막 커밋 수정

# 히스토리
git log --oneline
git log --graph --oneline --all

# 원격 저장소
git fetch
git pull
git push

# Squash Merge
git merge --squash <branch>

# 작업 임시 저장
git stash
git stash pop
git stash list
```

### 되돌리기

```bash
# 스테이징 취소
git reset HEAD <file>
git restore --staged <file>  # Git 2.23+

# 변경사항 취소
git checkout -- <file>
git restore <file>  # Git 2.23+

# 커밋 되돌리기 (히스토리 유지)
git revert <commit>

# 커밋 되돌리기 (히스토리 삭제) - 주의!
git reset --hard <commit>
```

---

## 참고 문서

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [프로젝트 개요](../specs/00-overview.md)
