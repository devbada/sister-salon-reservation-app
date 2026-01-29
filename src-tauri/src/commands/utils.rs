use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn open_external_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| e.to_string())
}
