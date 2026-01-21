# Phase 5: 통계 대시보드

## 브랜치 정보

| 항목 | 값 |
|------|-----|
| **브랜치명** | `task/05-statistics` |
| **Base 브랜치** | `develop` |
| **예상 소요 시간** | 2일 |

```bash
# 브랜치 생성
git checkout develop
git checkout -b task/05-statistics
```

---

## 목표

예약 데이터 기반 통계 대시보드 구현

## 산출물

- 통계 계산 로직 (Rust)
- 차트 컴포넌트 (Recharts)
- 기간별 필터링
- 반응형 차트 레이아웃

---

## 통계 데이터 구조

### Rust 타입 정의

```rust
// src-tauri/src/commands/statistics.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
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
pub struct TopDesigner {
    pub name: String,
    pub count: i32,
}

#[derive(Debug, Serialize)]
pub struct TopService {
    pub name: String,
    pub count: i32,
}

#[derive(Debug, Serialize)]
pub struct DailyStatistic {
    pub date: String,
    pub total: i32,
    pub completed: i32,
    pub cancelled: i32,
}

#[derive(Debug, Serialize)]
pub struct HourlyStatistic {
    pub hour: String,
    pub count: i32,
}

#[derive(Debug, Serialize)]
pub struct DesignerStatistic {
    pub designer_id: String,
    pub designer_name: String,
    pub total: i32,
    pub completed: i32,
    pub completion_rate: f64,
}
```

### TypeScript 타입 정의

```typescript
// src/types/statistics.ts
export interface StatisticsSummary {
  totalReservations: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  averagePerDay: number;
  busiestDay?: string;
  busiestHour?: string;
  topDesigner?: { name: string; count: number };
  topService?: { name: string; count: number };
  period: string;
}

export interface DailyStatistic {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface HourlyStatistic {
  hour: string;
  count: number;
}

export interface DesignerStatistic {
  designerId: string;
  designerName: string;
  total: number;
  completed: number;
  completionRate: number;
}

export type StatisticsPeriod = '7d' | '30d' | '90d' | 'all';
```

---

## Rust 통계 커맨드 구현

```rust
// src-tauri/src/commands/statistics.rs
use tauri::State;
use crate::db::DbState;

#[tauri::command]
pub fn get_statistics_summary(
    period: String,
    db: State<DbState>,
) -> Result<StatisticsSummary, String> {
    let db = db.0.lock().map_err(|e| e.to_string())?;
    let conn = db.conn();

    let days = match period.as_str() {
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
        WHERE date >= ?1 AND service_type IS NOT NULL
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

    let days = match period.as_str() {
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
```

---

## React 통계 컴포넌트

### src/components/statistics/StatisticsDashboard.tsx

```tsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useDeviceType } from '../../hooks/useDeviceType';
import type { StatisticsSummary, DailyStatistic, StatisticsPeriod } from '../../types/statistics';

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b'];

export function StatisticsDashboard() {
  const [period, setPeriod] = useState<StatisticsPeriod>('30d');
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceType = useDeviceType();

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [summaryData, dailyData] = await Promise.all([
        invoke<StatisticsSummary>('get_statistics_summary', { period }),
        invoke<DailyStatistic[]>('get_daily_statistics', {
          startDate: getStartDate(period),
          endDate: new Date().toISOString().split('T')[0],
        }),
      ]);
      setSummary(summaryData);
      setDailyStats(dailyData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (p: StatisticsPeriod): string => {
    const days = p === '7d' ? 7 : p === '30d' ? 30 : p === '90d' ? 90 : 365;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return <div className="glass-card text-center py-8">로딩 중...</div>;
  }

  const chartHeight = deviceType === 'mobile' ? 200 : 300;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">통계 대시보드</h1>

        {/* 기간 필터 */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as StatisticsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm ${
                period === p
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {p === '7d' ? '7일' : p === '30d' ? '30일' : '90일'}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="총 예약"
          value={summary?.totalReservations || 0}
          icon="📅"
        />
        <SummaryCard
          title="완료율"
          value={`${(summary?.completionRate || 0).toFixed(1)}%`}
          icon="✅"
        />
        <SummaryCard
          title="일평균"
          value={(summary?.averagePerDay || 0).toFixed(1)}
          icon="📊"
        />
        <SummaryCard
          title="취소율"
          value={`${summary?.totalReservations ? ((summary.cancelled / summary.totalReservations) * 100).toFixed(1) : 0}%`}
          icon="❌"
        />
      </div>

      {/* 차트 영역 */}
      <div className={`grid gap-6 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* 일별 추이 */}
        <div className="glass-card">
          <h3 className="font-medium mb-4">일별 예약 추이</h3>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#6366f1" name="전체" />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" name="완료" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 상태별 분포 */}
        <div className="glass-card">
          <h3 className="font-medium mb-4">상태별 분포</h3>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={[
                  { name: '완료', value: summary?.completed || 0 },
                  { name: '취소', value: summary?.cancelled || 0 },
                  { name: '노쇼', value: summary?.noShow || 0 },
                  { name: '대기/확정', value: (summary?.totalReservations || 0) - (summary?.completed || 0) - (summary?.cancelled || 0) - (summary?.noShow || 0) },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 인기 정보 */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.busiestDay && (
            <InfoCard title="가장 바쁜 날" value={summary.busiestDay} />
          )}
          {summary.busiestHour && (
            <InfoCard title="가장 바쁜 시간" value={`${summary.busiestHour}:00`} />
          )}
          {summary.topDesigner && (
            <InfoCard title="톱 디자이너" value={`${summary.topDesigner.name} (${summary.topDesigner.count}건)`} />
          )}
          {summary.topService && (
            <InfoCard title="인기 서비스" value={`${summary.topService.name} (${summary.topService.count}건)`} />
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="glass-card">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="glass-card">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
```

---

## 커밋 메시지 가이드

```bash
# Rust 통계 커맨드
git commit -m "feat(statistics): 통계 계산 Tauri 커맨드 구현"

# 통계 대시보드
git commit -m "feat(statistics): StatisticsDashboard 컴포넌트 구현"

# 차트 컴포넌트
git commit -m "feat(statistics): Recharts 차트 컴포넌트 구현"

# 반응형 차트
git commit -m "feat(statistics): 반응형 차트 레이아웃 적용"
```

---

## 완료 기준 체크리스트

- [ ] 통계 요약 API 동작
- [ ] 일별 통계 API 동작
- [ ] 시간대별 통계 API 동작
- [ ] 요약 카드 표시
- [ ] 라인 차트 (일별 추이)
- [ ] 파이 차트 (상태별 분포)
- [ ] 기간 필터 동작
- [ ] 반응형 레이아웃

---

## 머지 조건

1. 모든 체크리스트 항목 완료
2. 통계 데이터 정확성 확인
3. 차트 렌더링 정상
4. 반응형 레이아웃 정상

```bash
git checkout develop
git merge --squash task/05-statistics
git commit -m "feat: Phase 5 - 통계 대시보드 구현 완료

- 통계 계산 Rust 커맨드
- StatisticsDashboard 컴포넌트
- Recharts 차트 (라인, 파이)
- 기간별 필터링
- 반응형 차트 레이아웃

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin develop
git branch -d task/05-statistics
```

---

## 다음 단계

Phase 6: [내보내기/백업](./06-export-backup.md)으로 진행
