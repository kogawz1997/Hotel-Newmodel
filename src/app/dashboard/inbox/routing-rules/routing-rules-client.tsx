'use client';

export function RoutingRulesClient({ hotelId }: { hotelId: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Sentiment Routing Rules</h1>
      <p className="text-muted-foreground">hotel: {hotelId}</p>
    </div>
  );
}
