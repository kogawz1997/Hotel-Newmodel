'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const hotelId   = params.get('hotel') || params.get('h');
    const hotelName = params.get('name')  || params.get('n') || 'โรงแรม';
    const heroImage = params.get('img')   || '';

    if (hotelId) {
      try {
        localStorage.setItem('maitri_scanned_hotel', JSON.stringify({
          id: hotelId,
          name: decodeURIComponent(hotelName),
          heroImage: heroImage ? decodeURIComponent(heroImage) : undefined,
        }));
      } catch {}
    }

    router.replace('/portal/stay');
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] dark:bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">กำลังโหลดบริการโรงแรม...</p>
      </div>
    </div>
  );
}
