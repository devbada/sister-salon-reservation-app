use tauri::{AppHandle, Manager, State};

use crate::db::DbState;
use crate::services::excel;

#[tauri::command]
pub fn export_to_excel(
    app: AppHandle,
    period: String,
    db: State<DbState>,
) -> Result<String, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // 다운로드 디렉토리 가져오기
    let download_dir = app
        .path()
        .download_dir()
        .map_err(|e| e.to_string())?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("reservations_{}.xlsx", timestamp);
    let output_path = download_dir.join(&filename);

    let result_path = excel::export_reservations(conn, &period, output_path)?;
    Ok(result_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn export_to_csv(
    app: AppHandle,
    period: String,
    db: State<DbState>,
) -> Result<String, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // 다운로드 디렉토리 가져오기
    let download_dir = app
        .path()
        .download_dir()
        .map_err(|e| e.to_string())?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("reservations_{}.csv", timestamp);
    let output_path = download_dir.join(&filename);

    let result_path = excel::export_to_csv(conn, &period, output_path)?;
    Ok(result_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_export_path(app: AppHandle) -> Result<String, String> {
    let download_dir = app
        .path()
        .download_dir()
        .map_err(|e| e.to_string())?;

    Ok(download_dir.to_string_lossy().to_string())
}
