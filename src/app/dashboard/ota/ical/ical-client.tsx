'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, RefreshCw, Trash2, Copy, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Feed = { id: string; name: string; url: string; direction: 'import' | 'export'; last_synced_at?: string; status: string; error_message?: string };

const PLATFORMS = [
  { name: 'Airbnb', url_hint: 'airbnb.com/calendar', color: 'bg-rose-100 text-rose-700' },
  { name: 'VRBO / HomeAway', url_hint: 'vrbo.com', color: 'bg-sky-100 text-sky-700' },
  { name: 'Booking.com', url_hint: 'booking.com', color: 'bg-blue-100 text-blue-700' },
  { name: 'Google Calendar', url_hint: 'google.com/calendar', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Other', url_hint: '', color: 'bg-secondary text-muted-foreground' },
];

export function ICalClient({ hotelId, feeds: initFeeds, exportUrl }: { hotelId: string; feeds: Feed[]; exportUrl: string }) {
  const supabase = createClient();
  const [feeds, setFeeds] = useState(initFeeds);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', direction: 'import' as 'import' | 'export' });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function addFeed() {
    if (!form.name || !form.url) { toast.error('กรอกชื่อและ URL'); return; }
    try { new URL(form.url); } catch { toast.error('URL ไม่ถูกต้อง'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('ical_feeds').insert({
      hotel_id: hotelId, name: form.name, url: form.url,
      direction: form.direction, status: 'active',
    }).select().single();
    setSaving(false);
    if (error) { toast.error('เพิ่มไม่สำเร็จ: ' + error.message); return; }
    setFeeds(p => [data, ...p]);
    setShowAdd(false); setForm({ name: '', url: '', direction: 'import' });
    toast.success('เพิ่ม iCal feed แล้ว');
  }

  async function syncFeed(id: string) {
    setSyncing(id);
    const res = await fetch('/api/ical/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedId: id }),
    });
    setSyncing(null);
    if (!res.ok) { toast.error('Sync ไม่สำเร็จ'); return; }
    setFeeds(p => p.map(f => f.id === id ? { ...f, last_synced_at: new Date().toISOString(), status: 'active' } : f));
    toast.success('Sync เสร็จแล้ว');
  }

  async function deleteFeed(id: string) {
    await supabase.from('ical_feeds').delete().eq('id', id);
    setFeeds(p => p.filter(f => f.id !== id));
    toast.success('ลบ feed แล้ว');
  }

  function copyExport() {
    navigator.clipboard.writeText(exportUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="space-y-4">
      {/* Export URL */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Export URL (ส่งออกปฏิทินของคุณ)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">คัดลอก URL นี้ไปใส่ใน Airbnb / VRBO เพื่อ sync วันที่จอง</p>
          <div className="flex items-center gap-2 rounded-xl bg-secondary p-3">
            <code className="flex-1 text-xs font-mono break-all text-muted-foreground">{exportUrl}</code>
            <button onClick={copyExport} aria-label="คัดลอก URL"
              className={cn('p-1.5 rounded-lg transition-colors', copied ? 'bg-emerald-100 text-emerald-700' : 'bg-background hover:bg-secondary/80')}>
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <a href={exportUrl} target="_blank" rel="noopener noreferrer" aria-label="เปิด URL"
              className="p-1.5 rounded-lg bg-background hover:bg-secondary/80 transition-colors">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Import feeds */}
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Import Feeds ({feeds.length})</h2>
        <Button size="sm" onClick={() => setShowAdd(p => !p)}><Plus className="h-3.5 w-3.5" />เพิ่ม Feed</Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ชื่อ Platform</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PLATFORMS.map(p => (
                  <button key={p.name} onClick={() => setForm(prev => ({ ...prev, name: p.name }))}
                    className={cn('px-2.5 py-1 text-xs rounded-full transition-colors', form.name === p.name ? p.color + ' font-medium' : 'bg-secondary text-muted-foreground')}>
                    {p.name}
                  </button>
                ))}
              </div>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="หรือกรอกชื่อเอง"
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">iCal URL *</label>
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                placeholder="https://www.airbnb.com/calendar/ical/..."
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
              <Button size="sm" onClick={addFeed} disabled={saving}>{saving ? 'กำลังเพิ่ม...' : 'เพิ่ม Feed'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {feeds.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
          ยังไม่มี iCal Feed — เพิ่ม URL จาก Airbnb หรือ VRBO
        </div>
      ) : (
        <div className="space-y-2">
          {feeds.map(f => (
            <Card key={f.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{f.name}</p>
                    <Badge className={`border-0 text-2xs ${f.direction === 'import' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                      {f.direction === 'import' ? 'Import' : 'Export'}
                    </Badge>
                    {f.status === 'error' && (
                      <Badge className="border-0 text-2xs bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertCircle className="h-2.5 w-2.5" />Error
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{f.url}</p>
                  {f.last_synced_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sync ล่าสุด: {new Date(f.last_synced_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  )}
                  {f.error_message && <p className="text-xs text-red-600 mt-0.5">{f.error_message}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => syncFeed(f.id)} disabled={syncing === f.id}
                    aria-label="Sync"
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50">
                    <RefreshCw className={cn('h-4 w-4', syncing === f.id && 'animate-spin')} />
                  </button>
                  <button onClick={() => deleteFeed(f.id)} aria-label="ลบ"
                    className="p-1.5 rounded-lg hover:bg-secondary text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
