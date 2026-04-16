use tauri::State;

use crate::db::DbState;
use crate::services::auth::{self, LockSettings};

#[tauri::command]
pub fn set_lock_pin(db: State<DbState>, pin: String) -> Result<(), String> {
    // Validate PIN
    if pin.len() < 4 || pin.len() > 6 || !pin.chars().all(|c| c.is_ascii_digit()) {
        return Err("PIN must be 4-6 digits".to_string());
    }

    // Hash the PIN
    let hash = bcrypt::hash(&pin, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?;

    // Try to store in keyring (may fail on iOS)
    let keyring_result = auth::set_pin(&pin);
    if let Err(e) = &keyring_result {
        eprintln!("Keyring storage failed (using DB fallback): {}", e);
    }

    // Always store in DB as fallback
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut settings = auth::get_settings(conn)?;
    settings.is_enabled = true;
    settings.pin_hash = Some(hash);
    auth::save_settings(conn, &settings)?;

    Ok(())
}

#[tauri::command]
pub fn verify_lock_pin(db: State<DbState>, pin: String) -> Result<bool, String> {
    // Try keyring first
    if let Ok(true) = auth::verify_pin(&pin) {
        return Ok(true);
    }

    // Fallback to DB
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let settings = auth::get_settings(conn)?;

    if let Some(hash) = &settings.pin_hash {
        let is_valid = bcrypt::verify(&pin, hash).unwrap_or(false);
        return Ok(is_valid);
    }

    Ok(false)
}

#[tauri::command]
pub fn remove_lock_pin(db: State<DbState>) -> Result<(), String> {
    // Try to remove from keyring
    let _ = auth::remove_pin();

    // Remove from DB
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut settings = auth::get_settings(conn)?;
    settings.is_enabled = false;
    settings.pin_hash = None;
    auth::save_settings(conn, &settings)?;

    Ok(())
}

#[tauri::command]
pub fn change_lock_pin(db: State<DbState>, old_pin: String, new_pin: String) -> Result<(), String> {
    // Verify old PIN first
    let db_guard = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db_guard.conn();
    let settings = auth::get_settings(conn)?;

    // Check old PIN
    let old_valid = if let Ok(true) = auth::verify_pin(&old_pin) {
        true
    } else if let Some(hash) = &settings.pin_hash {
        bcrypt::verify(&old_pin, hash).unwrap_or(false)
    } else {
        false
    };

    if !old_valid {
        return Err("Current PIN is incorrect".to_string());
    }

    // Validate new PIN
    if new_pin.len() < 4 || new_pin.len() > 6 || !new_pin.chars().all(|c| c.is_ascii_digit()) {
        return Err("PIN must be 4-6 digits".to_string());
    }

    // Hash new PIN
    let hash = bcrypt::hash(&new_pin, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?;

    // Try to update keyring
    let _ = auth::set_pin(&new_pin);

    // Update DB
    let mut new_settings = settings.clone();
    new_settings.pin_hash = Some(hash);
    auth::save_settings(conn, &new_settings)?;

    Ok(())
}

#[tauri::command]
pub fn is_lock_enabled(db: State<DbState>) -> Result<bool, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();
    let settings = auth::get_settings(conn)?;

    // Check if enabled AND has a PIN (either in keyring or DB)
    if !settings.is_enabled {
        return Ok(false);
    }

    // Check if PIN exists
    let keyring_has_pin = auth::is_lock_enabled().unwrap_or(false);
    let db_has_pin = settings.pin_hash.is_some();

    Ok(keyring_has_pin || db_has_pin)
}

#[tauri::command]
pub fn get_lock_settings(db: State<DbState>) -> Result<LockSettings, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut settings = auth::get_settings(conn)?;
    // Don't expose the PIN hash to frontend
    settings.pin_hash = None;
    Ok(settings)
}

#[tauri::command]
pub fn update_lock_settings(db: State<DbState>, settings: LockSettings) -> Result<(), String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // Get existing settings to preserve pin_hash
    let mut existing = auth::get_settings(conn)?;
    existing.use_biometric = settings.use_biometric;
    existing.auto_lock_timeout = settings.auto_lock_timeout;
    existing.lock_on_background = settings.lock_on_background;
    // Don't update is_enabled or pin_hash from frontend

    auth::save_settings(conn, &existing)
}

#[tauri::command]
pub fn authenticate_biometric(app: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        use tauri_plugin_biometric::{AuthOptions, BiometricExt, BiometryType};

        let biometry_type = app.biometric().status()
            .map(|s| s.biometry_type)
            .unwrap_or(BiometryType::None);

        #[cfg(target_os = "android")]
        let options = {
            let (title, subtitle) = match biometry_type {
                BiometryType::FaceID => ("얼굴 인증", "얼굴 인식으로 앱 잠금을 해제합니다"),
                _ => ("지문 인증", "지문으로 앱 잠금을 해제합니다"),
            };
            AuthOptions {
                allow_device_credential: false,
                title: Some(title.to_string()),
                subtitle: Some(subtitle.to_string()),
                cancel_title: Some("취소".to_string()),
                confirmation_required: Some(true),
                ..Default::default()
            }
        };

        #[cfg(target_os = "ios")]
        let options = AuthOptions {
            allow_device_credential: false,
            cancel_title: Some("취소".to_string()),
            fallback_title: Some("PIN으로 잠금 해제".to_string()),
            ..Default::default()
        };

        match app.biometric().authenticate("앱 잠금을 해제합니다".to_string(), options) {
            Ok(_) => Ok(true),
            Err(e) => Err(format!("생체인증 실패: {}", e)),
        }
    }
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        let _ = app;
        Err("생체인증은 모바일에서만 사용 가능합니다".to_string())
    }
}

#[tauri::command]
pub fn is_biometric_available(app: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        use tauri_plugin_biometric::BiometricExt;
        match app.biometric().status() {
            Ok(status) => Ok(status.is_available),
            Err(_) => Ok(false),
        }
    }
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        let _ = app;
        Ok(false)
    }
}

/// Returns the biometric type: "face_id", "touch_id", or "none"
#[tauri::command]
pub fn get_biometric_type(app: tauri::AppHandle) -> Result<String, String> {
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        use tauri_plugin_biometric::BiometricExt;
        match app.biometric().status() {
            Ok(status) => {
                if !status.is_available {
                    return Ok("none".to_string());
                }
                // BiometryType: None=0, TouchID=1, FaceID=2
                let type_str = match status.biometry_type as u8 {
                    2 => "face_id",
                    1 => "touch_id",
                    _ => "none",
                };
                Ok(type_str.to_string())
            }
            Err(_) => Ok("none".to_string()),
        }
    }
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        let _ = app;
        Ok("none".to_string())
    }
}
