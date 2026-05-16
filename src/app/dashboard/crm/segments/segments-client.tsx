'use client';

export function SegmentsClient({ hotelId }: { hotelId: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">CRM Segments</h1>
      <p className="text-muted-foreground">hotel: {hotelId}</p>
    </div>
  );
}
