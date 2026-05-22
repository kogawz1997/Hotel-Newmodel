export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="h-14 px-4 flex items-center justify-between max-w-screen-sm mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[10px] bg-muted" />
            <div className="space-y-1.5">
              <div className="h-2 w-16 rounded-full bg-muted/70" />
              <div className="h-3 w-28 rounded-full bg-muted" />
            </div>
          </div>
          <div className="h-7 w-20 rounded-full bg-muted" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-[58vh] min-h-[340px] bg-muted" />

      {/* Search card */}
      <div className="relative z-30 px-4 max-w-screen-sm mx-auto -mt-6">
        <div className="h-14 rounded-2xl bg-white dark:bg-card border border-gray-100 dark:border-border/50 shadow-xl" />
      </div>

      <div className="px-4 mt-6 pb-32 max-w-screen-sm mx-auto space-y-7">
        {/* Quick actions */}
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-12 w-12 rounded-2xl bg-muted" />
              <div className="h-2 w-8 rounded-full bg-muted/70" />
            </div>
          ))}
        </div>

        {/* Deals horizontal strip */}
        <div className="space-y-3.5">
          <div className="h-4 w-20 rounded-full bg-muted" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 w-44 shrink-0 rounded-2xl bg-muted" />
            ))}
          </div>
        </div>

        {/* Hotel cards */}
        <div className="space-y-4">
          <div className="h-4 w-28 rounded-full bg-muted" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-muted shrink-0" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl overflow-hidden border border-gray-100 dark:border-border/40 bg-white dark:bg-card">
              <div className="h-52 bg-muted" />
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div className="h-4 w-32 rounded-full bg-muted" />
                <div className="h-3 w-20 rounded-full bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
