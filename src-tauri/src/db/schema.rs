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
    phone TEXT UNIQUE,
    email TEXT,
    birthdate TEXT,
    gender TEXT CHECK(gender IN ('male', 'female', 'other') OR gender IS NULL),
    preferred_designer_id TEXT REFERENCES designers(id),
    preferred_service TEXT,
    allergies TEXT,
    total_visits INTEGER DEFAULT 0,
    last_visit_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

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
