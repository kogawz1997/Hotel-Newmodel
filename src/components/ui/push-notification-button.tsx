'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function PushNotificationButton({ className }: { className?: string }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
      );
    }
  }, []);

  if (!supported) return null;

  async function toggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setSubscribed(false);
        toast.success('ปิดการแจ้งเตือนแล้ว');
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { toast.error('กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์'); return; }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : undefined,
        } as any);
        const subJson = sub.toJSON() as any;
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: { endpoint: subJson.endpoint, keys: { auth: subJson.keys.auth, p256dh: subJson.keys.p256dh } } }),
        });
        setSubscribed(true);
        toast.success('เปิดรับการแจ้งเตือนแล้ว');
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={subscribed ? 'ปิดการแจ้งเตือน' : 'เปิดการแจ้งเตือน'}
      title={subscribed ? 'ปิดการแจ้งเตือน' : 'เปิดการแจ้งเตือนงานใหม่'}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition',
        subscribed
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-secondary text-muted-foreground hover:bg-secondary/80',
        loading && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        : subscribed
          ? <Bell className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          : <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
      }
      {subscribed ? 'แจ้งเตือนเปิดอยู่' : 'เปิดแจ้งเตือน'}
    </button>
  );
}
