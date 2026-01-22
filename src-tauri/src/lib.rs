mod commands;
mod db;

use db::init_database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            init_database(&app.handle()).expect("Failed to initialize database");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 예약
            commands::reservations::get_reservations,
            commands::reservations::get_reservation,
            commands::reservations::create_reservation,
            commands::reservations::update_reservation,
            commands::reservations::delete_reservation,
            commands::reservations::update_reservation_status,
            // 디자이너
            commands::designers::get_designers,
            commands::designers::get_active_designers,
            commands::designers::create_designer,
            commands::designers::update_designer,
            commands::designers::delete_designer,
            // 영업시간
            commands::business_hours::get_business_hours,
            commands::business_hours::update_business_hours,
            // 통계
            commands::statistics::get_statistics_summary,
            commands::statistics::get_daily_statistics,
            commands::statistics::get_hourly_statistics,
            commands::statistics::get_designer_statistics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
