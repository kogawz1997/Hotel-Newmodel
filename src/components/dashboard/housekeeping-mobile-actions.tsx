'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PhotoCapture } from '@/components/housekeeping/photo-capture';

interface HousekeepingMobileActionsProps {
  taskId: string;
  hotelId: string;
  photoUrls?: string[];
}

export function HousekeepingMobileActions({ taskId, hotelId, photoUrls = [] }: HousekeepingMobileActionsProps) {
  const [loading, setLoading] = useState<'start' | 'complete' | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(photoUrls.length);

  async function doAction(action: 'start' | 'complete') {
    setLoading(action);
    const endpoint = action === 'start'
      ? `/api/housekeeping/tasks/${taskId}/start`
      : `/api/housekeeping/tasks/${taskId}/complete`;
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        toast.success(action === 'start' ? 'เริ่มงานแล้ว' : 'งานเสร็จแล้ว');
        window.location.reload();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Photo section */}
      <button
        type="button"
        onClick={() => setShowPhotos(v => !v)}
        className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-left text-sm text-stone-300 flex items-center justify-between"
      >
        <span>📷 รูปภาพ</span>
        <span className="text-xs text-stone-400">{uploadedCount} รูป {showPhotos ? '▲' : '▼'}</span>
      </button>

      {showPhotos && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
          <PhotoCapture
            taskId={taskId}
            hotelId={hotelId}
            photoType="before"
            existingUrls={[]}
            onUploaded={() => setUploadedCount(c => c + 1)}
            label="ก่อนทำความสะอาด"
            className="text-stone-300"
          />
          <PhotoCapture
            taskId={taskId}
            hotelId={hotelId}
            photoType="after"
            existingUrls={[]}
            onUploaded={() => setUploadedCount(c => c + 1)}
            label="หลังทำความสะอาด"
            className="text-stone-300"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => doAction('start')}
          disabled={!!loading}
          className="rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-stone-950 disabled:opacity-60"
        >
          {loading === 'start' ? '...' : 'เริ่มงาน'}
        </button>
        <button
          onClick={() => doAction('complete')}
          disabled={!!loading}
          className="rounded-xl bg-emerald-400 px-4 py-3 text-center text-sm font-semibold text-emerald-950 disabled:opacity-60"
        >
          {loading === 'complete' ? '...' : 'เสร็จแล้ว'}
        </button>
      </div>
    </div>
  );
}
