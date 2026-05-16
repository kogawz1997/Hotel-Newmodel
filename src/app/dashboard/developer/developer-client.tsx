'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Key, Webhook, Plus, Copy, Trash2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ApiKey = { id: string; name: string; key_prefix: string; scopes: string[]; created_at: string; last_used_at?: string; revoked_at?: string };
type WebhookLog = { id: string; event_type: string; url: string; status_code?: number; success: boolean; created_at: string };

const SCOPES = ['reservations:read', 'reservations:write', 'rooms:read', 'guests:read', 'payments:read', 'housekeeping:write'];
const TAB_LABELS = [{ key: 'keys', label: 'API Keys', icon: Key }, { key: 'logs', label: 'Webhook Logs', icon: Webhook }] as const;

export function DeveloperClient({ hotelId, apiKeys: initKeys, webhookLogs }: { hotelId: string; apiKeys: ApiKey[]; webhookLogs: WebhookLog[] }) {
  const supabase = createClient();
  const [tab, setTab] = useState<'keys' | 'logs'>('keys');
  const [keys, setKeys] = useState(initKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['reservations:read']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showKeyId, setShowKeyId] = useState<string | null>(null);

  async function createKey() {
    if (!newKeyName.trim()) { toast.error('กรอกชื่อ API Key'); return; }
    setSaving(true);
    const raw = `mk_live_${Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    const prefix = raw.slice(0, 12) + '...';
    const { data, error } = await supabase.from('api_keys').insert({
      hotel_id: hotelId, name: newKeyName, key_prefix: prefix, key_hash: raw,
      scopes: selectedScopes, active: true,
    }).select('id, name, key_prefix, scopes, created_at').single();
    setSaving(false);
    if (error) { toast.error('สร้างไม่สำเร็จ: ' + error.message); return; }
    setKeys(p => [data, ...p]);
    setGeneratedKey(raw);
    setNewKeyName(''); setSelectedScopes(['reservations:read']);
  }

  async function revokeKey(id: string) {
    if (!confirm('ยืนยันการยกเลิก API Key นี้?')) return;
    await supabase.from('api_keys').update({ revoked_at: new Date().toISOString(), active: false }).eq('id', id);
    setKeys(p => p.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
    toast.success('ยกเลิก API Key แล้ว');
  }

  function copyKey(val: string) {
    navigator.clipboard.writeText(val).then(() => toast.success('คัดลอกแล้ว'));
  }

  function toggleScope(scope: string) {
    setSelectedScopes(p => p.includes(scope) ? p.filter(s => s !== scope) : [...p, scope]);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border pb-1">
        {TAB_LABELS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-sm rounded-t-lg transition-colors', tab === t.key ? 'bg-background border-b-2 border-primary text-primary font-medium' : 'text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'keys' && (
        <>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-3.5 w-3.5" />สร้าง API Key</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {keys.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">ยังไม่มี API Key</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary/40">
                    {['ชื่อ', 'Prefix', 'Scopes', 'ใช้ล่าสุด', 'สถานะ', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {keys.map(k => (
                      <tr key={k.id} className={cn('border-b border-border/50 last:border-0', k.revoked_at ? 'opacity-50' : '')}>
                        <td className="px-4 py-3 font-medium">{k.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{k.key_prefix}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(k.scopes || []).slice(0, 2).map(s => <Badge key={s} className="bg-secondary text-muted-foreground border-0 text-2xs">{s}</Badge>)}
                            {(k.scopes || []).length > 2 && <Badge className="bg-secondary text-muted-foreground border-0 text-2xs">+{k.scopes.length - 2}</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('th-TH') : 'ยังไม่ใช้'}</td>
                        <td className="px-4 py-3">
                          <Badge className={k.revoked_at ? 'bg-red-100 text-red-700 border-0 text-2xs' : 'bg-emerald-100 text-emerald-700 border-0 text-2xs'}>
                            {k.revoked_at ? 'ยกเลิกแล้ว' : 'ใช้งานได้'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {!k.revoked_at && (
                            <button onClick={() => revokeKey(k.id)} aria-label="ยกเลิก API Key"
                              className="p-1 rounded hover:bg-destructive/10 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'logs' && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Webhook className="h-4 w-4" />Webhook Event Logs</CardTitle></CardHeader>
          <CardContent className="p-0">
            {webhookLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">ยังไม่มี Webhook Log</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-secondary/40">
                  {['Event', 'URL', 'Status', 'เวลา'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {webhookLogs.map(l => (
                    <tr key={l.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs">{l.event_type}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[200px]">{l.url}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {l.success ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                          <span className={cn('text-xs', l.success ? 'text-emerald-600' : 'text-red-600')}>{l.status_code || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={o => { if (!o) { setShowCreate(false); setGeneratedKey(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{generatedKey ? '🔑 API Key ใหม่ของคุณ' : 'สร้าง API Key'}</DialogTitle></DialogHeader>
          {generatedKey ? (
            <div className="space-y-3">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1.5">คัดลอกคีย์นี้ไว้เลย — จะไม่สามารถดูซ้ำได้</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono break-all">{generatedKey}</code>
                  <button onClick={() => copyKey(generatedKey)} aria-label="คัดลอก API Key" className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                    <Copy className="h-3.5 w-3.5 text-primary" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-amber-600">⚠ เก็บคีย์นี้ไว้ในที่ปลอดภัย ระบบจะไม่แสดงซ้ำอีก</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ชื่อ API Key *</label>
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="เช่น Mobile App, POS System"
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {SCOPES.map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="checkbox" checked={selectedScopes.includes(s)} onChange={() => toggleScope(s)} className="rounded" />
                      <span className="font-mono">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {generatedKey ? (
              <Button onClick={() => { setShowCreate(false); setGeneratedKey(null); }}>เสร็จแล้ว</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
                <Button onClick={createKey} disabled={saving}>{saving ? 'กำลังสร้าง...' : 'สร้าง API Key'}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
