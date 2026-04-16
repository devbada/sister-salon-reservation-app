use tauri::State;
use tauri_plugin_opener::OpenerExt;
use crate::db::DbState;

#[tauri::command]
pub fn open_external_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_all_data(db: State<DbState>) -> Result<(), String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    conn.execute_batch(
        "DELETE FROM reservation_status_history;
         DELETE FROM reservations;
         DELETE FROM customers;
         DELETE FROM designers;
         DELETE FROM holidays;
         DELETE FROM app_settings;
         DELETE FROM business_hours;
         INSERT OR IGNORE INTO business_hours (id, day_of_week, open_time, close_time, is_closed) VALUES
            (0, 0, NULL, NULL, 1),
            (1, 1, '10:00', '20:00', 0),
            (2, 2, '10:00', '20:00', 0),
            (3, 3, '10:00', '20:00', 0),
            (4, 4, '10:00', '20:00', 0),
            (5, 5, '10:00', '20:00', 0),
            (6, 6, '10:00', '18:00', 0);"
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
