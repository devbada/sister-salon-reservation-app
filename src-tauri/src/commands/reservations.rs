use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use crate::db::DbState;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
pub struct CreateReservationInput {
    pub customer_name: String,
    pub customer_phone: Option<String>,
    pub date: String,
    pub time: String,
    pub designer_id: Option<String>,
    pub service_type: Option<String>,
    pub notes: Option<String>,
}

fn row_to_reservation(row: &rusqlite::Row) -> rusqlite::Result<Reservation> {
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
}

#[tauri::command]
pub fn get_reservations(
    date: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
    db: State<DbState>,
) -> Result<Vec<Reservation>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let reservations = if let Some(d) = date {
        // Single date filter (for calendar view)
        let mut stmt = conn
            .prepare("SELECT * FROM reservations WHERE date = ?1 ORDER BY time")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([d], |row| row_to_reservation(row))
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect()
    } else if date_from.is_some() || date_to.is_some() {
        // Date range filter
        match (date_from, date_to) {
            (Some(from), Some(to)) => {
                let mut stmt = conn
                    .prepare("SELECT * FROM reservations WHERE date >= ?1 AND date <= ?2 ORDER BY date DESC, time")
                    .map_err(|e| e.to_string())?;
                let rows = stmt
                    .query_map([from, to], |row| row_to_reservation(row))
                    .map_err(|e| e.to_string())?;
                rows.filter_map(|r| r.ok()).collect()
            }
            (Some(from), None) => {
                let mut stmt = conn
                    .prepare("SELECT * FROM reservations WHERE date >= ?1 ORDER BY date DESC, time")
                    .map_err(|e| e.to_string())?;
                let rows = stmt
                    .query_map([from], |row| row_to_reservation(row))
                    .map_err(|e| e.to_string())?;
                rows.filter_map(|r| r.ok()).collect()
            }
            (None, Some(to)) => {
                let mut stmt = conn
                    .prepare("SELECT * FROM reservations WHERE date <= ?1 ORDER BY date DESC, time")
                    .map_err(|e| e.to_string())?;
                let rows = stmt
                    .query_map([to], |row| row_to_reservation(row))
                    .map_err(|e| e.to_string())?;
                rows.filter_map(|r| r.ok()).collect()
            }
            _ => vec![]
        }
    } else {
        // No filter - return all reservations
        let mut stmt = conn
            .prepare("SELECT * FROM reservations ORDER BY date DESC, time")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| row_to_reservation(row))
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect()
    };

    Ok(reservations)
}

#[tauri::command]
pub fn get_reservation(
    id: String,
    db: State<DbState>,
) -> Result<Reservation, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

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
