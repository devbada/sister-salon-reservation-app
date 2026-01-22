import { Settings } from 'lucide-react';
import { ExportSettings } from './ExportSettings';
import { BackupSettings } from './BackupSettings';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="heading-2">설정</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">앱 설정을 관리합니다</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ExportSettings />
        <BackupSettings />
      </div>
    </div>
  );
}
