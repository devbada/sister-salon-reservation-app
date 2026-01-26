import { AlertTriangle } from 'lucide-react';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';

export function UnsavedChangesDialog() {
  const { showWarning, confirmNavigation, cancelNavigation } = useUnsavedChanges();

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={cancelNavigation}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              저장하지 않은 변경사항
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            저장하지 않은 변경사항이 있습니다. 이동하면 변경사항이 사라집니다.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 pt-0">
          <button
            onClick={cancelNavigation}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300
                     bg-gray-100 dark:bg-gray-700 rounded-xl
                     hover:bg-gray-200 dark:hover:bg-gray-600
                     active:scale-[0.98] transition-all"
          >
            취소
          </button>
          <button
            onClick={confirmNavigation}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white
                     bg-red-500 rounded-xl
                     hover:bg-red-600
                     active:scale-[0.98] transition-all"
          >
            이동하기
          </button>
        </div>
      </div>
    </div>
  );
}
