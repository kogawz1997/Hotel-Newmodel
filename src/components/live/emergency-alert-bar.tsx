'use client';
import { X, AlertOctagon } from 'lucide-react';

interface Props { active: boolean; message?: string; onDismiss?: () => void; }

export function EmergencyAlertBar({ active, message, onDismiss }: Props) {
  if (!active) return null;
  return (
    <div className="w-full bg-red-600 text-white px-4 py-2.5 flex items-center gap-3 animate-pulse">
      <AlertOctagon className="h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-bold">{message ?? '⚠ EMERGENCY ALERT — กรุณาปฏิบัติตามขั้นตอนฉุกเฉิน'}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 rounded hover:bg-red-700 transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
