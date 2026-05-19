export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center max-w-screen-sm mx-auto">
          <div className="h-6 w-20 rounded-md bg-muted" />
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto space-y-4">
        {/* Filter chips */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-16 rounded-full bg-muted" />
          ))}
        </div>

        {/* Group label */}
        <div className="h-3 w-12 rounded-md bg-muted mx-1" />

        {/* Notification items */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50 border border-border/40">
            <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded-md bg-muted" />
              <div className="h-3 w-full rounded-md bg-muted/70" />
              <div className="h-3 w-2/3 rounded-md bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
