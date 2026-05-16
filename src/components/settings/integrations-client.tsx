'use client';

import { useState } from 'react';
import {
  MessageCircle, Globe2, BarChart3, Bell, Mail, Calculator,
  Check, ChevronDown, ChevronUp, Loader2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationState {
  enabled: boolean;
  configured: boolean;
  maskedConfig: Record<string, string>;
  lastSyncAt: string | null;
  syncStatus: string;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
  secret?: boolean;
}

interface IntegrationDef {
  provider: string;
  name: string;
  description: string;
  docsUrl?: string;
  fields: FieldDef[];
  envKeys?: string[];
}

const INTEGRATIONS: { group: string; icon: React.ElementType; color: string; items: IntegrationDef[] }[] = [
  {
    group: 'Messaging',
    icon: MessageCircle,
    color: 'text-green-600',
    items: [
      {
        provider: 'line',
        name: 'LINE',
        description: 'ส่ง confirmation และรับ message จาก LINE OA',
        fields: [
          { key: 'channel_access_token', label: 'Channel Access Token', secret: true, hint: 'จาก LINE Developers → Messaging API' },
          { key: 'channel_secret', label: 'Channel Secret', secret: true },
          { key: 'channel_id', label: 'Channel ID', placeholder: '1234567890' },
        ],
        envKeys: ['LINE_CHANNEL_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET'],
      },
      {
        provider: 'whatsapp',
        name: 'WhatsApp Business',
        description: 'ส่ง booking confirmation และรับ message จาก WhatsApp',
        fields: [
          { key: 'access_token', label: 'Access Token', secret: true, hint: 'จาก Meta for Developers → WhatsApp' },
          { key: 'phone_number_id', label: 'Phone Number ID', placeholder: '123456789012345' },
          { key: 'verify_token', label: 'Webhook Verify Token', secret: true, hint: 'สร้างเองได้ ใช้ยืนยัน webhook' },
          { key: 'app_secret', label: 'App Secret', secret: true },
        ],
        envKeys: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_VERIFY_TOKEN'],
      },
      {
        provider: 'facebook',
        name: 'Facebook / Instagram DM',
        description: 'รับ message จาก Facebook Page และ Instagram DM',
        fields: [
          { key: 'page_access_token', label: 'Page Access Token', secret: true, hint: 'จาก Meta Business Suite → Graph API' },
          { key: 'app_secret', label: 'App Secret', secret: true },
          { key: 'page_id', label: 'Page ID', placeholder: '123456789' },
          { key: 'verify_token', label: 'Webhook Verify Token', secret: true },
        ],
        envKeys: ['FACEBOOK_PAGE_ACCESS_TOKEN'],
      },
      {
        provider: 'wechat',
        name: 'WeChat',
        description: 'ส่งข้อความผ่าน WeChat Official Account',
        fields: [
          { key: 'app_id', label: 'App ID', placeholder: 'wx1234567890abcdef' },
          { key: 'app_secret', label: 'App Secret', secret: true },
        ],
        envKeys: ['WECHAT_APP_ID', 'WECHAT_APP_SECRET'],
      },
    ],
  },
  {
    group: 'OTA / Channel Manager',
    icon: Globe2,
    color: 'text-blue-600',
    items: [
      {
        provider: 'booking_com',
        name: 'Booking.com',
        description: 'ซิงค์ห้องว่างและรับ reservation จาก Booking.com',
        fields: [
          { key: 'api_token', label: 'API Token', secret: true, hint: 'จาก Booking.com Extranet → Settings → Connectivity' },
          { key: 'property_id', label: 'Property ID', placeholder: '12345678' },
        ],
        envKeys: ['BOOKING_COM_API_TOKEN'],
      },
      {
        provider: 'agoda',
        name: 'Agoda',
        description: 'ซิงค์ห้องว่างและรับ reservation จาก Agoda',
        fields: [
          { key: 'api_key', label: 'API Key', secret: true },
          { key: 'hotel_id', label: 'Hotel ID', placeholder: '1234567' },
        ],
        envKeys: ['AGODA_API_TOKEN'],
      },
      {
        provider: 'airbnb',
        name: 'Airbnb',
        description: 'ซิงค์ iCal / API จาก Airbnb',
        fields: [
          { key: 'client_id', label: 'Client ID', placeholder: 'abcdef1234567890' },
          { key: 'client_secret', label: 'Client Secret', secret: true },
          { key: 'listing_id', label: 'Listing ID', placeholder: '1234567890' },
        ],
        envKeys: ['AIRBNB_API_TOKEN'],
      },
      {
        provider: 'expedia',
        name: 'Expedia / Hotels.com',
        description: 'ซิงค์กับ Expedia Group (Expedia, Hotels.com, Vrbo)',
        fields: [
          { key: 'api_key', label: 'API Key', secret: true },
          { key: 'property_id', label: 'Property ID', placeholder: '12345' },
        ],
        envKeys: ['EXPEDIA_API_TOKEN'],
      },
      {
        provider: 'hotelrunner',
        name: 'HotelRunner',
        description: 'Channel manager ผ่าน HotelRunner API v2',
        fields: [
          { key: 'api_token', label: 'API Token', secret: true },
          { key: 'hotel_id', label: 'Hotel ID', placeholder: 'hr-12345' },
        ],
        envKeys: ['HOTELRUNNER_API_TOKEN'],
      },
    ],
  },
  {
    group: 'Analytics & Monitoring',
    icon: BarChart3,
    color: 'text-purple-600',
    items: [
      {
        provider: 'sentry',
        name: 'Sentry',
        description: 'Error tracking และ performance monitoring',
        fields: [
          { key: 'dsn', label: 'Server DSN', secret: true, hint: 'จาก Sentry → Project Settings → Client Keys' },
          { key: 'public_dsn', label: 'Public DSN (NEXT_PUBLIC)', secret: true },
        ],
        envKeys: ['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN'],
      },
      {
        provider: 'google_analytics',
        name: 'Google Analytics 4',
        description: 'ติดตาม traffic บน booking engine',
        fields: [
          { key: 'measurement_id', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' },
        ],
      },
    ],
  },
  {
    group: 'Push Notifications',
    icon: Bell,
    color: 'text-amber-600',
    items: [
      {
        provider: 'vapid',
        name: 'Web Push (VAPID)',
        description: 'แจ้งเตือน browser ให้ลูกค้าและพนักงาน',
        fields: [
          { key: 'public_key', label: 'VAPID Public Key', placeholder: 'BNiL...' },
          { key: 'private_key', label: 'VAPID Private Key', secret: true },
          { key: 'subject', label: 'Subject (mailto: หรือ URL)', placeholder: 'mailto:admin@hotel.com' },
        ],
        envKeys: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'],
      },
    ],
  },
  {
    group: 'Email',
    icon: Mail,
    color: 'text-sky-600',
    items: [
      {
        provider: 'sendgrid',
        name: 'SendGrid',
        description: 'ส่ง confirmation, invoice, marketing email',
        fields: [
          { key: 'api_key', label: 'API Key', secret: true, hint: 'จาก SendGrid → Settings → API Keys' },
          { key: 'from_email', label: 'From Email', placeholder: 'noreply@hotel.com' },
          { key: 'from_name', label: 'From Name', placeholder: 'Hotel Name' },
        ],
        envKeys: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
      },
    ],
  },
  {
    group: 'Accounting',
    icon: Calculator,
    color: 'text-rose-600',
    items: [
      {
        provider: 'flowaccount',
        name: 'FlowAccount',
        description: 'ส่ง invoice และ sync รายรับเข้า FlowAccount',
        fields: [
          { key: 'api_key', label: 'API Key', secret: true, hint: 'จาก FlowAccount → Settings → API' },
          { key: 'client_id', label: 'Client ID', placeholder: 'fa_client_...' },
        ],
        envKeys: ['FLOWACCOUNT_API_KEY'],
      },
      {
        provider: 'peak',
        name: 'PEAK Account',
        description: 'Sync รายรับกับ PEAK ระบบบัญชีไทย',
        fields: [
          { key: 'api_key', label: 'API Key', secret: true },
          { key: 'company_id', label: 'Company ID', placeholder: '12345' },
        ],
        envKeys: ['PEAK_API_KEY'],
      },
    ],
  },
];

interface Props {
  initialIntegrations: Record<string, IntegrationState>;
}

function SecretField({ field, value, onChange }: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={value ? '(กรอกใหม่เพื่อเปลี่ยน)' : field.placeholder || ''}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function IntegrationCard({
  def,
  state,
  onSave,
}: {
  def: IntegrationDef;
  state: IntegrationState | undefined;
  onSave: (provider: string, enabled: boolean, config: Record<string, string>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(state?.enabled ?? false);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of def.fields) {
      init[f.key] = state?.maskedConfig?.[f.key] || '';
    }
    return init;
  });
  const [saving, setSaving] = useState(false);

  const configured = state?.configured ?? false;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(def.provider, enabled, fields);
      toast.success(`${def.name} บันทึกแล้ว`);
    } catch {
      toast.error('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-xl border ${open ? 'border-sky-300 bg-sky-50/30' : 'border-slate-200 bg-white'} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{def.name}</span>
            {configured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <Check className="h-2.5 w-2.5" /> ตั้งค่าแล้ว
              </span>
            )}
            {state?.enabled && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                เปิด
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{def.description}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-200 px-4 pb-4 pt-3 space-y-3">
          {def.envKeys && def.envKeys.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-700">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                ถ้าตั้ง env var <code className="font-mono">{def.envKeys.join(', ')}</code> ไว้แล้ว จะใช้ค่าจาก env ก่อน (override DB)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">เปิดใช้งาน</span>
            <button
              onClick={() => setEnabled(e => !e)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-sky-500' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${enabled ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="space-y-3">
            {def.fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                {f.secret ? (
                  <SecretField field={f} value={fields[f.key] || ''} onChange={v => setFields(p => ({ ...p, [f.key]: v }))} />
                ) : (
                  <input
                    type="text"
                    value={fields[f.key] || ''}
                    onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder || ''}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                )}
                {f.hint && <p className="mt-1 text-[11px] text-slate-400">{f.hint}</p>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            {state?.lastSyncAt && (
              <span className="text-xs text-slate-400">
                sync ล่าสุด {new Date(state.lastSyncAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-sky-700 flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              บันทึก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrationsClient({ initialIntegrations }: Props) {
  const [integrations, setIntegrations] = useState<Record<string, IntegrationState>>(initialIntegrations);

  async function handleSave(provider: string, enabled: boolean, config: Record<string, string>) {
    const res = await fetch('/api/settings/integrations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, enabled, config }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'Failed to save');
    }
    setIntegrations(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        enabled,
        configured: Object.values(config).some(v => v && !v.includes('••')),
      },
    }));
  }

  return (
    <div className="space-y-8">
      {INTEGRATIONS.map(group => {
        const Icon = group.icon;
        return (
          <section key={group.group}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`h-5 w-5 ${group.color}`} />
              <h2 className="font-semibold text-slate-800">{group.group}</h2>
            </div>
            <div className="space-y-2">
              {group.items.map(def => (
                <IntegrationCard
                  key={def.provider}
                  def={def}
                  state={integrations[def.provider]}
                  onSave={handleSave}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
