'use client';

import { useEffect, useState } from 'react';
import { GuestChatWidget } from '@/components/booking/guest-chat-widget';

export function PortalChatButton() {
  const [hotel, setHotel] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetch('/api/guest/folio')
      .then(r => r.json())
      .then(d => {
        const h = d.reservation?.hotels;
        if (h?.id) setHotel({ id: h.id, name: h.name || 'Hotel' });
      })
      .catch(() => {});
  }, []);

  if (!hotel) return null;
  return <GuestChatWidget hotelId={hotel.id} hotelName={hotel.name} />;
}
