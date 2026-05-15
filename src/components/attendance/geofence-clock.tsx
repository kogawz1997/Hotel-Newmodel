'use client';
import { useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isWithinRadius, getCurrentPosition } from '@/lib/geofence';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props { hotelLat?: number; hotelLng?: number; radiusMeters?: number; onClockIn: () => Promise<void>; disabled?: boolean; label?: string; }

export function GeofenceClock({ hotelLat, hotelLng, radiusMeters = 200, onClockIn, disabled, label = 'ลงเวลาเข้างาน' }: Props) {
  const [checking, setChecking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function handleClick() {
    if (!hotelLat || !hotelLng) { await onClockIn(); return; }
    setChecking(true); setLocationError(null);
    try {
      const pos = await getCurrentPosition();
      if (!isWithinRadius(pos, { lat: hotelLat, lng: hotelLng }, radiusMeters)) {
        setLocationError(`คุณอยู่นอกรัศมี ${radiusMeters}m ของโรงแรม`);
        toast.error('ไม่สามารถลงเวลาได้ — อยู่นอกพื้นที่โรงแรม');
        return;
      }
      await onClockIn();
    } catch { setLocationError('ไม่สามารถตรวจสอบตำแหน่งได้'); toast.error('กรุณาอนุญาตการใช้ GPS'); }
    finally { setChecking(false); }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={disabled || checking} className="w-full">
        <MapPin className={cn('h-4 w-4 mr-2', checking && 'animate-bounce')} />
        {checking ? 'กำลังตรวจสอบตำแหน่ง...' : label}
      </Button>
      {locationError && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{locationError}</p>}
    </div>
  );
}
