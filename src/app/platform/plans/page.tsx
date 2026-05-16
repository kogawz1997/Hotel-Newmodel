export const dynamic = 'force-dynamic';
/**
 * /platform/plans — Subscription plan management for platform admins.
 * Reads plan config from platform_config table (plan definitions).
 */
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const DEFAULT_PLANS = [
  {
    id:       'starter',
    name:     'Starter',
    priceThb: 1490,
    rooms:    50,
    hotels:   1,
    features: ['PMS Core', 'Housekeeping', 'Basic Reports', 'Email Support'],
  },
  {
    id:       'standard',
    name:     'Standard',
    priceThb: 2990,
    rooms:    150,
    hotels:   3,
    features: ['All Starter', 'F&B Module', 'OTA Sync', 'Maintenance', 'Priority Support'],
  },
  {
    id:       'pro',
    name:     'Pro',
    priceThb: 5990,
    rooms:    500,
    hotels:   10,
    features: ['All Standard', 'Revenue Management', 'AI Concierge', 'Custom Reports', 'API Access', '24/7 Support'],
  },
  {
    id:       'enterprise',
    name:     'Enterprise',
    priceThb: 0,
    rooms:    -1,
    hotels:   -1,
    features: ['All Pro', 'Unlimited Hotels', 'Custom Integrations', 'Dedicated CSM', 'SLA 99.9%'],
  },
];

export default async function PlatformPlansPage() {
  const ctx = await requirePlatformAdmin();
  if (ctx.error) redirect('/auth/login');

  const admin = createAdminClient();

  // Count orgs per plan
  const { data: orgs } = await admin
    .from('organizations')
    .select('subscription_plan, subscription_status');

  const countByPlan: Record<string, { active: number; total: number }> = {};
  for (const o of orgs ?? []) {
    const p = o.subscription_plan ?? 'unknown';
    if (!countByPlan[p]) countByPlan[p] = { active: 0, total: 0 };
    countByPlan[p].total += 1;
    if (o.subscription_status === 'active') countByPlan[p].active += 1;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
        <p className="text-gray-400 text-sm">Plan definitions and tenant distribution</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {DEFAULT_PLANS.map(plan => {
          const counts = countByPlan[plan.id] ?? { active: 0, total: 0 };
          const revenue = plan.priceThb * counts.active;

          return (
            <div key={plan.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-white text-lg">{plan.name}</div>
                  <div className="text-2xl font-bold text-indigo-400">
                    {plan.priceThb > 0 ? `฿${plan.priceThb.toLocaleString()}/mo` : 'Custom'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{counts.active}</div>
                  <div className="text-xs text-gray-500">active tenants</div>
                  {revenue > 0 && (
                    <div className="text-xs text-green-400 mt-1">฿{revenue.toLocaleString()}/mo</div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <div>{plan.rooms === -1 ? 'Unlimited rooms' : `Up to ${plan.rooms} rooms`}</div>
                <div>{plan.hotels === -1 ? 'Unlimited hotels' : `Up to ${plan.hotels} hotel${plan.hotels > 1 ? 's' : ''}`}</div>
              </div>

              <div className="space-y-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="text-green-400">✓</span> {f}
                  </div>
                ))}
              </div>

              {counts.total > counts.active && (
                <div className="text-xs text-yellow-500">{counts.total - counts.active} inactive / trial</div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600">
        Plan definitions are managed in Stripe. Changes to pricing require a Stripe product/price update.
        Contact engineering to add new plan tiers.
      </p>
    </div>
  );
}
