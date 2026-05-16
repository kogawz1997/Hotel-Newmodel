export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, ExternalLink } from 'lucide-react';

const GDS_PROVIDERS = [
  {
    name: 'Amadeus',
    logo: '✈️',
    description: 'Global Distribution System — เชื่อมต่อกับ travel agents ทั่วโลก',
    status: 'coming_soon',
    features: ['Real-time availability', 'Rate synchronization', 'Booking retrieval', 'Hotel content'],
    link: 'https://developers.amadeus.com',
  },
  {
    name: 'Sabre',
    logo: '🌐',
    description: 'SynXis Channel Manager — chain hotels & enterprise',
    status: 'coming_soon',
    features: ['SynXis CRS', 'Rate & inventory mgmt', 'Global distribution', 'Reporting'],
    link: 'https://developer.sabre.com',
  },
  {
    name: 'Travelport (Galileo)',
    logo: '🗺️',
    description: 'อีก GDS หลักในตลาดยุโรปและเอเชีย',
    status: 'coming_soon',
    features: ['UAPI integration', 'Multi-GDS support', 'Agency connectivity'],
    link: 'https://developer.travelport.com',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  connected: { label: 'เชื่อมต่อแล้ว', color: 'bg-emerald-100 text-emerald-700' },
  coming_soon: { label: 'เร็วๆ นี้', color: 'bg-secondary text-muted-foreground' },
  error: { label: 'มีปัญหา', color: 'bg-red-100 text-red-700' },
};

export default async function GDSPage() {
  await requireDashboardRole(['owner', 'admin'] as any[]);

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="GDS Connection" description="เชื่อมต่อ Amadeus, Sabre เพื่อกระจายห้องไปยัง Travel Agents ทั่วโลก" />

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <p>GDS integration ต้องการ Enterprise plan และ contract กับ GDS provider โดยตรง ติดต่อทีมเราเพื่อเริ่มต้น</p>
      </div>

      <div className="grid gap-4">
        {GDS_PROVIDERS.map(provider => {
          const status = STATUS_LABELS[provider.status];
          return (
            <Card key={provider.name}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{provider.logo}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        <Badge className={`${status.color} border-0 text-2xs`}>{status.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
                    </div>
                  </div>
                  <a href={provider.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />Docs
                  </a>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {provider.features.map(f => (
                    <span key={f} className="text-2xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{f}</span>
                  ))}
                </div>
                <button
                  disabled
                  className="mt-4 w-full py-2 text-sm rounded-xl bg-secondary text-muted-foreground cursor-not-allowed border border-dashed border-border">
                  <Globe className="h-4 w-4 inline mr-1.5" />เชื่อมต่อ (Enterprise)
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
