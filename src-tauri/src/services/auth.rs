use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "com.sisters-salon.app";
const PIN_KEY: &str = "lock_pin";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LockSettings {
    pub is_enabled: bool,
    pub use_biometric: bool,
    pub auto_lock_timeout: u32, // minutes, 0 = immediate
    pub lock_on_background: bool,
    #[serde(default)]
    pub pin_hash: Option<String>, // Fallback storage for platforms where keyring doesn't work
}

impl Default for LockSettings {
    fn default() -> Self {
        Self {
            is_enabled: false,
            use_biometric: false,
            auto_lock_timeout: 5,
            lock_on_background: true,
            pin_hash: None,
        }
    }
}

/// Set a new PIN (hashed with bcrypt and stored in OS keyring)
pub fn set_pin(pin: &str) -> Result<(), String> {
    // Validate PIN (4-6 digits)
    if !is_valid_pin(pin) {
        return Err("PIN must be 4-6 digits".to_string());
    }

    // Hash the PIN with bcrypt
    let hash = bcrypt::hash(pin, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?;

    // Store in OS keyring
    let entry = keyring::Entry::new(SERVICE_NAME, PIN_KEY).map_err(|e| e.to_string())?;
    entry.set_password(&hash).map_err(|e| e.to_string())?;

    Ok(())
}

/// Verify a PIN against the stored hash
pub fn verify_pin(pin: &str) -> Result<bool, String> {
    let entry = keyring::Entry::new(SERVICE_NAME, PIN_KEY).map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(hash) => {
            let is_valid = bcrypt::verify(pin, &hash).unwrap_or(false);
            Ok(is_valid)
        }
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

/// Remove the stored PIN
pub fn remove_pin() -> Result<(), String> {
    let entry = keyring::Entry::new(SERVICE_NAME, PIN_KEY).map_err(|e| e.to_string())?;

    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
        Err(e) => Err(e.to_string()),
    }
}

/// Change the PIN (verify old PIN first)
#[allow(dead_code)]
pub fn change_pin(old_pin: &str, new_pin: &str) -> Result<(), String> {
    // Verify old PIN first
    if !verify_pin(old_pin)? {
        return Err("Current PIN is incorrect".to_string());
    }

    // Set new PIN
    set_pin(new_pin)
}

/// Check if a lock PIN is set
pub fn is_lock_enabled() -> Result<bool, String> {
    let entry = keyring::Entry::new(SERVICE_NAME, PIN_KEY).map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

/// Validate PIN format (4-6 digits)
fn is_valid_pin(pin: &str) -> bool {
    let len = pin.len();
    len >= 4 && len <= 6 && pin.chars().all(|c| c.is_ascii_digit())
}

/// Get lock settings from app_settings table
pub fn get_settings(conn: &rusqlite::Connection) -> Result<LockSettings, String> {
    let result: Result<String, _> = conn.query_row(
        "SELECT value FROM app_settings WHERE key = 'lock_settings'",
        [],
        |row| row.get(0),
    );

    match result {
        Ok(json) => serde_json::from_str(&json).map_err(|e| e.to_string()),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(LockSettings::default()),
        Err(e) => Err(e.to_string()),
    }
}

/// Save lock settings to app_settings table
pub fn save_settings(conn: &rusqlite::Connection, settings: &LockSettings) -> Result<(), String> {
    let json = serde_json::to_string(settings).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('lock_settings', ?1, ?2)",
        rusqlite::params![json, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Check if biometric authentication is available
/// Android (fingerprint) and iOS (Face ID/Touch ID) are supported via tauri-plugin-biometric.
/// Actual check is performed in commands/security.rs using the plugin's AppHandle API.
#[allow(dead_code)]
pub fn is_biometric_available() -> bool {
    cfg!(any(target_os = "android", target_os = "ios"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pin_validation() {
        assert!(is_valid_pin("1234"));
        assert!(is_valid_pin("12345"));
        assert!(is_valid_pin("123456"));
        assert!(!is_valid_pin("123")); // Too short
        assert!(!is_valid_pin("1234567")); // Too long
        assert!(!is_valid_pin("abcd")); // Not digits
        assert!(!is_valid_pin("12a4")); // Contains non-digit
    }
}
