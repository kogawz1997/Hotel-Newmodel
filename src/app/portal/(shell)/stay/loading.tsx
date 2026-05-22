export default function StayLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <div className="h-8 w-8 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 rounded-md bg-muted" />
            <div className="h-2.5 w-20 rounded-md bg-muted/70" />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto space-y-3">
        {/* Hero card */}
        <div className="h-48 rounded-3xl bg-muted" />

        {/* Date / info row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-2xl bg-muted" />
          <div className="h-20 rounded-2xl bg-muted" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted" />
          ))}
        </div>

        {/* Info cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
