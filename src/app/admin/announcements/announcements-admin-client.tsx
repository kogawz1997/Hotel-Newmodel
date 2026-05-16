'use client';

import { useState } from 'react';
import { Megaphone, Send, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { key: 'in_app', label: 'In-App Notification' },
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Push Notification' },
];
const TARGET_OPTIONS = [
  { key: 'all', label: 'ทุกคน' },
  { key: 'trial', label: 'Trial Users เท่านั้น' },
  { key: 'paid', label: 'Paid Users เท่านั้น' },
  { key: 'starter', label: 'Starter Plan' },
  { key: 'standard', label: 'Standard Plan' },
  { key: 'pro', label: 'Pro Plan' },
];

export function AnnouncementsAdminClient({ announcements, orgs }: { announcements: any[]; orgs: any[] }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<string[]>(['in_app']);
  const [target, setTarget] = useState('all');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function toggleChannel(key: string) {
    setChannels(p => p.includes(key) ? p.filter(c => c !== key) : [...p, key]);
  }

  const targetOrgs = orgs.filter(o => {
    if (target === 'all') return true;
    if (target === 'trial') return o.subscription_status === 'trialing';
    if (target === 'paid') return ['active', 'past_due'].includes(o.subscription_status);
    return o.subscription_plan === target;
  });

  async function send() {
    if (!title.trim() || !message.trim()) { toast.error('กรอกหัวข้อและข้อความ'); return; }
    if (!channels.length) { toast.error('เลือก channel อย่างน้อย 1'); return; }
    setSending(true);
    const res = await fetch('/api/admin/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, channels, target, orgIds: targetOrgs.map(o => o.id) }),
    });
    setSending(false);
    if (!res.ok) { toast.error('ส่งไม่สำเร็จ'); return; }
    setSent(true);
    toast.success(`ส่งประกาศถึง ${targetOrgs.length} องค์กรแล้ว`);
    setTitle(''); setMessage('');
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="font-semibold flex items-center gap-2"><Megaphone className="h-4 w-4" />สร้างประกาศ</h2>
        <div>
          <label className="text-xs text-white/50 block mb-1">หัวข้อ *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-white/8 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">ข้อความ *</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            className="w-full px-3 py-2 bg-white/8 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-white/20" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-2">Channel</label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(c => (
              <button key={c.key} onClick={() => toggleChannel(c.key)}
                className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', channels.includes(c.key) ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20')}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-2">ส่งถึง</label>
          <div className="flex flex-wrap gap-2">
            {TARGET_OPTIONS.map(t => (
              <button key={t.key} onClick={() => setTarget(t.key)}
                className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors', target === t.key ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20')}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-xs text-white/50 flex items-center gap-1"><Users className="h-3.5 w-3.5" />{targetOrgs.length} องค์กร</span>
          <button onClick={send} disabled={sending || sent}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors', sent ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50')}>
            {sent ? <><CheckCircle className="h-4 w-4" />ส่งแล้ว!</> : sending ? 'กำลังส่ง...' : <><Send className="h-4 w-4" />ส่งประกาศ</>}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2 text-sm"><Megaphone className="h-4 w-4" />ประกาศล่าสุด</h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-white/40">ยังไม่มีประกาศ</p>
        ) : (
          announcements.slice(0, 10).map(a => (
            <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-white/50 mt-0.5">{a.message}</p>
              <p className="text-2xs text-white/30 mt-1">{new Date(a.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
