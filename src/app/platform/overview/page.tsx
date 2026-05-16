export const dynamic = 'force-dynamic';
/**
 * /platform/overview — SaaS platform MRR/ARR dashboard for platform admins.
 */
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { subDays, format } from 'date-fns';

const PLAN_PRICES: Record<string, number> = {
  starter:    1490,
  standard:   2990,
  pro:        5990,
  enterprise: 0,
};

export default async function PlatformOverviewPage() {
  const ctx = await requirePlatformAdmin();
  if (ctx.error) redirect('/auth/login');

  const admin = createAdminClient();
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];

  const [orgsResult, hotelsResult, usersResult, newOrgsResult, trialResult, churnsResult] = await Promise.all([
    admin.from('organizations').select('id, name, subscription_plan, subscription_status, created_at, trial_ends_at'),
    admin.from('hotels').select('id', { count: 'exact', head: true }),
    admin.from('user_profiles').select('id', { count: 'exact', head: true }),
    admin.from('organizations').select('id, subscription_plan').gte('created_at', thirtyDaysAgo + 'T00:00:00Z'),
    admin.from('organizations').select('id').eq('subscription_status', 'trialing'),
    admin.from('organizations').select('id').eq('subscription_status', 'cancelled').gte('updated_at', thirtyDaysAgo + 'T00:00:00Z'),
  ]);

  const orgs   = orgsResult.data ?? [];
  const active = orgs.filter(o => o.subscription_status === 'active');
  const mrr    = active.reduce((s, o) => s + (PLAN_PRICES[o.subscription_plan] ?? 0), 0);
  const arr    = mrr * 12;

  const planBreakdown: Record<string, number> = {};
  for (const o of active) {
    const p = o.subscription_plan ?? 'unknown';
    planBreakdown[p] = (planBreakdown[p] ?? 0) + 1;
  }

  const newThisMonth = newOrgsResult.data?.length ?? 0;
  const trials       = trialResult.data?.length ?? 0;
  const churns       = churnsResult.data?.length ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 text-sm">{format(new Date(), 'MMMM yyyy')} · Live data</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: formatCurrency(mrr), sub: 'Monthly Recurring' },
          { label: 'ARR', value: formatCurrency(arr), sub: 'Annual Run Rate' },
          { label: 'Active Tenants', value: active.length, sub: `${orgs.length} total` },
          { label: 'Total Hotels', value: hotelsResult.count ?? 0, sub: `${usersResult.count ?? 0} users` },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-xs text-gray-500">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'New (30d)', value: newThisMonth, color: 'text-green-400' },
          { label: 'On Trial', value: trials, color: 'text-yellow-400' },
          { label: 'Churned (30d)', value: churns, color: 'text-red-400' },
        ].map(m => (
          <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{m.label}</div>
            <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Plan Distribution (Active)</h2>
        <div className="space-y-2">
          {Object.entries(PLAN_PRICES).map(([plan, price]) => {
            const count = planBreakdown[plan] ?? 0;
            const pct   = active.length > 0 ? Math.round((count / active.length) * 100) : 0;
            return (
              <div key={plan} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-24 capitalize">{plan}</span>
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-white w-12 text-right">{count} ({pct}%)</span>
                <span className="text-xs text-gray-500 w-20 text-right">{formatCurrency(price * count)}/mo</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
