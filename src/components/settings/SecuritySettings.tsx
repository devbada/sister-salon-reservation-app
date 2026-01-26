import { LockSettings } from './LockSettings';

interface SecuritySettingsProps {
  onLockSettingsChange?: () => void;
}

export function SecuritySettings({ onLockSettingsChange }: SecuritySettingsProps) {
  return (
    <div className="space-y-4">
      <LockSettings onSettingsChange={onLockSettingsChange} />
    </div>
  );
}
