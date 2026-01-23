use rusqlite::{Connection, Result};
use tauri::AppHandle;
use tauri::Manager;

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

        // 기존 customers 테이블에 새 필드 추가 (마이그레이션)
        let migrations = vec![
            "ALTER TABLE customers ADD COLUMN birthdate TEXT",
            "ALTER TABLE customers ADD COLUMN gender TEXT",
            "ALTER TABLE customers ADD COLUMN preferred_designer_id TEXT",
            "ALTER TABLE customers ADD COLUMN preferred_service TEXT",
            "ALTER TABLE customers ADD COLUMN allergies TEXT",
            "ALTER TABLE customers ADD COLUMN total_visits INTEGER DEFAULT 0",
            "ALTER TABLE customers ADD COLUMN last_visit_date TEXT",
            "ALTER TABLE customers ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))",
            // reservations 테이블에 customer_id 추가
            "ALTER TABLE reservations ADD COLUMN customer_id TEXT REFERENCES customers(id)",
        ];

        for migration in migrations {
            // 이미 존재하는 컬럼이면 에러 무시
            let _ = self.conn.execute(migration, []);
        }

        // customer_id 인덱스 추가 시도
        let _ = self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id)",
            []
        );

        Ok(())
    }

    pub fn conn(&self) -> &Connection {
        &self.conn
    }
}

// 전역 데이터베이스 상태
use std::sync::Mutex;

pub struct DbState(pub Mutex<Database>);

pub fn init_database(app: &AppHandle) -> Result<()> {
    let db = Database::new(app)?;
    app.manage(DbState(Mutex::new(db)));
    Ok(())
}
