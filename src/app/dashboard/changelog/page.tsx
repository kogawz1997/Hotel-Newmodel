export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Sparkles } from 'lucide-react';

const CHANGELOG: { version: string; date: string; type: 'feature' | 'fix' | 'improvement'; items: string[] }[] = [
  {
    version: 'v2.5.0', date: '2026-05-16', type: 'feature',
    items: [
      'Multi-currency reconciliation + daily FX rate entry',
      'Before/after photo comparison slider in housekeeping inspection',
      'Cleaning time tracking with live start/stop timer',
      'Auto-assign housekeeping tasks by floor/zone',
      'SLA tracking + escalation dashboard for maintenance',
      'Equipment history log with warranty expiry alerts',
      'Auto-reorder alerts for low-stock parts',
      'Dietary & allergy auto-alert to kitchen',
      'Recipe costing with Gross Margin % per menu item',
      'Spa + room package bundling UI',
      'Restaurant recommendations + concierge booking for guests',
      'Activity/tour booking management',
      'Therapist performance dashboard',
    ],
  },
  {
    version: 'v2.4.0', date: '2026-04-28', type: 'feature',
    items: [
      'Analytics: P&L statement, Staff KPI, Guest satisfaction trend',
      'Rate parity checker for OTA channels',
      'Blackout date management (all-channels toggle)',
      'EOD cash drawer close-of-day report',
      'Table reservation system for hotel restaurant',
      'Room amenity inventory (soap, towels, etc.) per room',
      'VAPID web push notifications for housekeeping tasks',
      'Guest pre-checkout briefing page',
      'Lost & found report from guest portal',
      'Vendor management for maintenance',
    ],
  },
  {
    version: 'v2.3.0', date: '2026-04-10', type: 'feature',
    items: [
      'Gallery lightbox with fullscreen + video embed',
      'Google Maps integration on booking confirmation',
      'Promo code UX improvements (inline error messages)',
      'DatePicker, DataTable, Tabs, Pagination, CopyButton components',
      'Thai error messages library',
    ],
  },
  {
    version: 'v2.2.0', date: '2026-03-20', type: 'improvement',
    items: [
      'Walk-in check-in flow improvements',
      'Express checkout with real folio data',
      'Late checkout auto-charge when manager approves',
      'Overbooking prevention warning',
      'Guest preference profile (bed type, floor, dietary)',
    ],
  },
];

const TYPE_CFG = {
  feature: { label: 'Feature', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  improvement: { label: 'Improvement', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  fix: { label: 'Bug Fix', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
};

export default async function ChangelogPage() {
  await requireDashboardRole(['owner', 'admin', 'manager'] as any[]);

  return (
    <div className="container max-w-3xl py-8 animate-fade-in">
      <TopBar title="What's New" description="Changelog และฟีเจอร์ใหม่ของ Maitri PMS" />

      <div className="space-y-8 mt-6">
        {CHANGELOG.map(entry => {
          const cfg = TYPE_CFG[entry.type];
          return (
            <div key={entry.version} className="relative pl-6 border-l-2 border-border">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-bold text-lg">{entry.version}</h2>
                <span className={`text-2xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
