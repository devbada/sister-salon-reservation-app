import { Type, Maximize, Eye } from 'lucide-react';
import { useDisplaySettings, type TextSize, type ButtonSize } from '../../contexts/DisplaySettingsContext';

const textSizeOptions: { value: TextSize; label: string; desc: string }[] = [
  { value: 'normal', label: '보통', desc: '기본 크기' },
  { value: 'large', label: '크게', desc: '큰 글씨' },
  { value: 'extraLarge', label: '아주 크게', desc: '가장 큰 글씨' },
];

const buttonSizeOptions: { value: ButtonSize; label: string; desc: string }[] = [
  { value: 'normal', label: '보통', desc: '기본 크기' },
  { value: 'large', label: '크게', desc: '큰 버튼' },
];

export function DisplaySettings() {
  const { settings, updateSettings } = useDisplaySettings();

  return (
    <div className="space-y-6">
      {/* Text Size */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">글씨 크기</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">앱 전체 글씨 크기를 조절합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {textSizeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ textSize: opt.value })}
              className={`p-4 rounded-xl border-2 transition-all text-center
                ${settings.textSize === opt.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <p className={`font-semibold mb-1 ${
                settings.textSize === opt.value
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Button Size */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
            <Maximize className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">버튼 크기</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">버튼과 입력 필드의 크기를 조절합니다</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {buttonSizeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ buttonSize: opt.value })}
              className={`p-4 rounded-xl border-2 transition-all text-center
                ${settings.buttonSize === opt.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <p className={`font-semibold mb-1 ${
                settings.buttonSize === opt.value
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* High Contrast */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">고대비 모드</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">더 선명한 색상으로 표시</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300
                            dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700
                            peer-checked:after:translate-x-full peer-checked:after:border-white
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:bg-white after:border-gray-300 after:border after:rounded-full
                            after:h-5 after:w-5 after:transition-all dark:border-gray-600
                            peer-checked:bg-indigo-600" />
          </label>
        </div>
      </div>

      {/* Live Preview */}
      <div className="glass-card">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">미리보기</h3>
        <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="heading-2">제목 텍스트</p>
          <p className="text-body text-gray-700 dark:text-gray-300">
            본문 텍스트입니다. 이 크기로 대부분의 내용이 표시됩니다.
          </p>
          <p className="text-caption">
            보조 텍스트와 설명이 이 크기로 표시됩니다.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary">버튼 예시</button>
            <button className="btn btn-secondary">보조 버튼</button>
          </div>
          <input
            type="text"
            className="input"
            placeholder="입력 필드 예시"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
