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
