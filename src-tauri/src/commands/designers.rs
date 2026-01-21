use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use crate::db::DbState;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Designer {
    pub id: String,
    pub name: String,
    pub specialty: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDesignerInput {
    pub name: String,
    pub specialty: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDesignerInput {
    pub name: Option<String>,
    pub specialty: Option<String>,
    pub is_active: Option<bool>,
}

fn row_to_designer(row: &rusqlite::Row) -> rusqlite::Result<Designer> {
    let is_active_int: i32 = row.get(3)?;
    Ok(Designer {
        id: row.get(0)?,
        name: row.get(1)?,
        specialty: row.get(2)?,
        is_active: is_active_int == 1,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
    })
}

#[tauri::command]
pub fn get_designers(db: State<DbState>) -> Result<Vec<Designer>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut stmt = conn
        .prepare("SELECT * FROM designers ORDER BY name")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row_to_designer(row))
        .map_err(|e| e.to_string())?;

    let designers: Vec<Designer> = rows.filter_map(|r| r.ok()).collect();

    Ok(designers)
}

#[tauri::command]
pub fn get_active_designers(db: State<DbState>) -> Result<Vec<Designer>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut stmt = conn
        .prepare("SELECT * FROM designers WHERE is_active = 1 ORDER BY name")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row_to_designer(row))
        .map_err(|e| e.to_string())?;

    let designers: Vec<Designer> = rows.filter_map(|r| r.ok()).collect();

    Ok(designers)
}

#[tauri::command]
pub fn create_designer(
    data: CreateDesignerInput,
    db: State<DbState>,
) -> Result<Designer, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let is_active = data.is_active.unwrap_or(true);

    conn.execute(
        "INSERT INTO designers (id, name, specialty, is_active, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        rusqlite::params![
            id,
            data.name,
            data.specialty,
            if is_active { 1 } else { 0 },
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Designer {
        id,
        name: data.name,
        specialty: data.specialty,
        is_active,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_designer(
    id: String,
    data: UpdateDesignerInput,
    db: State<DbState>,
) -> Result<Designer, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // 기존 데이터 조회
    let current: Designer = conn
        .query_row("SELECT * FROM designers WHERE id = ?1", [&id], |row| {
            row_to_designer(row)
        })
        .map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let name = data.name.unwrap_or(current.name);
    let specialty = data.specialty.or(current.specialty);
    let is_active = data.is_active.unwrap_or(current.is_active);

    conn.execute(
        "UPDATE designers SET name = ?2, specialty = ?3, is_active = ?4, updated_at = ?5 WHERE id = ?1",
        rusqlite::params![id, name, specialty, if is_active { 1 } else { 0 }, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Designer {
        id,
        name,
        specialty,
        is_active,
        created_at: current.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub fn delete_designer(id: String, db: State<DbState>) -> Result<(), String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    conn.execute("DELETE FROM designers WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
