use tauri::{AppHandle, Manager};

use crate::services::backup::{self, BackupInfo, CloudService};
use crate::services::cloudkit;

// Maximum number of backups to keep in CloudKit
const MAX_CLOUDKIT_BACKUPS: usize = 10;

#[tauri::command]
pub fn list_backups(app: AppHandle, service: String) -> Result<Vec<BackupInfo>, String> {
    println!("[Backup] list_backups called with service: {}", service);

    let cloud_service = parse_cloud_service(&service)?;

    // For iCloud, fetch from CloudKit
    if cloud_service == CloudService::Icloud {
        return list_cloudkit_backups_as_info();
    }

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

/// Convert CloudKit JSON to BackupInfo list
fn list_cloudkit_backups_as_info() -> Result<Vec<BackupInfo>, String> {
    let json_str = cloudkit::list_cloudkit_backups()?;
    println!("[Backup] CloudKit returned: {}", json_str);

    // Parse JSON
    let items: Vec<serde_json::Value> = serde_json::from_str(&json_str)
        .map_err(|e| format!("JSON 파싱 오류: {}", e))?;

    let mut backups = Vec::new();
    for item in items {
        let id = item["id"].as_str().unwrap_or("").to_string();
        let filename = item["filename"].as_str().unwrap_or(&id).to_string();
        let size = item["size"].as_u64().unwrap_or(0);
        let created_at_str = item["createdAt"].as_str().unwrap_or("");

        let created_at = if !created_at_str.is_empty() {
            chrono::DateTime::parse_from_rfc3339(created_at_str)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now())
        } else {
            chrono::Utc::now()
        };

        backups.push(BackupInfo {
            id,
            service: CloudService::Icloud,
            filename,
            size,
            created_at,
        });
    }

    println!("[Backup] Parsed {} CloudKit backups", backups.len());
    Ok(backups)
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

                // Auto-cleanup: delete old backups if we have more than MAX_CLOUDKIT_BACKUPS
                if let Err(e) = cleanup_old_cloudkit_backups() {
                    println!("[Backup] CloudKit cleanup warning: {}", e);
                }
            }
            Err(e) => {
                println!("[Backup] CloudKit upload failed (local backup saved): {}", e);
            }
        }
    }

    Ok(backup_info)
}

/// Auto-cleanup old CloudKit backups, keeping only MAX_CLOUDKIT_BACKUPS
fn cleanup_old_cloudkit_backups() -> Result<(), String> {
    println!("[Backup] Checking CloudKit backup count...");

    let json_str = cloudkit::list_cloudkit_backups()?;
    let items: Vec<serde_json::Value> = serde_json::from_str(&json_str)
        .map_err(|e| format!("JSON 파싱 오류: {}", e))?;

    let count = items.len();
    println!("[Backup] Current CloudKit backup count: {}", count);

    if count <= MAX_CLOUDKIT_BACKUPS {
        println!("[Backup] No cleanup needed (count <= {})", MAX_CLOUDKIT_BACKUPS);
        return Ok(());
    }

    // Items are sorted by createdDate descending, so older ones are at the end
    let to_delete = count - MAX_CLOUDKIT_BACKUPS;
    println!("[Backup] Will delete {} old backup(s)", to_delete);

    for item in items.iter().skip(MAX_CLOUDKIT_BACKUPS) {
        if let Some(id) = item["id"].as_str() {
            println!("[Backup] Deleting old backup: {}", id);
            if let Err(e) = cloudkit::delete_cloudkit_backup(id) {
                println!("[Backup] Failed to delete {}: {}", id, e);
            }
        }
    }

    println!("[Backup] CloudKit cleanup completed");
    Ok(())
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

    // For iCloud, download from CloudKit first if not exists locally
    if cloud_service == CloudService::Icloud && !backup_file_path.exists() {
        println!("[Backup] Downloading from CloudKit...");

        // Ensure backup directory exists
        if !backup_dir.exists() {
            std::fs::create_dir_all(&backup_dir).map_err(|e| {
                format!("백업 디렉토리 생성 실패: {}", e)
            })?;
        }

        let dest_path = backup_file_path.to_string_lossy().to_string();
        cloudkit::download_cloudkit_backup(&backup_filename, &dest_path)?;
        println!("[Backup] CloudKit download successful");
    }

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

    // For iCloud, delete from CloudKit using the filename as record ID
    if cloud_service == CloudService::Icloud {
        println!("[Backup] Deleting from CloudKit: {}", backup_filename);
        return cloudkit::delete_cloudkit_backup(&backup_filename);
    }

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
