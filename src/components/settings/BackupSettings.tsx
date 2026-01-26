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
  Clock,
} from 'lucide-react';
import { backupApi } from '../../lib/tauri';
import type { BackupInfo, CloudService } from '../../types';

interface ServiceOption {
  value: CloudService;
  label: string;
  icon: React.ReactNode;
  available: boolean;
  comingSoon?: boolean;
}

function useAvailableServices() {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkServices() {
      const platform = navigator.userAgent.toLowerCase();
      const isMac = platform.includes('mac');
      const isIOS = platform.includes('iphone') || platform.includes('ipad');
      const isAndroid = platform.includes('android');

      // Check if iCloud is actually available on the device
      let iCloudAvailable = false;
      if (isMac || isIOS) {
        try {
          iCloudAvailable = await backupApi.isIcloudAvailable();
        } catch {
          iCloudAvailable = false;
        }
      }

      const availableServices: ServiceOption[] = [
        {
          value: 'local' as CloudService,
          label: '로컬',
          icon: <HardDrive className="w-4 h-4" />,
          available: true,
        },
      ];

      // Add iCloud option for Apple devices
      if (isMac || isIOS) {
        availableServices.push({
          value: 'icloud' as CloudService,
          label: 'iCloud',
          icon: <Cloud className="w-4 h-4" />,
          available: iCloudAvailable,
          comingSoon: !iCloudAvailable,
        });
      }

      // Add Google Drive option for Android (coming soon)
      if (isAndroid) {
        availableServices.push({
          value: 'google_drive' as CloudService,
          label: 'Google Drive',
          icon: <Cloud className="w-4 h-4" />,
          available: false,
          comingSoon: true,
        });
      }

      setServices(availableServices);
      setIsLoading(false);
    }

    checkServices();
  }, []);

  return { services, isLoading };
}

export function BackupSettings() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selectedService, setSelectedService] = useState<CloudService>('local');
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'restore' | 'delete';
    backup: BackupInfo;
  } | null>(null);

  const { services, isLoading: isLoadingServices } = useAvailableServices();
  const currentService = services.find((s) => s.value === selectedService);

  useEffect(() => {
    // Only load backups if the service is available (not "coming soon")
    const service = services.find((s) => s.value === selectedService);
    if (service?.available && !service?.comingSoon) {
      loadBackups();
    } else {
      setBackups([]);
    }
  }, [selectedService, services]);

  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      console.log('[BackupSettings] Loading backups for service:', selectedService);
      const list = await backupApi.list(selectedService);
      console.log('[BackupSettings] Loaded backups:', list);
      setBackups(list);
    } catch (error) {
      console.error('[BackupSettings] Failed to load backups:', error);
      setMessage({ success: false, text: `백업 목록 로드 실패: ${error}` });
      setBackups([]);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleDebug = async () => {
    try {
      const info = await backupApi.getDebugInfo(selectedService);
      setDebugInfo(info);
      console.log('[BackupSettings] Debug info:', info);
    } catch (error) {
      setDebugInfo(`Error: ${error}`);
      console.error('[BackupSettings] Debug error:', error);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setMessage(null);

    try {
      console.log('[BackupSettings] Creating backup for service:', selectedService);
      const backup = await backupApi.create(selectedService);
      console.log('[BackupSettings] Backup created:', backup);
      setMessage({ success: true, text: `백업 완료: ${backup.filename}` });
      loadBackups();
    } catch (error) {
      console.error('[BackupSettings] Backup failed:', error);
      setMessage({ success: false, text: `백업 실패: ${error}` });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreClick = (backup: BackupInfo) => {
    setConfirmModal({ type: 'restore', backup });
  };

  const handleDeleteClick = (backup: BackupInfo) => {
    setConfirmModal({ type: 'delete', backup });
  };

  const handleConfirm = async () => {
    if (!confirmModal) return;

    const { type, backup } = confirmModal;
    setConfirmModal(null);

    if (type === 'restore') {
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
    } else if (type === 'delete') {
      try {
        await backupApi.delete(backup.filename, selectedService);
        setMessage({ success: true, text: '백업이 삭제되었습니다.' });
        loadBackups();
      } catch (error) {
        setMessage({ success: false, text: `삭제 실패: ${error}` });
      }
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
    <>
      {/* 확인 모달 */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {confirmModal.type === 'restore' ? '백업 복원' : '백업 삭제'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmModal.type === 'restore'
                ? `"${confirmModal.backup.filename}" 백업으로 복원하시겠습니까?\n\n현재 데이터가 덮어씌워집니다.`
                : `"${confirmModal.backup.filename}" 백업을 삭제하시겠습니까?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600
                           text-gray-700 dark:text-gray-300 font-medium
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-white transition-colors
                  ${confirmModal.type === 'restore'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-red-600 hover:bg-red-700'}`}
              >
                {confirmModal.type === 'restore' ? '복원' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        {isLoadingServices ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex gap-2">
            {services.map((service) => (
              <button
                key={service.value}
                onClick={() => setSelectedService(service.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3
                           rounded-xl font-medium text-sm transition-colors relative
                  ${
                    selectedService === service.value
                      ? service.comingSoon
                        ? 'bg-gray-500 text-white'
                        : 'bg-indigo-600 text-white'
                      : 'bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300'
                  }
                  ${service.comingSoon ? 'opacity-70' : ''}`}
              >
                {service.comingSoon ? <Clock className="w-4 h-4" /> : service.icon}
                <span>{service.label}</span>
                {service.comingSoon && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full">
                    준비중
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Coming Soon 메시지 */}
        {currentService?.comingSoon && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-sm">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              {selectedService === 'google_drive'
                ? 'Google Drive 백업은 추후 업데이트에서 지원될 예정입니다.'
                : '이 서비스는 아직 지원되지 않습니다.'}
            </span>
          </div>
        )}

        {/* iCloud 안내 */}
        {selectedService === 'icloud' && currentService?.available && (
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm">
            <div className="flex items-start gap-2">
              <Cloud className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">iCloud 백업 정책</span>
            </div>
            <ul className="text-xs text-blue-700 dark:text-blue-400 ml-6 space-y-0.5 list-disc list-inside">
              <li>백업은 iCloud(CloudKit)에 저장됩니다</li>
              <li>같은 Apple ID로 로그인한 모든 기기에서 복원 가능</li>
              <li>최대 10개의 백업이 유지되며, 초과 시 오래된 백업 자동 삭제</li>
            </ul>
          </div>
        )}

        {/* 백업 버튼 */}
        <button
          onClick={handleBackup}
          disabled={isBackingUp || currentService?.comingSoon}
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

          {isLoadingBackups ? (
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
                      onClick={() => handleRestoreClick(backup)}
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
                      onClick={() => handleDeleteClick(backup)}
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

        {/* 디버그 섹션 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDebug}
            className="text-xs text-gray-500 dark:text-gray-400 underline"
          >
            경로 정보 보기 (디버그)
          </button>
          {debugInfo && (
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 overflow-auto whitespace-pre-wrap">
              {debugInfo}
            </pre>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
