use serde::Serialize;
use tauri::State;
use crate::db::DbState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TopDesigner {
    pub name: String,
    pub count: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TopService {
    pub name: String,
    pub count: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatisticsSummary {
    pub total_reservations: i32,
    pub completed: i32,
    pub cancelled: i32,
    pub no_show: i32,
    pub completion_rate: f64,
    pub average_per_day: f64,
    pub busiest_day: Option<String>,
    pub busiest_hour: Option<String>,
    pub top_designer: Option<TopDesigner>,
    pub top_service: Option<TopService>,
    pub period: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyStatistic {
    pub date: String,
    pub total: i32,
    pub completed: i32,
    pub cancelled: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HourlyStatistic {
    pub hour: String,
    pub count: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesignerStatistic {
    pub designer_id: String,
    pub designer_name: String,
    pub total: i32,
    pub completed: i32,
    pub completion_rate: f64,
}

#[tauri::command]
pub fn get_statistics_summary(
    period: String,
    db: State<DbState>,
) -> Result<StatisticsSummary, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let days: i64 = match period.as_str() {
        "7d" => 7,
        "30d" => 30,
        "90d" => 90,
        _ => 365,
    };

    let start_date = chrono::Utc::now()
        .checked_sub_signed(chrono::Duration::days(days))
        .unwrap()
        .format("%Y-%m-%d")
        .to_string();

    // 총 예약 수
    let total: i32 = conn.query_row(
        "SELECT COUNT(*) FROM reservations WHERE date >= ?1",
        [&start_date],
        |row| row.get(0),
    ).unwrap_or(0);

    // 상태별 카운트
    let completed: i32 = conn.query_row(
        "SELECT COUNT(*) FROM reservations WHERE date >= ?1 AND status = 'completed'",
        [&start_date],
        |row| row.get(0),
    ).unwrap_or(0);

    let cancelled: i32 = conn.query_row(
        "SELECT COUNT(*) FROM reservations WHERE date >= ?1 AND status = 'cancelled'",
        [&start_date],
        |row| row.get(0),
    ).unwrap_or(0);

    let no_show: i32 = conn.query_row(
        "SELECT COUNT(*) FROM reservations WHERE date >= ?1 AND status = 'no_show'",
        [&start_date],
        |row| row.get(0),
    ).unwrap_or(0);

    // 완료율
    let completion_rate = if total > 0 {
        (completed as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    // 일평균
    let average_per_day = total as f64 / days as f64;

    // 가장 바쁜 날
    let busiest_day: Option<String> = conn.query_row(
        "SELECT date FROM reservations WHERE date >= ?1 GROUP BY date ORDER BY COUNT(*) DESC LIMIT 1",
        [&start_date],
        |row| row.get(0),
    ).ok();

    // 가장 바쁜 시간
    let busiest_hour: Option<String> = conn.query_row(
        "SELECT substr(time, 1, 2) as hour FROM reservations WHERE date >= ?1 GROUP BY hour ORDER BY COUNT(*) DESC LIMIT 1",
        [&start_date],
        |row| row.get(0),
    ).ok();

    // 톱 디자이너
    let top_designer: Option<TopDesigner> = conn.query_row(
        r#"
        SELECT d.name, COUNT(*) as count
        FROM reservations r
        JOIN designers d ON r.designer_id = d.id
        WHERE r.date >= ?1
        GROUP BY r.designer_id
        ORDER BY count DESC
        LIMIT 1
        "#,
        [&start_date],
        |row| Ok(TopDesigner {
            name: row.get(0)?,
            count: row.get(1)?,
        }),
    ).ok();

    // 톱 서비스
    let top_service: Option<TopService> = conn.query_row(
        r#"
        SELECT service_type, COUNT(*) as count
        FROM reservations
        WHERE date >= ?1 AND service_type IS NOT NULL AND service_type != ''
        GROUP BY service_type
        ORDER BY count DESC
        LIMIT 1
        "#,
        [&start_date],
        |row| Ok(TopService {
            name: row.get(0)?,
            count: row.get(1)?,
        }),
    ).ok();

    Ok(StatisticsSummary {
        total_reservations: total,
        completed,
        cancelled,
        no_show,
        completion_rate,
        average_per_day,
        busiest_day,
        busiest_hour,
        top_designer,
        top_service,
        period,
    })
}

#[tauri::command]
pub fn get_daily_statistics(
    start_date: String,
    end_date: String,
    db: State<DbState>,
) -> Result<Vec<DailyStatistic>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut stmt = conn.prepare(r#"
        SELECT
            date,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM reservations
        WHERE date BETWEEN ?1 AND ?2
        GROUP BY date
        ORDER BY date
    "#).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&start_date, &end_date], |row| {
        Ok(DailyStatistic {
            date: row.get(0)?,
            total: row.get(1)?,
            completed: row.get(2)?,
            cancelled: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let stats: Vec<DailyStatistic> = rows.filter_map(|r| r.ok()).collect();
    Ok(stats)
}

#[tauri::command]
pub fn get_hourly_statistics(
    period: String,
    db: State<DbState>,
) -> Result<Vec<HourlyStatistic>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let days: i64 = match period.as_str() {
        "7d" => 7,
        "30d" => 30,
        "90d" => 90,
        _ => 365,
    };

    let start_date = chrono::Utc::now()
        .checked_sub_signed(chrono::Duration::days(days))
        .unwrap()
        .format("%Y-%m-%d")
        .to_string();

    let mut stmt = conn.prepare(r#"
        SELECT substr(time, 1, 2) as hour, COUNT(*) as count
        FROM reservations
        WHERE date >= ?1
        GROUP BY hour
        ORDER BY hour
    "#).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&start_date], |row| {
        Ok(HourlyStatistic {
            hour: row.get(0)?,
            count: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    let stats: Vec<HourlyStatistic> = rows.filter_map(|r| r.ok()).collect();
    Ok(stats)
}

#[tauri::command]
pub fn get_designer_statistics(
    period: String,
    db: State<DbState>,
) -> Result<Vec<DesignerStatistic>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let days: i64 = match period.as_str() {
        "7d" => 7,
        "30d" => 30,
        "90d" => 90,
        _ => 365,
    };

    let start_date = chrono::Utc::now()
        .checked_sub_signed(chrono::Duration::days(days))
        .unwrap()
        .format("%Y-%m-%d")
        .to_string();

    let mut stmt = conn.prepare(r#"
        SELECT
            d.id,
            d.name,
            COUNT(*) as total,
            SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM reservations r
        JOIN designers d ON r.designer_id = d.id
        WHERE r.date >= ?1
        GROUP BY d.id
        ORDER BY total DESC
    "#).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&start_date], |row| {
        let total: i32 = row.get(2)?;
        let completed: i32 = row.get(3)?;
        let completion_rate = if total > 0 {
            (completed as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        Ok(DesignerStatistic {
            designer_id: row.get(0)?,
            designer_name: row.get(1)?,
            total,
            completed,
            completion_rate,
        })
    }).map_err(|e| e.to_string())?;

    let stats: Vec<DesignerStatistic> = rows.filter_map(|r| r.ok()).collect();
    Ok(stats)
}
