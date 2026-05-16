'use client';

import { useState } from 'react';
import { Zap, X, Clock } from 'lucide-react';
import Link from 'next/link';

interface TrialNudgeBannerProps {
  trialEndsAt: string;
  plan: string;
}

export function TrialNudgeBanner({ trialEndsAt, plan }: TrialNudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || plan !== 'starter') return null;

  const daysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000));
  const trialActive = new Date(trialEndsAt) > new Date();
  if (!trialActive) return null;

  const urgent = daysLeft <= 3;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm border-b ${urgent ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300' : 'bg-primary/5 border-primary/10 text-foreground'}`}
      role="alert" aria-live="polite">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {urgent ? <Clock className="h-4 w-4 shrink-0 text-amber-600" /> : <Zap className="h-4 w-4 shrink-0 text-primary" />}
        <span>
          {urgent
            ? <><strong>เหลืออีก {daysLeft} วัน</strong> ก่อน trial หมด — อัปเกรดเพื่อไม่ให้ระบบหยุดทำงาน</>
            : <>คุณกำลังใช้งาน Trial Plan · เหลือ <strong>{daysLeft} วัน</strong></>
          }
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/dashboard/billing"
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${urgent ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
          อัปเกรด
        </Link>
        <button onClick={() => setDismissed(true)} aria-label="ปิด" className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
