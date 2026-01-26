use tauri::{AppHandle, Manager};

use crate::services::backup::{self, BackupInfo, CloudService};
use crate::services::cloudkit;

#[tauri::command]
pub fn list_backups(app: AppHandle, service: String) -> Result<Vec<BackupInfo>, String> {
    println!("[Backup] list_backups called with service: {}", service);

    let cloud_service = parse_cloud_service(&service)?;
    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        let err = format!("Failed to get app_data_dir: {}", e);
        println!("[Backup] Error: {}", err);
        err
    })?;

    println!("[Backup] app_data_dir: {:?}", app_data_dir);

    let backup_dir = backup::get_backup_dir_for_service(&app_data_dir, &cloud_service)?;
    println!("[Backup] backup_dir: {:?}", backup_dir);
    println!("[Backup] backup_dir exists: {}", backup_dir.exists());

    let result = backup::list_backups(&backup_dir, &cloud_service);
    match &result {
        Ok(backups) => println!("[Backup] Found {} backups", backups.len()),
        Err(e) => println!("[Backup] Error listing backups: {}", e),
    }

    result
}

#[tauri::command]
pub fn create_backup(app: AppHandle, service: String) -> Result<BackupInfo, String> {
    println!("[Backup] create_backup called with service: {}", service);

    let cloud_service = parse_cloud_service(&service)?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        let err = format!("Failed to get app_data_dir: {}", e);
        println!("[Backup] Error: {}", err);
        err
    })?;

    println!("[Backup] app_data_dir: {:?}", app_data_dir);

    let db_path = app_data_dir.join("database.db");
    println!("[Backup] db_path: {:?}", db_path);
    println!("[Backup] db_path exists: {}", db_path.exists());

    if !db_path.exists() {
        let err = format!("데이터베이스 파일이 없습니다: {:?}", db_path);
        println!("[Backup] Error: {}", err);
        return Err(err);
    }

    // Get database file size for debugging
    if let Ok(metadata) = std::fs::metadata(&db_path) {
        println!("[Backup] db file size: {} bytes", metadata.len());
    }

    let backup_dir = backup::get_backup_dir_for_service(&app_data_dir, &cloud_service)?;
    println!("[Backup] backup_dir: {:?}", backup_dir);

    // Create backup
    let backup_info = backup::create_backup(&db_path, &backup_dir, &cloud_service).map_err(|e| {
        println!("[Backup] Error creating backup: {}", e);
        e
    })?;

    println!("[Backup] Backup created successfully: {}", backup_info.filename);

    // Verify the backup file was created
    let backup_file_path = backup_dir.join(&backup_info.filename);
    if backup_file_path.exists() {
        if let Ok(metadata) = std::fs::metadata(&backup_file_path) {
            println!("[Backup] Backup file size: {} bytes", metadata.len());
        }
    } else {
        println!("[Backup] Warning: Backup file not found after creation!");
    }

    // For iCloud, also upload to CloudKit
    if cloud_service == CloudService::Icloud {
        let backup_path_str = backup_file_path.to_string_lossy().to_string();

        match cloudkit::upload_to_cloudkit(&backup_path_str) {
            Ok(record_id) => {
                println!("[Backup] CloudKit upload successful: {}", record_id);
            }
            Err(e) => {
                println!("[Backup] CloudKit upload failed (local backup saved): {}", e);
            }
        }
    }

    Ok(backup_info)
}

#[tauri::command]
pub fn restore_backup(
    app: AppHandle,
    backup_filename: String,
    service: String,
) -> Result<(), String> {
    println!("[Backup] restore_backup called: filename={}, service={}", backup_filename, service);

    let cloud_service = parse_cloud_service(&service)?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| {
        let err = format!("Failed to get app_data_dir: {}", e);
        println!("[Backup] Error: {}", err);
        err
    })?;

    let db_path = app_data_dir.join("database.db");
    let backup_dir = backup::get_backup_dir_for_service(&app_data_dir, &cloud_service)?;

    println!("[Backup] db_path: {:?}", db_path);
    println!("[Backup] backup_dir: {:?}", backup_dir);

    let backup_file_path = backup_dir.join(&backup_filename);
    println!("[Backup] backup_file_path: {:?}", backup_file_path);
    println!("[Backup] backup_file exists: {}", backup_file_path.exists());

    if !backup_file_path.exists() {
        let err = format!("백업 파일을 찾을 수 없습니다: {:?}", backup_file_path);
        println!("[Backup] Error: {}", err);
        return Err(err);
    }

    let result = backup::restore_backup(&backup_filename, &backup_dir, &db_path);
    match &result {
        Ok(_) => println!("[Backup] Restore successful"),
        Err(e) => println!("[Backup] Restore failed: {}", e),
    }

    result
}

#[tauri::command]
pub fn delete_backup(app: AppHandle, backup_filename: String, service: String) -> Result<(), String> {
    println!("[Backup] delete_backup called: filename={}, service={}", backup_filename, service);

    let cloud_service = parse_cloud_service(&service)?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = backup::get_backup_dir_for_service(&app_data_dir, &cloud_service)?;

    let result = backup::delete_backup(&backup_filename, &backup_dir);
    match &result {
        Ok(_) => println!("[Backup] Delete successful"),
        Err(e) => println!("[Backup] Delete failed: {}", e),
    }

    result
}

#[tauri::command]
pub fn cleanup_old_backups(app: AppHandle, keep_count: usize, service: String) -> Result<(), String> {
    println!("[Backup] cleanup_old_backups called: keep_count={}, service={}", keep_count, service);

    let cloud_service = parse_cloud_service(&service)?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = backup::get_backup_dir_for_service(&app_data_dir, &cloud_service)?;

    backup::cleanup_old_backups(&backup_dir, keep_count)
}

/// Check if iCloud/CloudKit is available on this device
#[tauri::command]
pub fn is_icloud_available() -> bool {
    let result = cloudkit::is_cloudkit_available();
    println!("[Backup] is_icloud_available: {}", result);
    result
}

/// Debug command to get current paths
#[tauri::command]
pub fn get_backup_debug_info(app: AppHandle, service: String) -> Result<String, String> {
    let cloud_service = parse_cloud_service(&service)?;
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = backup::get_backup_dir_for_service(&app_data_dir, &cloud_service)?;
    let db_path = app_data_dir.join("database.db");

    let info = format!(
        "app_data_dir: {:?}\nbackup_dir: {:?}\nbackup_dir_exists: {}\ndb_path: {:?}\ndb_exists: {}",
        app_data_dir,
        backup_dir,
        backup_dir.exists(),
        db_path,
        db_path.exists()
    );

    Ok(info)
}

fn parse_cloud_service(service: &str) -> Result<CloudService, String> {
    match service.to_lowercase().as_str() {
        "icloud" => Ok(CloudService::Icloud),
        "google_drive" | "googledrive" => Ok(CloudService::GoogleDrive),
        "local" => Ok(CloudService::Local),
        _ => Err(format!("Invalid cloud service: {}", service)),
    }
}
