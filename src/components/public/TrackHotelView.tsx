'use client';

import { useEffect } from 'react';
import { trackHotelView } from './RecentlyViewed';

interface Props {
  id: string;
  slug: string;
  name: string;
  city?: string;
  hero_image_url?: string;
  min_rate?: number;
  avg_rating?: number;
}

export function TrackHotelView(props: Props) {
  useEffect(() => {
    trackHotelView(props);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);
  return null;
}
