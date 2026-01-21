# Phase 6: 내보내기 & 백업

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/06-export-backup` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 3-4일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/06-export-backup
```

---

## 목표

예약 데이터를 Excel/CSV로 내보내고, 클라우드 서비스를 통한 백업/복원 기능을 구현합니다.

## 산출물

- Excel/CSV 내보내기 기능 (rust_xlsxwriter)
- iCloud 백업/복원 (iOS/macOS)
- Google Drive 백업/복원 (Android)
- 로컬 백업/복원 (모든 플랫폼)
- 자동 백업 스케줄링

---

## 사전 요구사항

- Phase 2 (데이터베이스) 완료
- Phase 3 (핵심 기능) 완료
- 클라우드 서비스 설정 (선택)

---

## 구현 내용

### 1. Rust Excel 내보내기 서비스

#### src-tauri/src/services/excel.rs
```rust
use rust_xlsxwriter::{Workbook, Format, FormatAlign, Color};
use chrono::{NaiveDate, Datelike};
use crate::db::Database;
use std::path::PathBuf;

pub struct ExcelExporter {
    db: Database,
}

impl ExcelExporter {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub fn export_reservations(
        &self,
        period: &str,
        output_path: Option<PathBuf>,
    ) -> Result<PathBuf, String> {
        let reservations = self.get_reservations_for_period(period)?;

        let mut workbook = Workbook::new();
        let worksheet = workbook.add_worksheet();

        // 헤더 스타일
        let header_format = Format::new()
            .set_bold()
            .set_align(FormatAlign::Center)
            .set_background_color(Color::RGB(0x4F46E5))
            .set_font_color(Color::White);

        // 헤더 작성
        let headers = ["날짜", "시간", "고객명", "연락처", "디자이너", "서비스", "상태", "메모"];
        for (col, header) in headers.iter().enumerate() {
            worksheet.write_string_with_format(0, col as u16, *header, &header_format)
                .map_err(|e| e.to_string())?;
        }

        // 데이터 스타일
        let date_format = Format::new().set_align(FormatAlign::Center);
        let text_format = Format::new();

        // 데이터 작성
        for (row, reservation) in reservations.iter().enumerate() {
            let row = (row + 1) as u32;

            worksheet.write_string_with_format(row, 0, &reservation.date, &date_format)?;
            worksheet.write_string_with_format(row, 1, &reservation.time, &date_format)?;
            worksheet.write_string_with_format(row, 2, &reservation.customer_name, &text_format)?;
            worksheet.write_string_with_format(row, 3, reservation.customer_phone.as_deref().unwrap_or("-"), &text_format)?;
            worksheet.write_string_with_format(row, 4, reservation.designer_name.as_deref().unwrap_or("-"), &text_format)?;
            worksheet.write_string_with_format(row, 5, reservation.service_type.as_deref().unwrap_or("-"), &text_format)?;
            worksheet.write_string_with_format(row, 6, &self.status_to_korean(&reservation.status), &text_format)?;
            worksheet.write_string_with_format(row, 7, reservation.notes.as_deref().unwrap_or(""), &text_format)?;
        }

        // 열 너비 설정
        worksheet.set_column_width(0, 12)?; // 날짜
        worksheet.set_column_width(1, 8)?;  // 시간
        worksheet.set_column_width(2, 15)?; // 고객명
        worksheet.set_column_width(3, 15)?; // 연락처
        worksheet.set_column_width(4, 12)?; // 디자이너
        worksheet.set_column_width(5, 15)?; // 서비스
        worksheet.set_column_width(6, 10)?; // 상태
        worksheet.set_column_width(7, 30)?; // 메모

        // 파일 저장
        let path = output_path.unwrap_or_else(|| {
            let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
            PathBuf::from(format!("reservations_{}.xlsx", timestamp))
        });

        workbook.save(&path).map_err(|e| e.to_string())?;
        Ok(path)
    }

    pub fn export_statistics(
        &self,
        start_date: &str,
        end_date: &str,
        output_path: Option<PathBuf>,
    ) -> Result<PathBuf, String> {
        let mut workbook = Workbook::new();

        // 일별 통계 시트
        self.write_daily_stats_sheet(&mut workbook, start_date, end_date)?;

        // 디자이너별 통계 시트
        self.write_designer_stats_sheet(&mut workbook, start_date, end_date)?;

        // 서비스별 통계 시트
        self.write_service_stats_sheet(&mut workbook, start_date, end_date)?;

        let path = output_path.unwrap_or_else(|| {
            let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
            PathBuf::from(format!("statistics_{}.xlsx", timestamp))
        });

        workbook.save(&path).map_err(|e| e.to_string())?;
        Ok(path)
    }

    fn get_reservations_for_period(&self, period: &str) -> Result<Vec<ReservationExport>, String> {
        let (start_date, end_date) = match period {
            "this_month" => {
                let now = chrono::Local::now();
                let start = NaiveDate::from_ymd_opt(now.year(), now.month(), 1).unwrap();
                let end = start.with_month(now.month() + 1)
                    .unwrap_or(start.with_year(now.year() + 1).unwrap().with_month(1).unwrap())
                    - chrono::Duration::days(1);
                (start.to_string(), end.to_string())
            }
            "last_3_months" => {
                let now = chrono::Local::now();
                let end = now.date_naive();
                let start = end - chrono::Duration::days(90);
                (start.to_string(), end.to_string())
            }
            "all" => ("1970-01-01".to_string(), "2099-12-31".to_string()),
            _ => return Err("Invalid period".to_string()),
        };

        self.db.get_reservations_for_export(&start_date, &end_date)
    }

    fn status_to_korean(&self, status: &str) -> String {
        match status {
            "pending" => "대기중",
            "confirmed" => "확정",
            "completed" => "완료",
            "cancelled" => "취소",
            "no_show" => "노쇼",
            _ => status,
        }.to_string()
    }

    fn write_daily_stats_sheet(&self, workbook: &mut Workbook, start_date: &str, end_date: &str) -> Result<(), String> {
        let worksheet = workbook.add_worksheet().set_name("일별 통계")?;
        // 구현...
        Ok(())
    }

    fn write_designer_stats_sheet(&self, workbook: &mut Workbook, start_date: &str, end_date: &str) -> Result<(), String> {
        let worksheet = workbook.add_worksheet().set_name("디자이너별 통계")?;
        // 구현...
        Ok(())
    }

    fn write_service_stats_sheet(&self, workbook: &mut Workbook, start_date: &str, end_date: &str) -> Result<(), String> {
        let worksheet = workbook.add_worksheet().set_name("서비스별 통계")?;
        // 구현...
        Ok(())
    }
}

#[derive(Debug)]
pub struct ReservationExport {
    pub date: String,
    pub time: String,
    pub customer_name: String,
    pub customer_phone: Option<String>,
    pub designer_name: Option<String>,
    pub service_type: Option<String>,
    pub status: String,
    pub notes: Option<String>,
}
```

### 2. Rust 클라우드 백업 서비스

#### src-tauri/src/services/cloud.rs
```rust
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CloudService {
    ICloud,
    GoogleDrive,
    Local,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub id: String,
    pub service: CloudService,
    pub filename: String,
    pub size: u64,
    pub created_at: DateTime<Utc>,
}

pub struct CloudBackup {
    service: CloudService,
}

impl CloudBackup {
    pub fn new(service: CloudService) -> Self {
        Self { service }
    }

    pub async fn backup(&self, db_path: &PathBuf) -> Result<BackupInfo, String> {
        let backup_id = uuid::Uuid::new_v4().to_string();
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let filename = format!("salon_backup_{}.db", timestamp);

        match self.service {
            CloudService::ICloud => self.backup_to_icloud(db_path, &filename, &backup_id).await,
            CloudService::GoogleDrive => self.backup_to_google_drive(db_path, &filename, &backup_id).await,
            CloudService::Local => self.backup_to_local(db_path, &filename, &backup_id).await,
        }
    }

    pub async fn restore(&self, backup_id: &str, target_path: &PathBuf) -> Result<(), String> {
        match self.service {
            CloudService::ICloud => self.restore_from_icloud(backup_id, target_path).await,
            CloudService::GoogleDrive => self.restore_from_google_drive(backup_id, target_path).await,
            CloudService::Local => self.restore_from_local(backup_id, target_path).await,
        }
    }

    pub async fn list_backups(&self) -> Result<Vec<BackupInfo>, String> {
        match self.service {
            CloudService::ICloud => self.list_icloud_backups().await,
            CloudService::GoogleDrive => self.list_google_drive_backups().await,
            CloudService::Local => self.list_local_backups().await,
        }
    }

    // iCloud 백업 (iOS/macOS)
    #[cfg(any(target_os = "ios", target_os = "macos"))]
    async fn backup_to_icloud(&self, db_path: &PathBuf, filename: &str, backup_id: &str) -> Result<BackupInfo, String> {
        use std::fs;

        // iCloud Documents 경로 가져오기
        let icloud_path = self.get_icloud_documents_path()?;
        let backup_dir = icloud_path.join("Backups");
        fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

        let dest_path = backup_dir.join(filename);
        fs::copy(db_path, &dest_path).map_err(|e| e.to_string())?;

        let metadata = fs::metadata(&dest_path).map_err(|e| e.to_string())?;

        Ok(BackupInfo {
            id: backup_id.to_string(),
            service: CloudService::ICloud,
            filename: filename.to_string(),
            size: metadata.len(),
            created_at: Utc::now(),
        })
    }

    #[cfg(not(any(target_os = "ios", target_os = "macos")))]
    async fn backup_to_icloud(&self, _db_path: &PathBuf, _filename: &str, _backup_id: &str) -> Result<BackupInfo, String> {
        Err("iCloud is not available on this platform".to_string())
    }

    // Google Drive 백업 (Android)
    #[cfg(target_os = "android")]
    async fn backup_to_google_drive(&self, db_path: &PathBuf, filename: &str, backup_id: &str) -> Result<BackupInfo, String> {
        // Android Google Drive API 사용
        // SAF (Storage Access Framework) 통해 구현
        todo!("Implement Google Drive backup for Android")
    }

    #[cfg(not(target_os = "android"))]
    async fn backup_to_google_drive(&self, _db_path: &PathBuf, _filename: &str, _backup_id: &str) -> Result<BackupInfo, String> {
        Err("Google Drive backup is only available on Android".to_string())
    }

    // 로컬 백업 (모든 플랫폼)
    async fn backup_to_local(&self, db_path: &PathBuf, filename: &str, backup_id: &str) -> Result<BackupInfo, String> {
        use std::fs;

        let backup_dir = self.get_local_backup_path()?;
        fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

        let dest_path = backup_dir.join(filename);
        fs::copy(db_path, &dest_path).map_err(|e| e.to_string())?;

        let metadata = fs::metadata(&dest_path).map_err(|e| e.to_string())?;

        Ok(BackupInfo {
            id: backup_id.to_string(),
            service: CloudService::Local,
            filename: filename.to_string(),
            size: metadata.len(),
            created_at: Utc::now(),
        })
    }

    // 복원 함수들
    #[cfg(any(target_os = "ios", target_os = "macos"))]
    async fn restore_from_icloud(&self, backup_id: &str, target_path: &PathBuf) -> Result<(), String> {
        let backups = self.list_icloud_backups().await?;
        let backup = backups.iter().find(|b| b.id == backup_id)
            .ok_or("Backup not found")?;

        let icloud_path = self.get_icloud_documents_path()?;
        let backup_path = icloud_path.join("Backups").join(&backup.filename);

        std::fs::copy(backup_path, target_path).map_err(|e| e.to_string())?;
        Ok(())
    }

    #[cfg(not(any(target_os = "ios", target_os = "macos")))]
    async fn restore_from_icloud(&self, _backup_id: &str, _target_path: &PathBuf) -> Result<(), String> {
        Err("iCloud is not available on this platform".to_string())
    }

    #[cfg(target_os = "android")]
    async fn restore_from_google_drive(&self, backup_id: &str, target_path: &PathBuf) -> Result<(), String> {
        todo!("Implement Google Drive restore for Android")
    }

    #[cfg(not(target_os = "android"))]
    async fn restore_from_google_drive(&self, _backup_id: &str, _target_path: &PathBuf) -> Result<(), String> {
        Err("Google Drive restore is only available on Android".to_string())
    }

    async fn restore_from_local(&self, backup_id: &str, target_path: &PathBuf) -> Result<(), String> {
        let backups = self.list_local_backups().await?;
        let backup = backups.iter().find(|b| b.id == backup_id)
            .ok_or("Backup not found")?;

        let backup_dir = self.get_local_backup_path()?;
        let backup_path = backup_dir.join(&backup.filename);

        std::fs::copy(backup_path, target_path).map_err(|e| e.to_string())?;
        Ok(())
    }

    // 목록 조회 함수들
    #[cfg(any(target_os = "ios", target_os = "macos"))]
    async fn list_icloud_backups(&self) -> Result<Vec<BackupInfo>, String> {
        let icloud_path = self.get_icloud_documents_path()?;
        let backup_dir = icloud_path.join("Backups");
        self.list_backups_in_dir(&backup_dir, CloudService::ICloud)
    }

    #[cfg(not(any(target_os = "ios", target_os = "macos")))]
    async fn list_icloud_backups(&self) -> Result<Vec<BackupInfo>, String> {
        Ok(vec![])
    }

    #[cfg(target_os = "android")]
    async fn list_google_drive_backups(&self) -> Result<Vec<BackupInfo>, String> {
        todo!("Implement Google Drive list for Android")
    }

    #[cfg(not(target_os = "android"))]
    async fn list_google_drive_backups(&self) -> Result<Vec<BackupInfo>, String> {
        Ok(vec![])
    }

    async fn list_local_backups(&self) -> Result<Vec<BackupInfo>, String> {
        let backup_dir = self.get_local_backup_path()?;
        self.list_backups_in_dir(&backup_dir, CloudService::Local)
    }

    fn list_backups_in_dir(&self, dir: &PathBuf, service: CloudService) -> Result<Vec<BackupInfo>, String> {
        use std::fs;

        if !dir.exists() {
            return Ok(vec![]);
        }

        let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
        let mut backups = Vec::new();

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            if path.extension().map(|e| e == "db").unwrap_or(false) {
                let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
                let filename = path.file_name().unwrap().to_string_lossy().to_string();

                backups.push(BackupInfo {
                    id: uuid::Uuid::new_v4().to_string(),
                    service: service.clone(),
                    filename,
                    size: metadata.len(),
                    created_at: metadata.modified()
                        .map(|t| DateTime::<Utc>::from(t))
                        .unwrap_or_else(|_| Utc::now()),
                });
            }
        }

        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(backups)
    }

    #[cfg(any(target_os = "ios", target_os = "macos"))]
    fn get_icloud_documents_path(&self) -> Result<PathBuf, String> {
        // macOS/iOS iCloud Documents 경로
        let home = std::env::var("HOME").map_err(|e| e.to_string())?;

        #[cfg(target_os = "macos")]
        let path = PathBuf::from(home)
            .join("Library/Mobile Documents/iCloud~com~sisters~salon/Documents");

        #[cfg(target_os = "ios")]
        let path = PathBuf::from(home).join("Documents");

        Ok(path)
    }

    fn get_local_backup_path(&self) -> Result<PathBuf, String> {
        let app_data = tauri::api::path::app_data_dir(&tauri::Config::default())
            .ok_or("Could not get app data directory")?;
        Ok(app_data.join("backups"))
    }
}
```

### 3. Tauri Commands - 내보내기 & 백업

#### src-tauri/src/commands/export.rs
```rust
use tauri::{command, State};
use std::path::PathBuf;
use crate::db::Database;
use crate::services::excel::ExcelExporter;

#[command]
pub async fn export_to_excel(
    db: State<'_, Database>,
    period: String,
    output_path: Option<String>,
) -> Result<String, String> {
    let exporter = ExcelExporter::new(db.inner().clone());
    let path = output_path.map(PathBuf::from);

    let result_path = exporter.export_reservations(&period, path)?;
    Ok(result_path.to_string_lossy().to_string())
}

#[command]
pub async fn export_statistics_to_excel(
    db: State<'_, Database>,
    start_date: String,
    end_date: String,
    output_path: Option<String>,
) -> Result<String, String> {
    let exporter = ExcelExporter::new(db.inner().clone());
    let path = output_path.map(PathBuf::from);

    let result_path = exporter.export_statistics(&start_date, &end_date, path)?;
    Ok(result_path.to_string_lossy().to_string())
}

#[command]
pub async fn export_to_csv(
    db: State<'_, Database>,
    period: String,
    output_path: Option<String>,
) -> Result<String, String> {
    // CSV 내보내기 구현
    todo!()
}
```

#### src-tauri/src/commands/backup.rs
```rust
use tauri::{command, State, AppHandle};
use crate::db::Database;
use crate::services::cloud::{CloudBackup, CloudService, BackupInfo};

#[command]
pub async fn list_backups(
    service: String,
) -> Result<Vec<BackupInfo>, String> {
    let cloud_service = match service.as_str() {
        "icloud" => CloudService::ICloud,
        "google_drive" => CloudService::GoogleDrive,
        "local" => CloudService::Local,
        _ => return Err("Invalid cloud service".to_string()),
    };

    let backup = CloudBackup::new(cloud_service);
    backup.list_backups().await
}

#[command]
pub async fn backup_to_cloud(
    app: AppHandle,
    db: State<'_, Database>,
    service: String,
) -> Result<BackupInfo, String> {
    let cloud_service = match service.as_str() {
        "icloud" => CloudService::ICloud,
        "google_drive" => CloudService::GoogleDrive,
        "local" => CloudService::Local,
        _ => return Err("Invalid cloud service".to_string()),
    };

    let db_path = db.get_path();
    let backup = CloudBackup::new(cloud_service);
    backup.backup(&db_path).await
}

#[command]
pub async fn restore_from_backup(
    app: AppHandle,
    db: State<'_, Database>,
    backup_id: String,
    service: String,
) -> Result<(), String> {
    let cloud_service = match service.as_str() {
        "icloud" => CloudService::ICloud,
        "google_drive" => CloudService::GoogleDrive,
        "local" => CloudService::Local,
        _ => return Err("Invalid cloud service".to_string()),
    };

    let db_path = db.get_path();

    // 백업에서 복원 전 현재 DB 닫기
    db.close()?;

    let backup = CloudBackup::new(cloud_service);
    backup.restore(&backup_id, &db_path).await?;

    // DB 다시 열기
    db.reopen()?;

    Ok(())
}

#[command]
pub async fn delete_backup(
    backup_id: String,
    service: String,
) -> Result<(), String> {
    // 백업 삭제 구현
    todo!()
}

#[command]
pub async fn get_backup_settings() -> Result<BackupSettings, String> {
    // 백업 설정 조회
    todo!()
}

#[command]
pub async fn update_backup_settings(settings: BackupSettings) -> Result<(), String> {
    // 백업 설정 업데이트
    todo!()
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BackupSettings {
    pub auto_backup_enabled: bool,
    pub auto_backup_interval: String, // "daily", "weekly", "monthly"
    pub preferred_service: String,
    pub keep_backup_count: u32,
}
```

### 4. Frontend 컴포넌트

#### src/components/settings/ExportSettings.tsx
```tsx
import { useState } from 'react';
import { exportApi } from '../../lib/tauri';
import type { ExportPeriod } from '../../types';

export function ExportSettings() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('this_month');
  const [exportResult, setExportResult] = useState<string | null>(null);

  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const path = await exportApi.toExcel(exportPeriod);
      setExportResult(`내보내기 완료: ${path}`);
    } catch (error) {
      setExportResult(`오류: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const path = await exportApi.toCsv(exportPeriod);
      setExportResult(`내보내기 완료: ${path}`);
    } catch (error) {
      setExportResult(`오류: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4">데이터 내보내기</h2>

      <div className="space-y-4">
        {/* 기간 선택 */}
        <div>
          <label className="block text-sm font-medium mb-2">내보내기 기간</label>
          <select
            value={exportPeriod}
            onChange={(e) => setExportPeriod(e.target.value as ExportPeriod)}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="this_month">이번 달</option>
            <option value="last_3_months">최근 3개월</option>
            <option value="all">전체</option>
          </select>
        </div>

        {/* 내보내기 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700
                       text-white rounded-lg font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isExporting ? '내보내는 중...' : 'Excel로 내보내기'}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700
                       text-white rounded-lg font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isExporting ? '내보내는 중...' : 'CSV로 내보내기'}
          </button>
        </div>

        {/* 결과 메시지 */}
        {exportResult && (
          <div className={`p-3 rounded-lg ${
            exportResult.startsWith('오류')
              ? 'bg-red-500/20 text-red-200'
              : 'bg-green-500/20 text-green-200'
          }`}>
            {exportResult}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### src/components/settings/BackupSettings.tsx
```tsx
import { useState, useEffect } from 'react';
import { backupApi } from '../../lib/tauri';
import type { BackupInfo, CloudService } from '../../types';

export function BackupSettings() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selectedService, setSelectedService] = useState<CloudService>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const availableServices = getAvailableServices();

  useEffect(() => {
    loadBackups();
  }, [selectedService]);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const list = await backupApi.list(selectedService);
      setBackups(list);
    } catch (error) {
      setMessage(`백업 목록 로드 실패: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setMessage(null);

    try {
      const backup = await backupApi.create(selectedService);
      setMessage(`백업 완료: ${backup.filename}`);
      loadBackups();
    } catch (error) {
      setMessage(`백업 실패: ${error}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm('이 백업으로 복원하시겠습니까? 현재 데이터가 덮어씌워집니다.')) {
      return;
    }

    setIsRestoring(true);
    setMessage(null);

    try {
      await backupApi.restore(backupId);
      setMessage('복원 완료! 앱을 다시 시작해주세요.');
    } catch (error) {
      setMessage(`복원 실패: ${error}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4">백업 & 복원</h2>

      <div className="space-y-4">
        {/* 서비스 선택 */}
        <div>
          <label className="block text-sm font-medium mb-2">백업 위치</label>
          <div className="flex gap-2">
            {availableServices.map((service) => (
              <button
                key={service.value}
                onClick={() => setSelectedService(service.value)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors
                  ${selectedService === service.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                  }`}
              >
                {service.icon} {service.label}
              </button>
            ))}
          </div>
        </div>

        {/* 백업 버튼 */}
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700
                     text-white rounded-lg font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isBackingUp ? '백업 중...' : '지금 백업하기'}
        </button>

        {/* 메시지 */}
        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes('실패')
              ? 'bg-red-500/20 text-red-200'
              : 'bg-green-500/20 text-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* 백업 목록 */}
        <div>
          <h3 className="text-lg font-medium mb-2">백업 목록</h3>

          {isLoading ? (
            <div className="text-center py-4 text-gray-400">로딩 중...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-4 text-gray-400">백업이 없습니다</div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3
                             bg-white/5 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{backup.filename}</div>
                    <div className="text-sm text-gray-400">
                      {formatDate(backup.createdAt)} · {formatSize(backup.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(backup.id)}
                    disabled={isRestoring}
                    className="py-1 px-3 bg-white/10 hover:bg-white/20
                               rounded-lg text-sm transition-colors
                               disabled:opacity-50"
                  >
                    복원
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getAvailableServices() {
  const services = [
    { value: 'local' as CloudService, label: '로컬', icon: '💾' },
  ];

  // 플랫폼에 따라 사용 가능한 서비스 추가
  const platform = navigator.userAgent;

  if (platform.includes('Mac') || platform.includes('iPhone') || platform.includes('iPad')) {
    services.unshift({ value: 'icloud' as CloudService, label: 'iCloud', icon: '☁️' });
  }

  if (platform.includes('Android')) {
    services.unshift({ value: 'google_drive' as CloudService, label: 'Google Drive', icon: '📁' });
  }

  return services;
}
```

#### src/components/settings/AutoBackupSettings.tsx
```tsx
import { useState, useEffect } from 'react';

interface AutoBackupConfig {
  enabled: boolean;
  interval: 'daily' | 'weekly' | 'monthly';
  preferredService: 'icloud' | 'google_drive' | 'local';
  keepCount: number;
}

export function AutoBackupSettings() {
  const [config, setConfig] = useState<AutoBackupConfig>({
    enabled: false,
    interval: 'weekly',
    preferredService: 'local',
    keepCount: 5,
  });

  const handleSave = async () => {
    // 설정 저장
    localStorage.setItem('autoBackupConfig', JSON.stringify(config));
  };

  useEffect(() => {
    const saved = localStorage.getItem('autoBackupConfig');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4">자동 백업 설정</h2>

      <div className="space-y-4">
        {/* 활성화 토글 */}
        <div className="flex items-center justify-between">
          <span>자동 백업 활성화</span>
          <button
            onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              config.enabled ? 'bg-indigo-600' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {config.enabled && (
          <>
            {/* 백업 주기 */}
            <div>
              <label className="block text-sm font-medium mb-2">백업 주기</label>
              <select
                value={config.interval}
                onChange={(e) => setConfig(c => ({
                  ...c,
                  interval: e.target.value as AutoBackupConfig['interval']
                }))}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20"
              >
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>

            {/* 보관 개수 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                백업 보관 개수: {config.keepCount}개
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={config.keepCount}
                onChange={(e) => setConfig(c => ({
                  ...c,
                  keepCount: parseInt(e.target.value)
                }))}
                className="w-full"
              />
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700
                     text-white rounded-lg font-medium transition-colors"
        >
          설정 저장
        </button>
      </div>
    </div>
  );
}
```

---

## 커밋 메시지 가이드

```bash
# Excel 내보내기
git commit -m "feat(export): Excel 내보내기 기능 구현

- rust_xlsxwriter로 예약 데이터 Excel 변환
- 기간별 내보내기 (이번달, 3개월, 전체)
- 통계 데이터 내보내기 (일별, 디자이너별, 서비스별)

Co-Authored-By: Claude <noreply@anthropic.com>"

# CSV 내보내기
git commit -m "feat(export): CSV 내보내기 기능 추가

Co-Authored-By: Claude <noreply@anthropic.com>"

# 클라우드 백업 서비스
git commit -m "feat(backup): 클라우드 백업 서비스 구현

- iCloud 백업/복원 (iOS/macOS)
- Google Drive 백업/복원 (Android)
- 로컬 백업/복원 (모든 플랫폼)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 백업 UI
git commit -m "feat(backup): 백업/복원 UI 컴포넌트 추가

- BackupSettings 컴포넌트
- 자동 백업 설정 UI
- 백업 목록 및 복원 기능

Co-Authored-By: Claude <noreply@anthropic.com>"

# 내보내기 UI
git commit -m "feat(export): 내보내기 설정 UI 추가

- ExportSettings 컴포넌트
- Excel/CSV 내보내기 버튼
- 기간 선택 옵션

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 완료 기준 체크리스트

### Excel/CSV 내보내기
- [ ] Excel 내보내기 기능 동작
- [ ] CSV 내보내기 기능 동작
- [ ] 기간별 필터링 동작 (이번달, 3개월, 전체)
- [ ] 통계 데이터 내보내기 동작
- [ ] 파일 저장 경로 선택 가능
- [ ] 한글 데이터 정상 표시

### 클라우드 백업
- [ ] iCloud 백업 동작 (iOS/macOS)
- [ ] iCloud 복원 동작 (iOS/macOS)
- [ ] Google Drive 백업 동작 (Android)
- [ ] Google Drive 복원 동작 (Android)
- [ ] 로컬 백업 동작 (모든 플랫폼)
- [ ] 로컬 복원 동작 (모든 플랫폼)
- [ ] 백업 목록 조회 동작
- [ ] 백업 삭제 동작

### UI
- [ ] ExportSettings 컴포넌트 렌더링
- [ ] BackupSettings 컴포넌트 렌더링
- [ ] 자동 백업 설정 저장/로드
- [ ] 플랫폼별 사용 가능한 서비스만 표시
- [ ] 로딩/에러 상태 표시

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. Excel/CSV 파일 정상 생성 확인
3. 백업/복원 사이클 테스트 완료
4. 각 플랫폼에서 해당 클라우드 서비스 동작 확인
5. 데이터 무결성 검증

```bash
# 머지 절차
git checkout develop
git merge --squash task/06-export-backup
git commit -m "feat: Phase 6 - 내보내기 & 백업 기능 완료

- Excel/CSV 내보내기 (rust_xlsxwriter)
- iCloud 백업 (iOS/macOS)
- Google Drive 백업 (Android)
- 로컬 백업 (모든 플랫폼)
- 자동 백업 스케줄링
- 내보내기/백업 UI 컴포넌트

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
git branch -d task/06-export-backup
```

---

## 다음 단계

Phase 7: [앱 잠금](./07-app-lock.md)으로 진행
