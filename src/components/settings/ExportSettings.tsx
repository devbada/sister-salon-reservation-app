import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { exportApi } from '../../lib/tauri';
import type { ExportPeriod } from '../../types';

const PERIOD_OPTIONS: { value: ExportPeriod; label: string }[] = [
  { value: 'this_month', label: '이번 달' },
  { value: 'last_3_months', label: '최근 3개월' },
  { value: 'all', label: '전체' },
];

export function ExportSettings() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('this_month');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleExportExcel = async () => {
    setIsExporting(true);
    setResult(null);

    try {
      const path = await exportApi.toExcel(exportPeriod);
      setResult({ success: true, message: `Excel 파일이 저장되었습니다:\n${path}` });
    } catch (error) {
      setResult({ success: false, message: `내보내기 실패: ${error}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    setResult(null);

    try {
      const path = await exportApi.toCsv(exportPeriod);
      setResult({ success: true, message: `CSV 파일이 저장되었습니다:\n${path}` });
    } catch (error) {
      setResult({ success: false, message: `내보내기 실패: ${error}` });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white">데이터 내보내기</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">예약 데이터를 파일로 내보냅니다</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 기간 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            내보내기 기간
          </label>
          <select
            value={exportPeriod}
            onChange={(e) => setExportPeriod(e.target.value as ExportPeriod)}
            className="input w-full"
            disabled={isExporting}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 내보내기 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 py-3 px-4
                       bg-green-600 hover:bg-green-700 text-white rounded-xl
                       font-medium transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 py-3 px-4
                       bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                       font-medium transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>CSV</span>
          </button>
        </div>

        {/* 결과 메시지 */}
        {result && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              result.success
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span className="break-all">{result.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
