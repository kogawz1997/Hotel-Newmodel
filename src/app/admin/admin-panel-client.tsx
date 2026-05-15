'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Building2, TrendingUp, Activity, Search, ToggleLeft, ToggleRight, Eye, LogIn, Users, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th as thLocale, enUS } from 'date-fns/locale';
import { useAdminLang } from '@/contexts/admin-lang-context';

const PLAN_COLOR: Record<string, string> = {
  starter:    'bg-zinc-800 text-zinc-300',
  standard:   'bg-sky-950 text-sky-300',
  pro:        'bg-violet-950 text-violet-300',
  enterprise: 'bg-amber-950 text-amber-300',
};

const STATUS_DOT: Record<string, string> = {
  active:   'bg-emerald-400',
  trialing: 'bg-sky-400',
  past_due: 'bg-red-400',
  cancelled:'bg-zinc-500',
};
const STATUS_TEXT: Record<string, string> = {
  active:   'text-emerald-400',
  trialing: 'text-sky-400',
  past_due: 'text-red-400',
  cancelled:'text-zinc-500',
};

export function AdminPanelClient({ orgs, stats }: { orgs: any[]; stats: any }) {
  const { lang, t } = useAdminLang();
  const [q, setQ]       = useState('');
  const [filter, setFilter] = useState('all');

  const locale = lang === 'th' ? thLocale : enUS;

  const filtered = orgs.filter(o => {
    const matchQ = !q || o.name?.toLowerCase().includes(q.toLowerCase());
    const matchF = filter === 'all' || o.subscription_plan === filter || o.subscription_status === filter;
    return matchQ && matchF;
  });

  async function startImpersonation(orgId: string) {
    const reason = window.prompt(t('orgs.impersonateReason')) || 'support';
    const res = await fetch(`/api/admin/orgs/${orgId}/impersonate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.redirectTo) {
      toast.success(lang === 'th' ? 'เริ่ม support session แล้ว' : 'Support session started');
      window.location.href = data.redirectTo;
    } else toast.error(data.error || (lang === 'th' ? 'ไม่สำเร็จ' : 'Failed'));
  }

  async function toggleOrg(orgId: string, isSuspended: boolean) {
    const res = await fetch('/api/admin/orgs', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, action: isSuspended ? 'reactivate' : 'suspend' }),
    });
    if (res.ok) toast.success(isSuspended ? t('orgs.reactivate') : t('orgs.suspend'));
    else toast.error(lang === 'th' ? 'ดำเนินการไม่สำเร็จ' : 'Operation failed');
  }

  const FILTERS = ['all', 'starter', 'standard', 'pro', 'enterprise', 'active', 'trialing', 'past_due', 'cancelled'];

  return (
    <div className="p-4 md:p-8 text-white space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{t('nav.dashboard')}</h1>
          <p className="text-white/50 text-sm mt-1">{lang === 'th' ? 'ภาพรวม platform และ tenants' : 'Platform overview and tenants'}</p>
        </div>
        <Link href="/admin/settings"
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/8 hover:bg-white/12 text-white/70 hover:text-white rounded-xl text-sm transition-colors">
          {t('nav.appSettings')} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Building2, labelKey: 'kpi.organizations', value: stats.totalOrgs,          color: 'text-sky-400',    bg: 'bg-sky-400/10' },
          { icon: Users,     labelKey: 'kpi.hotels',        value: stats.totalHotels,         color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { icon: TrendingUp,labelKey: 'kpi.mrr',           value: formatCurrency(stats.mrr), color: 'text-violet-400', bg: 'bg-violet-400/10' },
          { icon: Activity,  labelKey: 'kpi.newThisMonth',  value: stats.newThisMonth,        color: 'text-amber-400',  bg: 'bg-amber-400/10' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.labelKey} className="bg-white/5 border border-white/8 rounded-2xl p-4 hover:bg-white/8 transition-colors">
              <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-4.5 w-4.5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{t(s.labelKey)}</div>
            </div>
          );
        })}
      </div>

      {/* Organizations */}
      <div>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-base font-semibold text-white">{t('orgs.title')}</h2>
          <div className="relative min-w-0 w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('orgs.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#C66A30]/50" />
          </div>
        </div>

        {/* Filter pills — horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                filter === f ? 'bg-[#C66A30] text-white' : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/8',
              )}>
              {f}
            </button>
          ))}
        </div>

        {/* Table — card layout on mobile, table on desktop */}
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['orgs.columns.name', 'orgs.columns.plan', 'orgs.columns.status', 'orgs.columns.hotels', 'orgs.columns.joined', 'orgs.columns.actions'].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{t(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((org, i) => {
                  const isSuspended = org.subscription_status === 'cancelled';
                  const hotelCount  = org.hotels?.[0]?.count || 0;
                  const statusKey   = org.subscription_status || 'active';
                  return (
                    <tr key={org.id} className={cn('border-b border-white/5 hover:bg-white/5 transition-colors', i === filtered.length - 1 && 'border-0')}>
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">{org.name || 'Unnamed'}</div>
                        <div className="text-xs text-white/30 font-mono mt-0.5">{org.id.slice(0, 8)}…</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('text-xs px-2 py-1 rounded-lg font-medium capitalize', PLAN_COLOR[org.subscription_plan] || PLAN_COLOR.starter)}>
                          {org.subscription_plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[statusKey] || 'bg-zinc-500')} />
                          <span className={cn('text-xs font-medium capitalize', STATUS_TEXT[statusKey] || 'text-zinc-400')}>
                            {statusKey.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-white/50">{hotelCount}</td>
                      <td className="px-5 py-4 text-white/40 text-xs">
                        {org.created_at ? format(parseISO(org.created_at), 'd MMM yy', { locale }) : '-'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleOrg(org.id, isSuspended)} title={isSuspended ? t('orgs.reactivate') : t('orgs.suspend')}>
                            {isSuspended
                              ? <ToggleLeft className="h-5 w-5 text-white/30 hover:text-emerald-400 transition-colors" />
                              : <ToggleRight className="h-5 w-5 text-emerald-400 hover:text-red-400 transition-colors" />}
                          </button>
                          <button onClick={() => startImpersonation(org.id)} title={t('orgs.impersonate')}
                            className="p-1 text-white/30 hover:text-sky-400 transition-colors">
                            <LogIn className="h-4 w-4" />
                          </button>
                          <Link href={`/admin/orgs/${org.id}`} title={t('orgs.viewDetail')}
                            className="p-1 text-white/30 hover:text-white transition-colors">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-white/30 text-sm">{t('orgs.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/5">
            {filtered.map(org => {
              const isSuspended = org.subscription_status === 'cancelled';
              const hotelCount  = org.hotels?.[0]?.count || 0;
              const statusKey   = org.subscription_status || 'active';
              return (
                <div key={org.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-white text-sm">{org.name || 'Unnamed'}</p>
                      <p className="text-xs text-white/30 font-mono mt-0.5">{org.id.slice(0, 12)}…</p>
                    </div>
                    <span className={cn('text-xs px-2 py-1 rounded-lg font-medium capitalize shrink-0', PLAN_COLOR[org.subscription_plan] || PLAN_COLOR.starter)}>
                      {org.subscription_plan}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
                    <div className="flex items-center gap-1">
                      <div className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[statusKey])} />
                      <span className={STATUS_TEXT[statusKey]}>{statusKey.replace('_', ' ')}</span>
                    </div>
                    <span>🏨 {hotelCount}</span>
                    <span>{org.created_at ? format(parseISO(org.created_at), 'd MMM yy', { locale }) : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleOrg(org.id, isSuspended)}
                      className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-colors border',
                        isSuspended ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-red-500/30 text-red-400 hover:bg-red-500/10')}>
                      {isSuspended ? t('orgs.reactivate') : t('orgs.suspend')}
                    </button>
                    <button onClick={() => startImpersonation(org.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium border border-white/10 text-white/50 hover:text-sky-400 hover:border-sky-400/30 transition-colors">
                      {t('orgs.impersonate')}
                    </button>
                    <Link href={`/admin/orgs/${org.id}`}
                      className="px-3 py-2 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-white/30 text-sm">{t('orgs.noResults')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
