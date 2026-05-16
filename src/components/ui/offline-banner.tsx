'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    function handleOffline() { setOnline(false); setShowReconnected(false); }
    function handleOnline() {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    }
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => { window.removeEventListener('offline', handleOffline); window.removeEventListener('online', handleOnline); };
  }, []);

  if (online && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm shadow-lg animate-fade-in" role="status">
        <Wifi className="h-4 w-4" />เชื่อมต่ออินเทอร์เน็ตแล้ว
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-white text-sm border-t border-zinc-700" role="alert" aria-live="assertive">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>ไม่มีการเชื่อมต่ออินเทอร์เน็ต — ข้อมูลอาจล้าสมัย</span>
    </div>
  );
}
