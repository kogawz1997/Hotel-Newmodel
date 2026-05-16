'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PhotoCaptureProps {
  taskId: string;
  hotelId: string;
  photoType?: 'before' | 'after' | 'proof' | 'inspection';
  existingUrls?: string[];
  onUploaded?: (url: string) => void;
  label?: string;
  className?: string;
}

export function PhotoCapture({
  taskId,
  hotelId,
  photoType = 'proof',
  existingUrls = [],
  onUploaded,
  label,
  className,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localUrls, setLocalUrls] = useState<string[]>(existingUrls);
  const [preview, setPreview] = useState<string | null>(null);

  const PHOTO_LABEL: Record<string, string> = {
    before: 'ก่อนทำความสะอาด',
    after: 'หลังทำความสะอาด',
    proof: 'หลักฐาน',
    inspection: 'ตรวจสอบ',
  };

  async function handleFile(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('รองรับเฉพาะ JPEG, PNG, WebP เท่านั้น');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('ไฟล์ใหญ่เกิน 10 MB');
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const form = new FormData();
      form.append('taskId', taskId);
      form.append('hotelId', hotelId);
      form.append('photoType', photoType);
      form.append('file', file);

      const res = await fetch('/api/housekeeping/photos', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || 'อัปโหลดไม่สำเร็จ');
      }
      const { url } = await res.json();
      setLocalUrls(prev => [...prev, url]);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
      onUploaded?.(url);
      toast.success('อัปโหลดรูปภาพแล้ว');
    } catch (e: any) {
      toast.error(e.message);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <p className="text-xs font-medium text-muted-foreground">
          {label || PHOTO_LABEL[photoType]}
        </p>
      )}

      {/* Existing + newly uploaded thumbnails */}
      {localUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {localUrls.map((url, i) => (
            <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${photoType} ${i + 1}`} className="h-full w-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 bg-white rounded-full" />
              </div>
            </div>
          ))}

          {/* Preview (uploading) */}
          {preview && (
            <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-accent bg-muted animate-pulse">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="h-full w-full object-cover opacity-60" />
            </div>
          )}
        </div>
      )}

      {/* Upload button */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium transition-colors',
            'hover:border-accent hover:text-accent',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'กำลังอัปโหลด...' : 'เลือกรูป'}
        </button>

        <button
          type="button"
          disabled={uploading}
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.setAttribute('capture', 'environment');
              inputRef.current.click();
            }
          }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium transition-colors',
            'hover:border-accent hover:text-accent',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Camera className="h-3.5 w-3.5" />
          ถ่ายรูป
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
