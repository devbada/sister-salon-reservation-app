import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  User,
  Scissors,
  Loader2,
} from 'lucide-react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { statisticsApi } from '../../lib/tauri';
import type {
  StatisticsSummary,
  DailyStatistic,
  HourlyStatistic,
  StatisticsPeriod,
} from '../../types';

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b'];
const PERIOD_LABELS: Record<StatisticsPeriod, string> = {
  '7d': '7일',
  '30d': '30일',
  '90d': '90일',
  all: '전체',
};

export function StatisticsDashboard() {
  const [period, setPeriod] = useState<StatisticsPeriod>('30d');
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStatistic[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deviceType = useDeviceType();

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, dailyData, hourlyData] = await Promise.all([
        statisticsApi.getSummary(period),
        statisticsApi.getDaily(getStartDate(period), getTodayDate()),
        statisticsApi.getHourly(period),
      ]);
      setSummary(summaryData);
      setDailyStats(dailyData);
      setHourlyStats(hourlyData);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError('통계 데이터를 불러오는데 실패했습니다.');
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

  const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="glass-card flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-3 text-gray-500">통계 데이터 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card text-center py-12">
        <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <p className="text-red-500">{error}</p>
        <button
          onClick={loadStatistics}
          className="mt-4 btn btn-primary"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const chartHeight = deviceType === 'mobile' ? 220 : 280;
  const isMobile = deviceType === 'mobile';

  // 파이 차트 데이터
  const pieData = [
    { name: '완료', value: summary?.completed || 0 },
    { name: '취소', value: summary?.cancelled || 0 },
    { name: '노쇼', value: summary?.noShow || 0 },
    {
      name: '대기/확정',
      value:
        (summary?.totalReservations || 0) -
        (summary?.completed || 0) -
        (summary?.cancelled || 0) -
        (summary?.noShow || 0),
    },
  ].filter((d) => d.value > 0);

  // 일별 데이터 포맷팅
  const formattedDailyStats = dailyStats.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="heading-2">통계 대시보드</h2>

        {/* Period Filter */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as StatisticsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="총 예약"
          value={summary?.totalReservations || 0}
          icon={<Calendar className="w-5 h-5" />}
          color="indigo"
        />
        <SummaryCard
          title="완료율"
          value={`${(summary?.completionRate || 0).toFixed(1)}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          title="일평균"
          value={(summary?.averagePerDay || 0).toFixed(1)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <SummaryCard
          title="취소/노쇼"
          value={`${(summary?.cancelled || 0) + (summary?.noShow || 0)}건`}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Daily Trend Chart */}
        <div className="glass-card">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
            일별 예약 추이
          </h3>
          {formattedDailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={formattedDailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="전체"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="완료"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="glass-card">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
            상태별 분포
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 50 : 60}
                  outerRadius={isMobile ? 75 : 90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#9ca3af' }}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400">
              데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* Hourly Distribution */}
      {hourlyStats.length > 0 && (
        <div className="glass-card">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">
            시간대별 예약 분포
          </h3>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={hourlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                tickFormatter={(h) => `${h}시`}
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${value}건`, '예약']}
                labelFormatter={(label) => `${label}시`}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.busiestDay && (
            <InfoCard
              title="가장 바쁜 날"
              value={summary.busiestDay}
              icon={<Calendar className="w-4 h-4" />}
            />
          )}
          {summary.busiestHour && (
            <InfoCard
              title="가장 바쁜 시간"
              value={`${summary.busiestHour}:00`}
              icon={<Clock className="w-4 h-4" />}
            />
          )}
          {summary.topDesigner && (
            <InfoCard
              title="톱 디자이너"
              value={`${summary.topDesigner.name} (${summary.topDesigner.count}건)`}
              icon={<User className="w-4 h-4" />}
            />
          )}
          {summary.topService && (
            <InfoCard
              title="인기 서비스"
              value={`${summary.topService.name} (${summary.topService.count}건)`}
              icon={<Scissors className="w-4 h-4" />}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'indigo' | 'green' | 'blue' | 'red';
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function InfoCard({ title, value, icon }: InfoCardProps) {
  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{title}</span>
      </div>
      <p className="font-semibold text-gray-800 dark:text-white">{value}</p>
    </div>
  );
}
