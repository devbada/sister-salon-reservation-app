use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BusinessHours {
    pub id: i32,
    pub day_of_week: i32,
    pub open_time: Option<String>,
    pub close_time: Option<String>,
    pub break_start: Option<String>,
    pub break_end: Option<String>,
    pub is_closed: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBusinessHoursInput {
    pub day_of_week: i32,
    pub open_time: Option<String>,
    pub close_time: Option<String>,
    pub break_start: Option<String>,
    pub break_end: Option<String>,
    pub is_closed: bool,
}

#[tauri::command]
pub fn get_business_hours(db: State<DbState>) -> Result<Vec<BusinessHours>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut stmt = conn
        .prepare("SELECT id, day_of_week, open_time, close_time, break_start, break_end, is_closed FROM business_hours ORDER BY day_of_week")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let is_closed_int: i32 = row.get(6)?;
            Ok(BusinessHours {
                id: row.get(0)?,
                day_of_week: row.get(1)?,
                open_time: row.get(2)?,
                close_time: row.get(3)?,
                break_start: row.get(4)?,
                break_end: row.get(5)?,
                is_closed: is_closed_int == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    let hours: Vec<BusinessHours> = rows.filter_map(|r| r.ok()).collect();

    Ok(hours)
}

#[tauri::command]
pub fn update_business_hours(
    data: Vec<UpdateBusinessHoursInput>,
    db: State<DbState>,
) -> Result<(), String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    for hours in data {
        conn.execute(
            "UPDATE business_hours SET open_time = ?2, close_time = ?3, break_start = ?4, break_end = ?5, is_closed = ?6 WHERE day_of_week = ?1",
            rusqlite::params![
                hours.day_of_week,
                hours.open_time,
                hours.close_time,
                hours.break_start,
                hours.break_end,
                if hours.is_closed { 1 } else { 0 },
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}
