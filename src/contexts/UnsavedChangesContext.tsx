import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  pendingNavigation: (() => void) | null;
  setPendingNavigation: (callback: (() => void) | null) => void;
  showWarning: boolean;
  setShowWarning: (value: boolean) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  checkAndNavigate: (navigateCallback: () => void) => boolean;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      pendingNavigation();
    }
    setHasUnsavedChanges(false);
    setPendingNavigation(null);
    setShowWarning(false);
  }, [pendingNavigation]);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
    setShowWarning(false);
  }, []);

  // Returns true if navigation should proceed immediately, false if blocked by warning
  const checkAndNavigate = useCallback((navigateCallback: () => void): boolean => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigateCallback);
      setShowWarning(true);
      return false;
    }
    navigateCallback();
    return true;
  }, [hasUnsavedChanges]);

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        pendingNavigation,
        setPendingNavigation,
        showWarning,
        setShowWarning,
        confirmNavigation,
        cancelNavigation,
        checkAndNavigate,
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
  }
  return context;
}
