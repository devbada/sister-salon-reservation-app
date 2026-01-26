use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use crate::db::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub birthdate: Option<String>,
    pub gender: Option<String>,
    pub preferred_designer_id: Option<String>,
    pub preferred_service: Option<String>,
    pub allergies: Option<String>,
    pub total_visits: i32,
    pub last_visit_date: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCustomerInput {
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub birthdate: Option<String>,
    pub gender: Option<String>,
    pub preferred_designer_id: Option<String>,
    pub preferred_service: Option<String>,
    pub allergies: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCustomerInput {
    pub name: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub birthdate: Option<String>,
    pub gender: Option<String>,
    pub preferred_designer_id: Option<String>,
    pub preferred_service: Option<String>,
    pub allergies: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomerReservation {
    pub id: String,
    pub date: String,
    pub time: String,
    pub service_type: Option<String>,
    pub designer_name: Option<String>,
    pub status: String,
    pub notes: Option<String>,
}

fn row_to_customer(row: &rusqlite::Row) -> rusqlite::Result<Customer> {
    Ok(Customer {
        id: row.get(0)?,
        name: row.get(1)?,
        phone: row.get(2)?,
        email: row.get(3)?,
        birthdate: row.get(4)?,
        gender: row.get(5)?,
        preferred_designer_id: row.get(6)?,
        preferred_service: row.get(7)?,
        allergies: row.get(8)?,
        total_visits: row.get::<_, Option<i32>>(9)?.unwrap_or(0),
        last_visit_date: row.get(10)?,
        notes: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

#[tauri::command]
pub fn get_customers(db: State<DbState>) -> Result<Vec<Customer>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, phone, email, birthdate, gender, preferred_designer_id,
                    preferred_service, allergies, total_visits, last_visit_date, notes,
                    created_at, updated_at
             FROM customers
             ORDER BY name"
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row_to_customer(row))
        .map_err(|e| e.to_string())?;

    let customers: Vec<Customer> = rows.filter_map(|r| r.ok()).collect();

    Ok(customers)
}

#[tauri::command]
pub fn get_customer(id: String, db: State<DbState>) -> Result<Customer, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    conn.query_row(
        "SELECT id, name, phone, email, birthdate, gender, preferred_designer_id,
                preferred_service, allergies, total_visits, last_visit_date, notes,
                created_at, updated_at
         FROM customers WHERE id = ?1",
        [&id],
        |row| row_to_customer(row),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_customer(
    data: CreateCustomerInput,
    db: State<DbState>,
) -> Result<Customer, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // 전화번호 중복 검사
    if let Some(ref phone) = data.phone {
        if !phone.is_empty() {
            let exists: bool = conn
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM customers WHERE phone = ?1)",
                    [phone],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;

            if exists {
                return Err("이미 등록된 전화번호입니다.".to_string());
            }
        }
    }

    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO customers (id, name, phone, email, birthdate, gender, preferred_designer_id,
                               preferred_service, allergies, total_visits, last_visit_date, notes,
                               created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, NULL, ?10, ?11, ?11)",
        rusqlite::params![
            id,
            data.name,
            data.phone,
            data.email,
            data.birthdate,
            data.gender,
            data.preferred_designer_id,
            data.preferred_service,
            data.allergies,
            data.notes,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Customer {
        id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        birthdate: data.birthdate,
        gender: data.gender,
        preferred_designer_id: data.preferred_designer_id,
        preferred_service: data.preferred_service,
        allergies: data.allergies,
        total_visits: 0,
        last_visit_date: None,
        notes: data.notes,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_customer(
    id: String,
    data: UpdateCustomerInput,
    db: State<DbState>,
) -> Result<Customer, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // 기존 데이터 조회
    let current: Customer = conn
        .query_row(
            "SELECT id, name, phone, email, birthdate, gender, preferred_designer_id,
                    preferred_service, allergies, total_visits, last_visit_date, notes,
                    created_at, updated_at
             FROM customers WHERE id = ?1",
            [&id],
            |row| row_to_customer(row),
        )
        .map_err(|e| e.to_string())?;

    // 전화번호 변경 시 중복 검사
    if let Some(ref new_phone) = data.phone {
        if !new_phone.is_empty() && Some(new_phone.clone()) != current.phone {
            let exists: bool = conn
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM customers WHERE phone = ?1 AND id != ?2)",
                    rusqlite::params![new_phone, id],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;

            if exists {
                return Err("이미 등록된 전화번호입니다.".to_string());
            }
        }
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let name = data.name.unwrap_or(current.name);
    let phone = data.phone.or(current.phone);
    let email = data.email.or(current.email);
    let birthdate = data.birthdate.or(current.birthdate);
    let gender = data.gender.or(current.gender);
    let preferred_designer_id = data.preferred_designer_id.or(current.preferred_designer_id);
    let preferred_service = data.preferred_service.or(current.preferred_service);
    let allergies = data.allergies.or(current.allergies);
    let notes = data.notes.or(current.notes);

    conn.execute(
        "UPDATE customers SET name = ?2, phone = ?3, email = ?4, birthdate = ?5, gender = ?6,
         preferred_designer_id = ?7, preferred_service = ?8, allergies = ?9, notes = ?10,
         updated_at = ?11 WHERE id = ?1",
        rusqlite::params![
            id, name, phone, email, birthdate, gender,
            preferred_designer_id, preferred_service, allergies, notes, now
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Customer {
        id,
        name,
        phone,
        email,
        birthdate,
        gender,
        preferred_designer_id,
        preferred_service,
        allergies,
        total_visits: current.total_visits,
        last_visit_date: current.last_visit_date,
        notes,
        created_at: current.created_at,
        updated_at: now,
    })
}

#[tauri::command]
pub fn delete_customer(id: String, db: State<DbState>) -> Result<(), String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    conn.execute("DELETE FROM customers WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn search_customers(query: String, db: State<DbState>) -> Result<Vec<Customer>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let search_pattern = format!("%{}%", query);

    let mut stmt = conn
        .prepare(
            "SELECT id, name, phone, email, birthdate, gender, preferred_designer_id,
                    preferred_service, allergies, total_visits, last_visit_date, notes,
                    created_at, updated_at
             FROM customers
             WHERE name LIKE ?1 OR phone LIKE ?1
             ORDER BY name
             LIMIT 10"
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([&search_pattern], |row| row_to_customer(row))
        .map_err(|e| e.to_string())?;

    let customers: Vec<Customer> = rows.filter_map(|r| r.ok()).collect();

    Ok(customers)
}

#[tauri::command]
pub fn get_customer_by_phone(phone: String, db: State<DbState>) -> Result<Option<Customer>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let result = conn.query_row(
        "SELECT id, name, phone, email, birthdate, gender, preferred_designer_id,
                preferred_service, allergies, total_visits, last_visit_date, notes,
                created_at, updated_at
         FROM customers WHERE phone = ?1",
        [&phone],
        |row| row_to_customer(row),
    );

    match result {
        Ok(customer) => Ok(Some(customer)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn get_customer_reservations(
    customer_id: String,
    db: State<DbState>,
) -> Result<Vec<CustomerReservation>, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // 고객 이름 조회
    let customer_name: String = conn
        .query_row(
            "SELECT name FROM customers WHERE id = ?1",
            [&customer_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // customer_id 또는 customer_name으로 예약 조회
    let mut stmt = conn
        .prepare(
            "SELECT r.id, r.date, r.time, r.service_type, d.name as designer_name, r.status, r.notes
             FROM reservations r
             LEFT JOIN designers d ON r.designer_id = d.id
             WHERE r.customer_id = ?1 OR r.customer_name = ?2
             ORDER BY r.date DESC, r.time DESC"
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![customer_id, customer_name], |row| {
            Ok(CustomerReservation {
                id: row.get(0)?,
                date: row.get(1)?,
                time: row.get(2)?,
                service_type: row.get(3)?,
                designer_name: row.get(4)?,
                status: row.get(5)?,
                notes: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let reservations: Vec<CustomerReservation> = rows.filter_map(|r| r.ok()).collect();

    Ok(reservations)
}

#[tauri::command]
pub fn update_customer_visit_stats(customer_id: String, db: State<DbState>) -> Result<(), String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    // 고객 이름 조회
    let customer_name: String = conn
        .query_row(
            "SELECT name FROM customers WHERE id = ?1",
            [&customer_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 완료된 예약 수 계산
    let total_visits: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM reservations
             WHERE (customer_id = ?1 OR customer_name = ?2) AND status = 'completed'",
            rusqlite::params![customer_id, customer_name],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 마지막 방문일 조회
    let last_visit_date: Option<String> = conn
        .query_row(
            "SELECT date FROM reservations
             WHERE (customer_id = ?1 OR customer_name = ?2) AND status = 'completed'
             ORDER BY date DESC LIMIT 1",
            rusqlite::params![customer_id, customer_name],
            |row| row.get(0),
        )
        .ok();

    // 고객 정보 업데이트
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "UPDATE customers SET total_visits = ?2, last_visit_date = ?3, updated_at = ?4 WHERE id = ?1",
        rusqlite::params![customer_id, total_visits, last_visit_date, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
