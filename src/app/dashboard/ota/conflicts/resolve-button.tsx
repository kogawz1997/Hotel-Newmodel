'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  dlqId: string;
  hotelId: string;
  sourceId: string;
  note?: string;
}

export function ResolveButton({ dlqId, hotelId, sourceId }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function resolve() {
    setLoading(true);
    try {
      const res = await fetch('/api/ota/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          action: 'ota.conflict_resolution',
          payload: { dlqId, sourceId, resolvedAt: new Date().toISOString() },
        }),
      });
      if (res.ok) {
        toast.success('Marked as resolved');
        setDone(true);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to resolve');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (done) return <span className="text-xs text-muted-foreground">Resolved ✓</span>;

  return (
    <Button size="sm" variant="outline" onClick={resolve} disabled={loading}>
      {loading ? 'Resolving…' : 'Mark Resolved'}
    </Button>
  );
}
