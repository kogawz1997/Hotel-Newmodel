'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Props {
  eventId: string;
  eventType: string;
  hotelId: string;
}

export function ReplayButton({ eventId, eventType, hotelId }: Props) {
  const [loading, setLoading] = useState(false);

  async function replay() {
    setLoading(true);
    try {
      const res = await fetch('/api/ops/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'info',
          title: `[Replay] ${eventType}`,
          message: `Manual replay of event ${eventId}`,
          context: { eventId, hotelId, source: 'incident-replay' },
        }),
      });
      if (res.ok) {
        toast.success('Replay triggered — ส่ง alert ซ้ำแล้ว');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to replay');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" onClick={replay} disabled={loading} className="h-7 gap-1 text-xs">
      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Replaying…' : 'Replay'}
    </Button>
  );
}
