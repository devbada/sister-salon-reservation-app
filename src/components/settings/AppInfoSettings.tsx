import { Info, Mail, FileText, Shield, ExternalLink } from 'lucide-react';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

interface InfoItem {
  icon: React.ReactNode;
  label: string;
  value?: string;
  link?: string;
  isExternal?: boolean;
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
    link: 'https://example.com/privacy',
    isExternal: true,
  },
  {
    icon: <FileText className="w-4 h-4" />,
    label: '이용약관',
    link: 'https://example.com/terms',
    isExternal: true,
  },
  {
    icon: <Mail className="w-4 h-4" />,
    label: '문의하기',
    link: 'mailto:support@example.com',
    isExternal: true,
  },
];

export function AppInfoSettings() {
  return (
    <div className="space-y-4">
      {/* App Logo & Name */}
      <div className="card p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                        flex items-center justify-center shadow-lg">
          <span className="text-3xl">💇</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Sisters Salon
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          헤어 살롱 예약 관리 앱
        </p>
      </div>

      {/* Info List */}
      <div className="card divide-y divide-gray-200 dark:divide-gray-700">
        {infoItems.map((item, index) => (
          item.link ? (
            <a
              key={index}
              href={item.link}
              target={item.isExternal ? '_blank' : undefined}
              rel={item.isExternal ? 'noopener noreferrer' : undefined}
              className="flex items-center justify-between p-4
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
            </a>
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
        <p>&copy; 2024-2026 Sisters Salon. All rights reserved.</p>
      </div>
    </div>
  );
}
