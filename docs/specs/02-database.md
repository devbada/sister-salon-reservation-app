# Phase 2: 데이터베이스

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/02-database` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 2-3일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/02-database
```

---

## 목표

SQLite 데이터베이스 스키마 정의 및 Tauri 커맨드를 통한 CRUD 작업 구현

## 산출물

- SQLite 스키마 정의 및 마이그레이션
- rusqlite 설정
- 기본 CRUD Tauri 커맨드

---

## SQLite 스키마 정의

### 전체 테이블 구조

```sql
-- 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    designer_id TEXT,
    service_type TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (designer_id) REFERENCES designers(id)
);

-- 예약 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_designer ON reservations(designer_id);

-- 디자이너 테이블
CREATE TABLE IF NOT EXISTS designers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 영업시간 테이블
CREATE TABLE IF NOT EXISTS business_hours (
    id INTEGER PRIMARY KEY,
    day_of_week INTEGER NOT NULL UNIQUE CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TEXT,
    close_time TEXT,
    break_start TEXT,
    break_end TEXT,
    is_closed INTEGER DEFAULT 0
);

-- 휴일 테이블
CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    description TEXT,
    is_recurring INTEGER DEFAULT 0
);

-- 고객 테이블
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 고객 인덱스
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 예약 상태 이력 테이블
CREATE TABLE IF NOT EXISTS reservation_status_history (
    id TEXT PRIMARY KEY,
    reservation_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- 앱 설정 테이블
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 기본 영업시간 데이터 삽입
INSERT OR IGNORE INTO business_hours (id, day_of_week, open_time, close_time, is_closed) VALUES
    (0, 0, NULL, NULL, 1),           -- 일요일 휴무
    (1, 1, '10:00', '20:00', 0),     -- 월요일
    (2, 2, '10:00', '20:00', 0),     -- 화요일
    (3, 3, '10:00', '20:00', 0),     -- 수요일
    (4, 4, '10:00', '20:00', 0),     -- 목요일
    (5, 5, '10:00', '20:00', 0),     -- 금요일
    (6, 6, '10:00', '18:00', 0);     -- 토요일
```

---

## Rust 구현

### src-tauri/src/db/mod.rs

```rust
use rusqlite::{Connection, Result};
use std::path::PathBuf;
use tauri::AppHandle;

pub mod schema;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");

        std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");

        let db_path = app_dir.join("database.db");
        let conn = Connection::open(db_path)?;

        // WAL 모드 활성화 (성능 향상)
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        let db = Database { conn };
        db.migrate()?;

        Ok(db)
    }

    fn migrate(&self) -> Result<()> {
        self.conn.execute_batch(schema::SCHEMA)?;
        Ok(())
    }

    pub fn conn(&self) -> &Connection {
        &self.conn
    }
}

// 전역 데이터베이스 상태
use std::sync::Mutex;
use tauri::Manager;

pub struct DbState(pub Mutex<Database>);

pub fn init_database(app: &AppHandle) -> Result<()> {
    let db = Database::new(app)?;
    app.manage(DbState(Mutex::new(db)));
    Ok(())
}
```

### src-tauri/src/db/schema.rs

```rust
pub const SCHEMA: &str = r#"
-- 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    designer_id TEXT,
    service_type TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (designer_id) REFERENCES designers(id)
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 디자이너 테이블
CREATE TABLE IF NOT EXISTS designers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 영업시간 테이블
CREATE TABLE IF NOT EXISTS business_hours (
    id INTEGER PRIMARY KEY,
    day_of_week INTEGER NOT NULL UNIQUE,
    open_time TEXT,
    close_time TEXT,
    break_start TEXT,
    break_end TEXT,
    is_closed INTEGER DEFAULT 0
);

-- 휴일 테이블
CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    description TEXT,
    is_recurring INTEGER DEFAULT 0
);

-- 고객 테이블
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 예약 상태 이력 테이블
CREATE TABLE IF NOT EXISTS reservation_status_history (
    id TEXT PRIMARY KEY,
    reservation_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- 앱 설정 테이블
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 기본 영업시간 데이터
INSERT OR IGNORE INTO business_hours (id, day_of_week, open_time, close_time, is_closed) VALUES
    (0, 0, NULL, NULL, 1),
    (1, 1, '10:00', '20:00', 0),
    (2, 2, '10:00', '20:00', 0),
    (3, 3, '10:00', '20:00', 0),
    (4, 4, '10:00', '20:00', 0),
    (5, 5, '10:00', '20:00', 0),
    (6, 6, '10:00', '18:00', 0);
"#;
```

### src-tauri/src/commands/reservations.rs

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use crate::db::DbState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Reservation {
    pub id: String,
    pub customer_name: String,
    pub customer_phone: Option<String>,
    pub date: String,
    pub time: String,
    pub designer_id: Option<String>,
    pub service_type: Option<String>,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateReservationInput {
    pub customer_name: String,
    pub customer_phone: Option<String>,
    pub date: String,
    pub time: String,
    pub designer_id: Option<String>,
    pub service_type: Option<String>,
    pub notes: Option<String>,
}

#[tauri::command]
pub fn get_reservations(
    date: Option<String>,
    db: State<DbState>,
) -> Result<Vec<Reservation>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let query = match &date {
        Some(_) => "SELECT * FROM reservations WHERE date = ?1 ORDER BY time",
        None => "SELECT * FROM reservations ORDER BY date DESC, time",
    };

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

    let rows = if let Some(d) = &date {
        stmt.query_map([d], |row| {
            Ok(Reservation {
                id: row.get(0)?,
                customer_name: row.get(1)?,
                customer_phone: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                designer_id: row.get(5)?,
                service_type: row.get(6)?,
                status: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
    } else {
        stmt.query_map([], |row| {
            Ok(Reservation {
                id: row.get(0)?,
                customer_name: row.get(1)?,
                customer_phone: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                designer_id: row.get(5)?,
                service_type: row.get(6)?,
                status: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
    }.map_err(|e| e.to_string())?;

    let reservations: Vec<Reservation> = rows
        .filter_map(|r| r.ok())
        .collect();

    Ok(reservations)
}

#[tauri::command]
pub fn create_reservation(
    data: CreateReservationInput,
    db: State<DbState>,
) -> Result<Reservation, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO reservations (id, customer_name, customer_phone, date, time, designer_id, service_type, status, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending', ?8, ?9, ?9)",
        rusqlite::params![
            id,
            data.customer_name,
            data.customer_phone,
            data.date,
            data.time,
            data.designer_id,
            data.service_type,
            data.notes,
            now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(Reservation {
        id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        date: data.date,
        time: data.time,
        designer_id: data.designer_id,
        service_type: data.service_type,
        status: "pending".to_string(),
        notes: data.notes,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_reservation(
    id: String,
    data: CreateReservationInput,
    db: State<DbState>,
) -> Result<Reservation, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "UPDATE reservations SET customer_name = ?2, customer_phone = ?3, date = ?4, time = ?5, designer_id = ?6, service_type = ?7, notes = ?8, updated_at = ?9 WHERE id = ?1",
        rusqlite::params![
            id,
            data.customer_name,
            data.customer_phone,
            data.date,
            data.time,
            data.designer_id,
            data.service_type,
            data.notes,
            now,
        ],
    ).map_err(|e| e.to_string())?;

    // 업데이트된 데이터 반환
    let reservation = conn.query_row(
        "SELECT * FROM reservations WHERE id = ?1",
        [&id],
        |row| {
            Ok(Reservation {
                id: row.get(0)?,
                customer_name: row.get(1)?,
                customer_phone: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                designer_id: row.get(5)?,
                service_type: row.get(6)?,
                status: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        },
    ).map_err(|e| e.to_string())?;

    Ok(reservation)
}

#[tauri::command]
pub fn delete_reservation(id: String, db: State<DbState>) -> Result<(), String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    conn.execute("DELETE FROM reservations WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn update_reservation_status(
    id: String,
    status: String,
    db: State<DbState>,
) -> Result<Reservation, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // 이전 상태 조회
    let old_status: String = conn.query_row(
        "SELECT status FROM reservations WHERE id = ?1",
        [&id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // 상태 업데이트
    conn.execute(
        "UPDATE reservations SET status = ?2, updated_at = ?3 WHERE id = ?1",
        rusqlite::params![id, status, now],
    ).map_err(|e| e.to_string())?;

    // 이력 기록
    let history_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO reservation_status_history (id, reservation_id, old_status, new_status, changed_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![history_id, id, old_status, status, now],
    ).map_err(|e| e.to_string())?;

    // 업데이트된 데이터 반환
    let reservation = conn.query_row(
        "SELECT * FROM reservations WHERE id = ?1",
        [&id],
        |row| {
            Ok(Reservation {
                id: row.get(0)?,
                customer_name: row.get(1)?,
                customer_phone: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                designer_id: row.get(5)?,
                service_type: row.get(6)?,
                status: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        },
    ).map_err(|e| e.to_string())?;

    Ok(reservation)
}
```

### src-tauri/src/main.rs

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;

use db::init_database;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            init_database(&app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 예약
            commands::reservations::get_reservations,
            commands::reservations::create_reservation,
            commands::reservations::update_reservation,
            commands::reservations::delete_reservation,
            commands::reservations::update_reservation_status,
            // 디자이너
            commands::designers::get_designers,
            commands::designers::get_active_designers,
            commands::designers::create_designer,
            commands::designers::update_designer,
            commands::designers::delete_designer,
            // 영업시간
            commands::business_hours::get_business_hours,
            commands::business_hours::update_business_hours,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 테스트 방법

### 1. 데이터베이스 생성 확인

```bash
# 앱 실행 후 데이터베이스 파일 확인
ls ~/Library/Application\ Support/sisters-salon-reservation-app/

# SQLite CLI로 스키마 확인
sqlite3 ~/Library/Application\ Support/sisters-salon-reservation-app/database.db ".schema"
```

### 2. Tauri 개발 서버에서 테스트

```typescript
// 브라우저 콘솔에서 테스트
import { invoke } from '@tauri-apps/api/core';

// 예약 생성 테스트
const result = await invoke('create_reservation', {
  data: {
    customerName: '테스트 고객',
    date: '2026-01-22',
    time: '10:00',
  }
});
console.log(result);

// 예약 조회 테스트
const reservations = await invoke('get_reservations', { date: '2026-01-22' });
console.log(reservations);
```

---

## 커밋 메시지 가이드

```bash
# 스키마 정의
git commit -m "feat(db): SQLite 스키마 정의 및 마이그레이션"

# 데이터베이스 모듈
git commit -m "feat(db): rusqlite 데이터베이스 모듈 구현"

# 예약 커맨드
git commit -m "feat(db): 예약 CRUD Tauri 커맨드 구현"

# 디자이너 커맨드
git commit -m "feat(db): 디자이너 CRUD Tauri 커맨드 구현"

# 영업시간 커맨드
git commit -m "feat(db): 영업시간 CRUD Tauri 커맨드 구현"
```

---

## 완료 기준 체크리스트

- [ ] SQLite 스키마 정의 완료
- [ ] 마이그레이션 자동 실행
- [ ] 예약 CRUD 커맨드 구현
- [ ] 디자이너 CRUD 커맨드 구현
- [ ] 영업시간 CRUD 커맨드 구현
- [ ] 예약 상태 변경 및 이력 기록
- [ ] Frontend에서 API 호출 테스트 성공

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. 앱 실행 시 데이터베이스 자동 생성
3. CRUD 작업 모두 정상 동작
4. 콘솔 에러 없음

```bash
# 머지 절차
git checkout develop
git merge --squash task/02-database
git commit -m "feat: Phase 2 - 데이터베이스 구축 완료

- SQLite 스키마 정의 (7개 테이블)
- rusqlite 데이터베이스 모듈
- 예약/디자이너/영업시간 CRUD 커맨드
- 예약 상태 이력 추적

Co-Authored-By: Claude <noreply@anthropic.com>"

# push는 사용자가 직접 수행
git branch -d task/02-database
```

---

## 다음 단계

Phase 3: [핵심 기능](./03-core-features.md)으로 진행
