'use client';

import { ReactNode } from 'react';
import { Lock, Zap } from 'lucide-react';
import Link from 'next/link';

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', standard: 'Standard', pro: 'Pro', enterprise: 'Enterprise',
};

interface UpgradeGateProps {
  allowed: boolean;
  requiredPlan?: string;
  feature?: string;
  children: ReactNode;
}

export function UpgradeGate({ allowed, requiredPlan = 'standard', feature, children }: UpgradeGateProps) {
  if (allowed) return <>{children}</>;
  return (
    <div className="relative rounded-2xl border border-border overflow-hidden">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{feature || 'ฟีเจอร์นี้'} ต้องการแผน {PLAN_LABELS[requiredPlan]}</p>
          <p className="text-xs text-muted-foreground mt-0.5">อัปเกรดเพื่อปลดล็อกฟีเจอร์นี้</p>
        </div>
        <Link href="/dashboard/billing"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Zap className="h-3.5 w-3.5" />อัปเกรดตอนนี้
        </Link>
      </div>
      <div className="pointer-events-none select-none opacity-30 p-6">{children}</div>
    </div>
  );
}

interface UpgradePromptProps {
  feature: string;
  requiredPlan?: string;
  className?: string;
}

export function UpgradePrompt({ feature, requiredPlan = 'standard', className }: UpgradePromptProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className || ''}`}>
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <p className="font-semibold text-sm">{feature} ต้องการแผน {PLAN_LABELS[requiredPlan]}</p>
      <Link href="/dashboard/billing"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
        <Zap className="h-3.5 w-3.5" />ดูแผนราคา
      </Link>
    </div>
  );
}
