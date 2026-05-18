export default function PortalLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 bg-background border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <div className="h-8 w-8 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 rounded-md bg-muted" />
            <div className="h-2.5 w-20 rounded-md bg-muted/70" />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto space-y-3">
        {/* Card skeletons */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted/50 border border-border/40 h-20" />
        ))}
      </div>
    </div>
  );
}
