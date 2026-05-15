'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Settings, AlertTriangle, Megaphone, CreditCard, Zap, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminLang } from '@/contexts/admin-lang-context';

type Tab = 'general' | 'plans' | 'features' | 'announcement' | 'content';

type SiteContent = {
  hero_headline_th: string;
  hero_headline_en: string;
  hero_subtitle: string;
  hero_cta: string;
  site_description: string;
  favicon_url: string;
  footer_tagline: string;
};

type Config = {
  app_name: string;
  support_email: string;
  logo_url: string;
  maintenance_mode: boolean;
  plan_prices: { starter: number; standard: number; pro: number; enterprise: number };
  features: Record<string, string[]>;
  announcement: { enabled: boolean; message: string; type: 'info' | 'warning' | 'success' };
  site_content: SiteContent;
};

const DEFAULT_SITE_CONTENT: SiteContent = {
  hero_headline_th: 'ระบบบริหารโรงแรมสำหรับยุคใหม่',
  hero_headline_en: 'Hotel Management for the Modern Era',
  hero_subtitle: 'AI-first property management for Thai hospitality',
  hero_cta: 'เริ่มต้นฟรี 60 วัน',
  site_description: 'AI-first property management for Thai hospitality. Multi-language inbox, channel manager, compliance — built for the way modern hotels work.',
  favicon_url: '',
  footer_tagline: 'Built for Thai hospitality',
};

const DEFAULTS: Config = {
  app_name: 'Maitri',
  support_email: 'support@maitri.app',
  logo_url: '',
  maintenance_mode: false,
  plan_prices: { starter: 1490, standard: 2990, pro: 5990, enterprise: 0 },
  features: {
    ai_concierge:       ['pro', 'enterprise'],
    loyalty_program:    ['standard', 'pro', 'enterprise'],
    channel_manager:    ['standard', 'pro', 'enterprise'],
    multi_property:     ['enterprise'],
    analytics_advanced: ['pro', 'enterprise'],
    fb_module:          ['pro', 'enterprise'],
    spa_module:         ['standard', 'pro', 'enterprise'],
    custom_branding:    ['pro', 'enterprise'],
  },
  announcement: { enabled: false, message: '', type: 'info' },
  site_content: DEFAULT_SITE_CONTENT,
};

const FEATURE_LABELS: Record<string, string> = {
  ai_concierge:       'AI Concierge',
  loyalty_program:    'Loyalty Program',
  channel_manager:    'Channel Manager',
  multi_property:     'Multi-Property',
  analytics_advanced: 'Advanced Analytics',
  fb_module:          'F&B Module',
  spa_module:         'Spa Module',
  custom_branding:    'Custom Branding',
};

const PLANS = ['starter', 'standard', 'pro', 'enterprise'] as const;

const ANNOUNCEMENT_TYPES = ['info', 'warning', 'success'] as const;
const ANNOUNCEMENT_COLORS = {
  info:    'bg-sky-500/15 border-sky-500/30 text-sky-200',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-200',
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
};

async function loadConfig(): Promise<Partial<Config>> {
  const res = await fetch('/api/admin/platform-config');
  if (!res.ok) return {};
  const data = await res.json();
  // data is a flat map: { general: {...}, plan_prices: {...}, features: {...}, announcement: {...}, site_content: {...} }
  const general = (typeof data.general === 'object' && data.general !== null) ? data.general as Record<string, unknown> : {};
  return {
    app_name:         general.app_name         as string  ?? undefined,
    support_email:    general.support_email    as string  ?? undefined,
    logo_url:         general.logo_url         as string  ?? undefined,
    maintenance_mode: general.maintenance_mode as boolean ?? undefined,
    plan_prices:      data.plan_prices  ?? undefined,
    features:         data.features     ?? undefined,
    announcement:     data.announcement ?? undefined,
    site_content:     data.site_content ?? undefined,
  };
}

async function saveKey(key: string, value: unknown) {
  await fetch('/api/admin/platform-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
}

export default function AdminSettingsPage() {
  const { t, lang } = useAdminLang();
  const [tab, setTab] = useState<Tab>('general');
  const [cfg, setCfg] = useState<Config>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadConfig().then(remote => {
      setCfg(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(remote).filter(([, v]) => v !== undefined)),
        site_content: { ...DEFAULT_SITE_CONTENT, ...(remote.site_content ?? {}) },
      }));
      setLoading(false);
    });
  }, []);

  async function save(section: string, data: unknown) {
    setSaving(section);
    try {
      await saveKey(section, data);
      toast.success(lang === 'th' ? 'บันทึกแล้ว' : 'Saved');
    } catch {
      toast.error(lang === 'th' ? 'บันทึกไม่สำเร็จ' : 'Save failed');
    } finally { setSaving(null); }
  }

  function toggleFeature(feature: string, plan: string) {
    setCfg(prev => {
      const current = prev.features[feature] ?? [];
      const next = current.includes(plan) ? current.filter(p => p !== plan) : [...current, plan];
      return { ...prev, features: { ...prev.features, [feature]: next } };
    });
  }

  const TABS: { key: Tab; icon: React.ComponentType<{className?: string}>; labelKey: string }[] = [
    { key: 'general',      icon: Settings,  labelKey: 'settings.tabs.general'      },
    { key: 'plans',        icon: CreditCard, labelKey: 'settings.tabs.plans'       },
    { key: 'features',     icon: Zap,        labelKey: 'settings.tabs.features'    },
    { key: 'announcement', icon: Megaphone,  labelKey: 'settings.tabs.announcement' },
    { key: 'content',      icon: Globe,      labelKey: 'settings.tabs.content'     },
  ];

  if (loading) return (
    <div className="p-4 md:p-8 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-4 md:p-8 text-white space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">{t('settings.title')}</h1>
        <p className="text-white/40 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Maintenance mode banner */}
      {cfg.maintenance_mode && (
        <div className="flex items-center gap-3 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300 font-medium">
            {lang === 'th' ? 'โหมดซ่อมบำรุงเปิดอยู่ — แขกจะไม่สามารถเข้าถึงเว็บได้' : 'Maintenance mode is ON — guests cannot access the site'}
          </p>
        </div>
      )}

      {/* Tab strip — scrollable on mobile */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/8 overflow-x-auto">
        {TABS.map(({ key, icon: Icon, labelKey }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center min-w-0',
              tab === key ? 'bg-[#C66A30] text-white shadow' : 'text-white/40 hover:text-white/70',
            )}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t(labelKey)}</span>
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {tab === 'general' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5 md:p-6 space-y-5">
          <AdminField label={t('settings.general.appName')} desc={t('settings.general.appNameDesc')}
            value={cfg.app_name} onChange={v => setCfg(p => ({ ...p, app_name: v }))} />
          <AdminField label={t('settings.general.supportEmail')} type="email"
            value={cfg.support_email} onChange={v => setCfg(p => ({ ...p, support_email: v }))} />
          <AdminField label={t('settings.general.logoUrl')} type="url" placeholder="https://..."
            value={cfg.logo_url} onChange={v => setCfg(p => ({ ...p, logo_url: v }))} />

          <AdminToggle
            label={t('settings.general.maintenanceMode')}
            desc={t('settings.general.maintenanceModeDesc')}
            value={cfg.maintenance_mode}
            onChange={v => setCfg(p => ({ ...p, maintenance_mode: v }))}
            danger
          />

          <SaveButton saving={saving === 'general'} label={t('settings.general.save')}
            onClick={() => save('general', {
              app_name: cfg.app_name,
              support_email: cfg.support_email,
              logo_url: cfg.logo_url,
              maintenance_mode: cfg.maintenance_mode,
            })} />
        </div>
      )}

      {/* ── Plans ── */}
      {tab === 'plans' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5 md:p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-white">{t('settings.plans.title')}</h2>
            <p className="text-sm text-white/40 mt-0.5">{t('settings.plans.desc')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {PLANS.map(plan => (
              <div key={plan}>
                <label className="text-xs font-medium text-white/50 mb-1.5 block capitalize">{plan}</label>
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-sm">฿</span>
                  <input
                    type="number" min={0} step={10}
                    value={cfg.plan_prices[plan]}
                    onChange={e => setCfg(p => ({
                      ...p, plan_prices: { ...p.plan_prices, [plan]: Number(e.target.value) },
                    }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#C66A30]/50"
                  />
                  <span className="text-white/30 text-xs">/mo</span>
                </div>
              </div>
            ))}
          </div>
          <SaveButton saving={saving === 'plan_prices'} label={t('common.save')}
            onClick={() => save('plan_prices', cfg.plan_prices)} />
        </div>
      )}

      {/* ── Features ── */}
      {tab === 'features' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5 md:p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-white">{t('settings.features.title')}</h2>
            <p className="text-sm text-white/40 mt-0.5">{t('settings.features.desc')}</p>
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 text-white/30 font-medium text-xs w-40">Feature</th>
                  {PLANS.map(plan => (
                    <th key={plan} className="text-center py-2 px-2 text-white/30 font-medium text-xs capitalize">{plan}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <tr key={key} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 text-white/70 text-xs">{label}</td>
                    {PLANS.map(plan => {
                      const enabled = (cfg.features[key] ?? []).includes(plan);
                      return (
                        <td key={plan} className="text-center py-3 px-2">
                          <button onClick={() => toggleFeature(key, plan)}
                            className={cn(
                              'h-6 w-6 rounded-lg border-2 mx-auto flex items-center justify-center transition-all',
                              enabled ? 'bg-[#C66A30] border-[#C66A30]' : 'border-white/15 hover:border-white/30',
                            )}>
                            {enabled && <span className="text-white text-xs font-bold">&#10003;</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SaveButton saving={saving === 'features'} label={t('common.save')}
            onClick={() => save('features', cfg.features)} />
        </div>
      )}

      {/* ── Announcement ── */}
      {tab === 'announcement' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5 md:p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-white">{t('settings.announcement.title')}</h2>
            <p className="text-sm text-white/40 mt-0.5">{t('settings.announcement.desc')}</p>
          </div>

          <AdminToggle
            label={t('settings.announcement.enabled')}
            value={cfg.announcement.enabled}
            onChange={v => setCfg(p => ({ ...p, announcement: { ...p.announcement, enabled: v } }))}
          />

          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block">Type</label>
            <div className="flex gap-2">
              {ANNOUNCEMENT_TYPES.map(type => (
                <button key={type} onClick={() => setCfg(p => ({ ...p, announcement: { ...p.announcement, type } }))}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border',
                    cfg.announcement.type === type ? 'bg-[#C66A30] border-[#C66A30] text-white' : 'border-white/10 text-white/40 hover:text-white/70',
                  )}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block">{t('settings.announcement.message')}</label>
            <textarea
              rows={3}
              placeholder={t('settings.announcement.messagePlaceholder')}
              value={cfg.announcement.message}
              onChange={e => setCfg(p => ({ ...p, announcement: { ...p.announcement, message: e.target.value } }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#C66A30]/50 resize-none"
            />
          </div>

          {cfg.announcement.enabled && cfg.announcement.message && (
            <div>
              <p className="text-xs font-medium text-white/40 mb-2">{t('settings.announcement.preview')}</p>
              <div className={cn('px-4 py-3 rounded-xl border text-sm font-medium', ANNOUNCEMENT_COLORS[cfg.announcement.type])}>
                {cfg.announcement.message}
              </div>
            </div>
          )}

          <SaveButton saving={saving === 'announcement'} label={t('settings.announcement.save')}
            onClick={() => save('announcement', cfg.announcement)} />
        </div>
      )}

      {/* ── Content ── */}
      {tab === 'content' && (
        <div className="space-y-4">
          {/* Favicon & Identity */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5 md:p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-white">{t('settings.content.title')}</h2>
              <p className="text-sm text-white/40 mt-0.5">{t('settings.content.desc')}</p>
            </div>

            <AdminField
              label={t('settings.content.faviconUrl')}
              desc={t('settings.content.faviconDesc')}
              type="url"
              placeholder="https://example.com/icon.png"
              value={cfg.site_content.favicon_url}
              onChange={v => setCfg(p => ({ ...p, site_content: { ...p.site_content, favicon_url: v } }))}
            />

            {cfg.site_content.favicon_url && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <img
                  src={cfg.site_content.favicon_url}
                  alt="Favicon preview"
                  className="h-8 w-8 rounded object-contain bg-white/10"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <p className="text-xs text-white/40">
                  {lang === 'th' ? 'ตัวอย่างไอคอนเว็บ' : 'Favicon preview'}
                </p>
              </div>
            )}

            <AdminField
              label={t('settings.content.footerTagline')}
              placeholder="Built for Thai hospitality"
              value={cfg.site_content.footer_tagline}
              onChange={v => setCfg(p => ({ ...p, site_content: { ...p.site_content, footer_tagline: v } }))}
            />
          </div>

          {/* Hero section */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5 md:p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-white">
                {lang === 'th' ? 'ส่วนหัวหน้าแรก (Hero)' : 'Homepage Hero Section'}
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                {lang === 'th' ? 'ข้อความขนาดใหญ่ที่แสดงบนหน้าแรก' : 'Large text displayed at the top of the homepage'}
              </p>
            </div>

            <AdminField
              label={t('settings.content.heroHeadlineTh')}
              value={cfg.site_content.hero_headline_th}
              onChange={v => setCfg(p => ({ ...p, site_content: { ...p.site_content, hero_headline_th: v } }))}
            />
            <AdminField
              label={t('settings.content.heroHeadlineEn')}
              value={cfg.site_content.hero_headline_en}
              onChange={v => setCfg(p => ({ ...p, site_content: { ...p.site_content, hero_headline_en: v } }))}
            />
            <AdminField
              label={t('settings.content.heroSubtitle')}
              value={cfg.site_content.hero_subtitle}
              onChange={v => setCfg(p => ({ ...p, site_content: { ...p.site_content, hero_subtitle: v } }))}
            />
            <AdminField
              label={t('settings.content.heroCta')}
              placeholder="เริ่มต้นฟรี 60 วัน"
              value={cfg.site_content.hero_cta}
              onChange={v => setCfg(p => ({ ...p, site_content: { ...p.site_content, hero_cta: v } }))}
            />
          </div>

          {/* SEO */}
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5 md:p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-white">SEO</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {lang === 'th' ? 'ข้อมูลที่แสดงใน Google และ social media' : 'Information shown in Google and social media previews'}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">{t('settings.content.siteDescription')}</label>
              <p className="text-xs text-white/30 mb-1.5">{t('settings.content.siteDescriptionDesc')}</p>
              <textarea
                rows={3}
                value={cfg.site_content.site_description}
                onChange={e => setCfg(p => ({ ...p, site_content: { ...p.site_content, site_description: e.target.value } }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#C66A30]/50 resize-none"
              />
              <p className="text-right text-2xs text-white/25 mt-1">
                {cfg.site_content.site_description.length}/160
              </p>
            </div>
          </div>

          <SaveButton saving={saving === 'site_content'} label={t('settings.content.save')}
            onClick={() => save('site_content', cfg.site_content)} />
        </div>
      )}
    </div>
  );
}

function AdminField({ label, desc, value, onChange, type = 'text', placeholder }: {
  label: string; desc?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-white/60 mb-1.5 block">{label}</label>
      {desc && <p className="text-xs text-white/30 mb-1.5">{desc}</p>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-[#C66A30]/50" />
    </div>
  );
}

function AdminToggle({ label, desc, value, onChange, danger }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-3 rounded-xl', danger && value ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/3')}>
      <div>
        <p className={cn('text-sm font-medium', danger && value ? 'text-red-300' : 'text-white/80')}>{label}</p>
        {desc && <p className="text-xs text-white/30 mt-0.5">{desc}</p>}
      </div>
      <div onClick={() => onChange(!value)}
        className={cn('relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0', value ? (danger ? 'bg-red-500' : 'bg-[#C66A30]') : 'bg-white/15')}>
        <div className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform', value ? 'left-6' : 'left-1')} />
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving, label }: { onClick: () => void; saving: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
      <Save className="h-4 w-4" />{saving ? '...' : label}
    </button>
  );
}
