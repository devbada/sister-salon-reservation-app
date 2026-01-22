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

pub fn get_backup_dir(app_data_dir: &PathBuf) -> Result<PathBuf, String> {
    let backup_dir = app_data_dir.join("backups");
    std::fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
    Ok(backup_dir)
}

pub fn create_backup(
    db_path: &PathBuf,
    backup_dir: &PathBuf,
    service: &CloudService,
) -> Result<BackupInfo, String> {
    let backup_id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("salon_backup_{}.db", timestamp);
    let dest_path = backup_dir.join(&filename);

    // 데이터베이스 파일 복사
    std::fs::copy(db_path, &dest_path).map_err(|e| format!("Failed to copy database: {}", e))?;

    let metadata = std::fs::metadata(&dest_path).map_err(|e| e.to_string())?;

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
    let backup_path = backup_dir.join(backup_filename);

    if !backup_path.exists() {
        return Err("Backup file not found".to_string());
    }

    // 현재 데이터베이스 백업 (복원 실패 시 복구용)
    let temp_backup = db_path.with_extension("db.bak");
    if db_path.exists() {
        std::fs::copy(db_path, &temp_backup).map_err(|e| e.to_string())?;
    }

    // 복원
    match std::fs::copy(&backup_path, db_path) {
        Ok(_) => {
            // 임시 백업 삭제
            let _ = std::fs::remove_file(&temp_backup);
            Ok(())
        }
        Err(e) => {
            // 복원 실패 시 원래 파일 복구
            if temp_backup.exists() {
                let _ = std::fs::copy(&temp_backup, db_path);
                let _ = std::fs::remove_file(&temp_backup);
            }
            Err(format!("Failed to restore backup: {}", e))
        }
    }
}

pub fn list_backups(backup_dir: &PathBuf, service: &CloudService) -> Result<Vec<BackupInfo>, String> {
    if !backup_dir.exists() {
        return Ok(vec![]);
    }

    let entries = std::fs::read_dir(backup_dir).map_err(|e| e.to_string())?;
    let mut backups = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().map(|e| e == "db").unwrap_or(false) {
            let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
            let filename = path.file_name().unwrap().to_string_lossy().to_string();

            // 파일명에서 ID 생성 (파일명 기반)
            let id = filename.replace("salon_backup_", "").replace(".db", "");

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
