use tauri::{AppHandle, Manager};

use crate::services::backup::{self, BackupInfo, CloudService};

#[tauri::command]
pub fn list_backups(app: AppHandle, service: String) -> Result<Vec<BackupInfo>, String> {
    let cloud_service = parse_cloud_service(&service)?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = backup::get_backup_dir(&app_data_dir)?;

    backup::list_backups(&backup_dir, &cloud_service)
}

#[tauri::command]
pub fn create_backup(app: AppHandle, service: String) -> Result<BackupInfo, String> {
    let cloud_service = parse_cloud_service(&service)?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data_dir.join("database.db");
    let backup_dir = backup::get_backup_dir(&app_data_dir)?;

    backup::create_backup(&db_path, &backup_dir, &cloud_service)
}

#[tauri::command]
pub fn restore_backup(
    app: AppHandle,
    backup_filename: String,
    _service: String,
) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let db_path = app_data_dir.join("database.db");
    let backup_dir = backup::get_backup_dir(&app_data_dir)?;

    backup::restore_backup(&backup_filename, &backup_dir, &db_path)
}

#[tauri::command]
pub fn delete_backup(app: AppHandle, backup_filename: String) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = backup::get_backup_dir(&app_data_dir)?;

    backup::delete_backup(&backup_filename, &backup_dir)
}

#[tauri::command]
pub fn cleanup_old_backups(app: AppHandle, keep_count: usize) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = backup::get_backup_dir(&app_data_dir)?;

    backup::cleanup_old_backups(&backup_dir, keep_count)
}

fn parse_cloud_service(service: &str) -> Result<CloudService, String> {
    match service.to_lowercase().as_str() {
        "icloud" => Ok(CloudService::Icloud),
        "google_drive" | "googledrive" => Ok(CloudService::GoogleDrive),
        "local" => Ok(CloudService::Local),
        _ => Err(format!("Invalid cloud service: {}", service)),
    }
}
