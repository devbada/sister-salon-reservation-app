import { useState, useEffect } from 'react';
import {
  Cloud,
  HardDrive,
  RefreshCw,
  Download,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { backupApi } from '../../lib/tauri';
import type { BackupInfo, CloudService } from '../../types';

interface ServiceOption {
  value: CloudService;
  label: string;
  icon: React.ReactNode;
  available: boolean;
}

function getAvailableServices(): ServiceOption[] {
  const platform = navigator.userAgent.toLowerCase();
  const isMac = platform.includes('mac');
  const isIOS = platform.includes('iphone') || platform.includes('ipad');
  const isAndroid = platform.includes('android');

  const services: ServiceOption[] = [
    {
      value: 'local' as CloudService,
      label: '로컬',
      icon: <HardDrive className="w-4 h-4" />,
      available: true,
    },
    {
      value: 'icloud' as CloudService,
      label: 'iCloud',
      icon: <Cloud className="w-4 h-4" />,
      available: isMac || isIOS,
    },
    {
      value: 'google_drive' as CloudService,
      label: 'Google Drive',
      icon: <Cloud className="w-4 h-4" />,
      available: isAndroid,
    },
  ];

  return services.filter((s) => s.available);
}

export function BackupSettings() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selectedService, setSelectedService] = useState<CloudService>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  const services = getAvailableServices();

  useEffect(() => {
    loadBackups();
  }, [selectedService]);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const list = await backupApi.list(selectedService);
      setBackups(list);
    } catch (error) {
      console.error('Failed to load backups:', error);
      setBackups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setMessage(null);

    try {
      const backup = await backupApi.create(selectedService);
      setMessage({ success: true, text: `백업 완료: ${backup.filename}` });
      loadBackups();
    } catch (error) {
      setMessage({ success: false, text: `백업 실패: ${error}` });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (backup: BackupInfo) => {
    if (!confirm(`"${backup.filename}" 백업으로 복원하시겠습니까?\n\n현재 데이터가 덮어씌워집니다.`)) {
      return;
    }

    setIsRestoring(backup.id);
    setMessage(null);

    try {
      await backupApi.restore(backup.filename, selectedService);
      setMessage({ success: true, text: '복원 완료! 앱을 다시 시작해주세요.' });
    } catch (error) {
      setMessage({ success: false, text: `복원 실패: ${error}` });
    } finally {
      setIsRestoring(null);
    }
  };

  const handleDelete = async (backup: BackupInfo) => {
    if (!confirm(`"${backup.filename}" 백업을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await backupApi.delete(backup.filename);
      setMessage({ success: true, text: '백업이 삭제되었습니다.' });
      loadBackups();
    } catch (error) {
      setMessage({ success: false, text: `삭제 실패: ${error}` });
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white">백업 & 복원</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">데이터를 백업하고 복원합니다</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 서비스 선택 */}
        <div className="flex gap-2">
          {services.map((service) => (
            <button
              key={service.value}
              onClick={() => setSelectedService(service.value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3
                         rounded-xl font-medium text-sm transition-colors
                ${
                  selectedService === service.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300'
                }`}
            >
              {service.icon}
              <span>{service.label}</span>
            </button>
          ))}
        </div>

        {/* 백업 버튼 */}
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          className="w-full flex items-center justify-center gap-2 py-3 px-4
                     bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl
                     font-medium transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBackingUp ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>백업 중...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>지금 백업하기</span>
            </>
          )}
        </button>

        {/* 메시지 */}
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.success
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {message.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 백업 목록 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">백업 목록</h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <span className="text-sm">백업이 없습니다</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3
                             bg-white/30 dark:bg-white/5 rounded-xl"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-800 dark:text-white truncate">
                      {backup.filename}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(backup.createdAt)} · {formatSize(backup.size)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleRestore(backup)}
                      disabled={isRestoring !== null}
                      className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10
                                 text-indigo-600 dark:text-indigo-400 transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="복원"
                    >
                      {isRestoring === backup.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(backup)}
                      disabled={isRestoring !== null}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30
                                 text-red-600 dark:text-red-400 transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
