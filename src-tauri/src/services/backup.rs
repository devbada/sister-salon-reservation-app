use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CloudService {
    Icloud,
    GoogleDrive,
    Local,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub id: String,
    pub service: CloudService,
    pub filename: String,
    pub size: u64,
    pub created_at: DateTime<Utc>,
}

/// Get the backup directory based on the cloud service
pub fn get_backup_dir_for_service(app_data_dir: &PathBuf, service: &CloudService) -> Result<PathBuf, String> {
    println!("[BackupService] get_backup_dir_for_service called with service: {:?}", service);
    println!("[BackupService] app_data_dir: {:?}", app_data_dir);

    let backup_dir = match service {
        CloudService::Icloud => {
            #[cfg(target_os = "ios")]
            {
                // On iOS, use the app's Documents directory which is visible in Files app
                // when UIFileSharingEnabled is true (set in Info.plist)
                // Users can access via: Files app > On My iPhone > Sisters Salon
                let home = std::env::var("HOME").map_err(|e| {
                    println!("[BackupService] Failed to get HOME: {}", e);
                    "Could not get HOME directory"
                })?;
                println!("[BackupService] HOME: {}", home);
                let documents_path = PathBuf::from(home)
                    .join("Documents")
                    .join("Backups");
                println!("[BackupService] iOS backup_dir: {:?}", documents_path);
                documents_path
            }
            #[cfg(target_os = "macos")]
            {
                // On macOS, use iCloud Drive path: ~/Library/Mobile Documents/com~apple~CloudDocs/SistersSalon/
                let home = std::env::var("HOME").map_err(|_| "Could not get HOME directory")?;
                let icloud_path = PathBuf::from(home)
                    .join("Library")
                    .join("Mobile Documents")
                    .join("com~apple~CloudDocs")
                    .join("SistersSalon")
                    .join("backups");
                println!("[BackupService] macOS backup_dir: {:?}", icloud_path);
                icloud_path
            }
            #[cfg(not(any(target_os = "macos", target_os = "ios")))]
            {
                // Fallback to local on non-Apple platforms
                let path = app_data_dir.join("backups");
                println!("[BackupService] Fallback backup_dir: {:?}", path);
                path
            }
        }
        CloudService::GoogleDrive => {
            // Google Drive is not implemented yet
            return Err("Google Drive 백업은 아직 지원되지 않습니다. 추후 업데이트를 기다려주세요.".to_string());
        }
        CloudService::Local => {
            let path = app_data_dir.join("backups");
            println!("[BackupService] Local backup_dir: {:?}", path);
            path
        }
    };

    println!("[BackupService] Creating backup directory: {:?}", backup_dir);
    std::fs::create_dir_all(&backup_dir).map_err(|e| {
        let err = format!("백업 디렉토리 생성 실패: {} (path: {:?})", e, backup_dir);
        println!("[BackupService] Error: {}", err);
        err
    })?;
    println!("[BackupService] Backup directory created/exists: {}", backup_dir.exists());

    Ok(backup_dir)
}

/// Legacy function for backward compatibility (defaults to local)
pub fn get_backup_dir(app_data_dir: &PathBuf) -> Result<PathBuf, String> {
    get_backup_dir_for_service(app_data_dir, &CloudService::Local)
}

pub fn create_backup(
    db_path: &PathBuf,
    backup_dir: &PathBuf,
    service: &CloudService,
) -> Result<BackupInfo, String> {
    println!("[BackupService] create_backup called");
    println!("[BackupService] db_path: {:?}", db_path);
    println!("[BackupService] backup_dir: {:?}", backup_dir);

    let backup_id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("salon_backup_{}.db", timestamp);
    let dest_path = backup_dir.join(&filename);

    println!("[BackupService] dest_path: {:?}", dest_path);

    // Check if source exists
    if !db_path.exists() {
        let err = format!("Source database does not exist: {:?}", db_path);
        println!("[BackupService] Error: {}", err);
        return Err(err);
    }

    // 데이터베이스 파일 복사
    println!("[BackupService] Copying database...");
    std::fs::copy(db_path, &dest_path).map_err(|e| {
        let err = format!("Failed to copy database: {} (from {:?} to {:?})", e, db_path, dest_path);
        println!("[BackupService] Error: {}", err);
        err
    })?;

    println!("[BackupService] Copy successful, getting metadata...");
    let metadata = std::fs::metadata(&dest_path).map_err(|e| {
        let err = format!("Failed to get metadata: {}", e);
        println!("[BackupService] Error: {}", err);
        err
    })?;

    println!("[BackupService] Backup created: {} ({} bytes)", filename, metadata.len());

    Ok(BackupInfo {
        id: backup_id,
        service: service.clone(),
        filename,
        size: metadata.len(),
        created_at: Utc::now(),
    })
}

pub fn restore_backup(
    backup_filename: &str,
    backup_dir: &PathBuf,
    db_path: &PathBuf,
) -> Result<(), String> {
    println!("[BackupService] restore_backup called");
    println!("[BackupService] backup_filename: {}", backup_filename);
    println!("[BackupService] backup_dir: {:?}", backup_dir);
    println!("[BackupService] db_path: {:?}", db_path);

    let backup_path = backup_dir.join(backup_filename);
    println!("[BackupService] backup_path: {:?}", backup_path);
    println!("[BackupService] backup_path exists: {}", backup_path.exists());

    if !backup_path.exists() {
        let err = format!("Backup file not found: {:?}", backup_path);
        println!("[BackupService] Error: {}", err);
        return Err(err);
    }

    // 현재 데이터베이스 백업 (복원 실패 시 복구용)
    let temp_backup = db_path.with_extension("db.bak");
    println!("[BackupService] temp_backup: {:?}", temp_backup);

    if db_path.exists() {
        println!("[BackupService] Creating temp backup...");
        std::fs::copy(db_path, &temp_backup).map_err(|e| {
            let err = format!("Failed to create temp backup: {}", e);
            println!("[BackupService] Error: {}", err);
            err
        })?;
    }

    // 복원
    println!("[BackupService] Restoring from backup...");
    match std::fs::copy(&backup_path, db_path) {
        Ok(_) => {
            println!("[BackupService] Restore successful");
            // 임시 백업 삭제
            let _ = std::fs::remove_file(&temp_backup);
            Ok(())
        }
        Err(e) => {
            println!("[BackupService] Restore failed: {}", e);
            // 복원 실패 시 원래 파일 복구
            if temp_backup.exists() {
                println!("[BackupService] Recovering from temp backup...");
                let _ = std::fs::copy(&temp_backup, db_path);
                let _ = std::fs::remove_file(&temp_backup);
            }
            Err(format!("Failed to restore backup: {}", e))
        }
    }
}

pub fn list_backups(backup_dir: &PathBuf, service: &CloudService) -> Result<Vec<BackupInfo>, String> {
    println!("[BackupService] list_backups called");
    println!("[BackupService] backup_dir: {:?}", backup_dir);
    println!("[BackupService] backup_dir exists: {}", backup_dir.exists());

    if !backup_dir.exists() {
        println!("[BackupService] Backup directory does not exist, returning empty list");
        return Ok(vec![]);
    }

    let entries = std::fs::read_dir(backup_dir).map_err(|e| {
        let err = format!("Failed to read backup directory: {}", e);
        println!("[BackupService] Error: {}", err);
        err
    })?;

    let mut backups = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        println!("[BackupService] Found file: {:?}", path);

        if path.extension().map(|e| e == "db").unwrap_or(false) {
            let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
            let filename = path.file_name().unwrap().to_string_lossy().to_string();

            // 파일명에서 ID 생성 (파일명 기반)
            let id = filename.replace("salon_backup_", "").replace(".db", "");

            println!("[BackupService] Adding backup: {} ({} bytes)", filename, metadata.len());

            backups.push(BackupInfo {
                id,
                service: service.clone(),
                filename: filename.clone(),
                size: metadata.len(),
                created_at: metadata
                    .modified()
                    .map(|t| DateTime::<Utc>::from(t))
                    .unwrap_or_else(|_| Utc::now()),
            });
        }
    }

    println!("[BackupService] Found {} backups", backups.len());

    // 최신순 정렬
    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(backups)
}

pub fn delete_backup(backup_filename: &str, backup_dir: &PathBuf) -> Result<(), String> {
    let backup_path = backup_dir.join(backup_filename);

    if !backup_path.exists() {
        return Err("Backup file not found".to_string());
    }

    std::fs::remove_file(&backup_path).map_err(|e| format!("Failed to delete backup: {}", e))?;
    Ok(())
}

// 오래된 백업 정리 (keep_count 개수만 유지)
pub fn cleanup_old_backups(backup_dir: &PathBuf, keep_count: usize) -> Result<(), String> {
    let mut backups = list_backups(backup_dir, &CloudService::Local)?;

    if backups.len() <= keep_count {
        return Ok(());
    }

    // 삭제할 백업 (오래된 것부터)
    backups.sort_by(|a, b| a.created_at.cmp(&b.created_at));
    let to_delete = backups.len() - keep_count;

    for backup in backups.iter().take(to_delete) {
        delete_backup(&backup.filename, backup_dir)?;
    }

    Ok(())
}
