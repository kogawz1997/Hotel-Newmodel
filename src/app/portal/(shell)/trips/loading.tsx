export default function TripsLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center max-w-screen-sm mx-auto">
          <div className="h-6 w-24 rounded-md bg-muted" />
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto space-y-4">
        {/* Filter chips */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-muted" />
          ))}
        </div>

        {/* Booking cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted/50 border border-border/40 overflow-hidden">
            <div className="h-40 bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-40 rounded-md bg-muted" />
              <div className="h-3.5 w-28 rounded-md bg-muted/70" />
              <div className="h-3.5 w-36 rounded-md bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
