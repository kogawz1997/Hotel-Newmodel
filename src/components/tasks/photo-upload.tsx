'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  workOrderId: string;
  photoType: 'before' | 'after' | 'proof' | 'inspection';
  onUploaded?: (url: string) => void;
  label?: string;
}

export function PhotoUpload({ workOrderId, photoType, onUploaded, label }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('เลือกไฟล์รูปภาพเท่านั้น'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${workOrderId}/${photoType}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('task-photos').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('task-photos').getPublicUrl(path);
      await fetch(`/api/work-orders/${workOrderId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: publicUrl, photoType }),
      });
      setDone(true);
      onUploaded?.(publicUrl);
      toast.success('อัพโหลดรูปสำเร็จ');
    } catch (e: any) {
      toast.error('อัพโหลดไม่สำเร็จ: ' + e.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const typeLabel: Record<string, string> = { before: 'ก่อนทำ', after: 'หลังทำ', proof: 'หลักฐาน', inspection: 'ตรวจสอบ' };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label ?? typeLabel[photoType] ?? photoType}</p>
      {preview ? (
        <div className="relative inline-block">
          <div className="relative h-24 w-24">
            <Image src={preview} alt="preview" fill className="object-cover rounded-lg border border-border" unoptimized />
          </div>
          {done && <CheckCircle className="absolute -top-1.5 -right-1.5 h-5 w-5 text-emerald-500 bg-white rounded-full" />}
          {!done && !uploading && (
            <button onClick={() => { setPreview(null); setDone(false); }} className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors',
            uploading && 'opacity-50 cursor-not-allowed',
          )}
        >
          {uploading ? <Upload className="h-5 w-5 animate-bounce" /> : <Camera className="h-5 w-5" />}
          <span className="text-xs">{uploading ? 'กำลังอัพโหลด...' : 'เพิ่มรูป'}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
