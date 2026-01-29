import { Info, Mail, FileText, Shield, ExternalLink } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

interface InfoItem {
  icon: React.ReactNode;
  label: string;
  value?: string;
  link?: string;
}

const infoItems: InfoItem[] = [
  {
    icon: <Info className="w-4 h-4" />,
    label: '버전',
    value: `${APP_VERSION} (${BUILD_NUMBER})`,
  },
  {
    icon: <Shield className="w-4 h-4" />,
    label: '개인정보처리방침',
    link: 'https://devbada.github.io/sister-salon-reservation-app/privacy.html',
  },
  {
    icon: <FileText className="w-4 h-4" />,
    label: '이용약관',
    link: 'https://devbada.github.io/sister-salon-reservation-app/terms.html',
  },
  {
    icon: <Mail className="w-4 h-4" />,
    label: '문의하기',
    link: 'mailto:imdevbada@gmail.com',
  },
];

export function AppInfoSettings() {
  const handleOpenLink = async (url: string) => {
    try {
      if ('__TAURI_INTERNALS__' in window) {
        await invoke('open_external_url', { url });
      } else {
        window.open(url, '_blank');
      }
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* App Logo & Name */}
      <div className="card p-6 text-center">
        <img
          src="/icon.png"
          alt="Sisters Salon"
          className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
        />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          언니들의 미용실
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          헤어 살롱 예약 관리 앱
        </p>
      </div>

      {/* Info List */}
      <div className="card divide-y divide-gray-200 dark:divide-gray-700">
        {infoItems.map((item, index) => (
          item.link ? (
            <button
              key={index}
              type="button"
              onClick={() => handleOpenLink(item.link!)}
              className="flex items-center justify-between p-4 w-full text-left
                         hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400">
                  {item.icon}
                </span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {item.label}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          ) : (
            <div
              key={index}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400">
                  {item.icon}
                </span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {item.label}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {item.value}
              </span>
            </div>
          )
        ))}
      </div>

      {/* Copyright */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
        <p>&copy; Since 2026 언니들의 미용실. All rights reserved.</p>
      </div>
    </div>
  );
}
