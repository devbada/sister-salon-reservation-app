use rust_xlsxwriter::{Format, FormatAlign, Color, Workbook};
use rusqlite::Connection;
use std::path::PathBuf;

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

pub fn export_reservations(
    conn: &Connection,
    period: &str,
    output_path: PathBuf,
) -> Result<PathBuf, String> {
    let reservations = get_reservations_for_period(conn, period)?;

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
        worksheet
            .write_string_with_format(0, col as u16, *header, &header_format)
            .map_err(|e| e.to_string())?;
    }

    // 데이터 스타일
    let date_format = Format::new().set_align(FormatAlign::Center);
    let text_format = Format::new();

    // 데이터 작성
    for (row, reservation) in reservations.iter().enumerate() {
        let row = (row + 1) as u32;

        worksheet
            .write_string_with_format(row, 0, &reservation.date, &date_format)
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string_with_format(row, 1, &reservation.time, &date_format)
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string_with_format(row, 2, &reservation.customer_name, &text_format)
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string_with_format(
                row,
                3,
                reservation.customer_phone.as_deref().unwrap_or("-"),
                &text_format,
            )
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string_with_format(
                row,
                4,
                reservation.designer_name.as_deref().unwrap_or("-"),
                &text_format,
            )
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string_with_format(
                row,
                5,
                reservation.service_type.as_deref().unwrap_or("-"),
                &text_format,
            )
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string_with_format(row, 6, &status_to_korean(&reservation.status), &text_format)
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string_with_format(
                row,
                7,
                reservation.notes.as_deref().unwrap_or(""),
                &text_format,
            )
            .map_err(|e| e.to_string())?;
    }

    // 열 너비 설정
    worksheet.set_column_width(0, 12).map_err(|e| e.to_string())?;
    worksheet.set_column_width(1, 8).map_err(|e| e.to_string())?;
    worksheet.set_column_width(2, 15).map_err(|e| e.to_string())?;
    worksheet.set_column_width(3, 15).map_err(|e| e.to_string())?;
    worksheet.set_column_width(4, 12).map_err(|e| e.to_string())?;
    worksheet.set_column_width(5, 15).map_err(|e| e.to_string())?;
    worksheet.set_column_width(6, 10).map_err(|e| e.to_string())?;
    worksheet.set_column_width(7, 30).map_err(|e| e.to_string())?;

    // 파일 저장
    workbook.save(&output_path).map_err(|e| e.to_string())?;
    Ok(output_path)
}

pub fn export_to_csv(
    conn: &Connection,
    period: &str,
    output_path: PathBuf,
) -> Result<PathBuf, String> {
    let reservations = get_reservations_for_period(conn, period)?;

    let mut csv_content = String::from("날짜,시간,고객명,연락처,디자이너,서비스,상태,메모\n");

    for reservation in reservations {
        let line = format!(
            "{},{},{},{},{},{},{},{}\n",
            reservation.date,
            reservation.time,
            escape_csv(&reservation.customer_name),
            escape_csv(reservation.customer_phone.as_deref().unwrap_or("")),
            escape_csv(reservation.designer_name.as_deref().unwrap_or("")),
            escape_csv(reservation.service_type.as_deref().unwrap_or("")),
            status_to_korean(&reservation.status),
            escape_csv(reservation.notes.as_deref().unwrap_or("")),
        );
        csv_content.push_str(&line);
    }

    std::fs::write(&output_path, csv_content.as_bytes()).map_err(|e| e.to_string())?;
    Ok(output_path)
}

fn escape_csv(value: &str) -> String {
    if value.contains(',') || value.contains('"') || value.contains('\n') {
        format!("\"{}\"", value.replace('"', "\"\""))
    } else {
        value.to_string()
    }
}

fn get_reservations_for_period(
    conn: &Connection,
    period: &str,
) -> Result<Vec<ReservationExport>, String> {
    let (start_date, end_date) = match period {
        "this_month" => {
            let now = chrono::Local::now();
            let start = chrono::NaiveDate::from_ymd_opt(now.year(), now.month(), 1).unwrap();
            let end = if now.month() == 12 {
                chrono::NaiveDate::from_ymd_opt(now.year() + 1, 1, 1).unwrap()
            } else {
                chrono::NaiveDate::from_ymd_opt(now.year(), now.month() + 1, 1).unwrap()
            } - chrono::Duration::days(1);
            (start.to_string(), end.to_string())
        }
        "last_3_months" => {
            let now = chrono::Local::now();
            let end = now.date_naive();
            let start = end - chrono::Duration::days(90);
            (start.to_string(), end.to_string())
        }
        "all" | _ => ("1970-01-01".to_string(), "2099-12-31".to_string()),
    };

    let mut stmt = conn
        .prepare(
            r#"
            SELECT
                r.date,
                r.time,
                r.customer_name,
                r.customer_phone,
                d.name as designer_name,
                r.service_type,
                r.status,
                r.notes
            FROM reservations r
            LEFT JOIN designers d ON r.designer_id = d.id
            WHERE r.date BETWEEN ?1 AND ?2
            ORDER BY r.date DESC, r.time DESC
        "#,
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([&start_date, &end_date], |row| {
            Ok(ReservationExport {
                date: row.get(0)?,
                time: row.get(1)?,
                customer_name: row.get(2)?,
                customer_phone: row.get(3)?,
                designer_name: row.get(4)?,
                service_type: row.get(5)?,
                status: row.get(6)?,
                notes: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let reservations: Vec<ReservationExport> = rows.filter_map(|r| r.ok()).collect();
    Ok(reservations)
}

fn status_to_korean(status: &str) -> String {
    match status {
        "pending" => "대기중",
        "confirmed" => "확정",
        "completed" => "완료",
        "cancelled" => "취소",
        "no_show" => "노쇼",
        _ => status,
    }
    .to_string()
}

use chrono::Datelike;
