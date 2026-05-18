export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border/40">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <div className="h-6 w-28 rounded-md bg-muted" />
          <div className="h-8 w-8 rounded-xl bg-muted" />
        </div>
      </div>

      <div className="px-4 pt-5 pb-24 max-w-screen-sm mx-auto space-y-4">
        {/* Profile card */}
        <div className="rounded-3xl bg-muted/50 border border-border/40 p-4 flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 rounded-md bg-muted" />
            <div className="h-3.5 w-24 rounded-md bg-muted/70" />
            <div className="h-4 w-20 rounded-md bg-muted/70" />
          </div>
        </div>

        {/* Loyalty card */}
        <div className="h-36 rounded-3xl bg-muted" />

        {/* Menu sections */}
        {Array.from({ length: 2 }).map((_, si) => (
          <div key={si} className="space-y-2">
            <div className="h-3 w-20 rounded-md bg-muted mx-1" />
            <div className="rounded-2xl bg-muted/50 border border-border/40 overflow-hidden divide-y divide-border/40">
              {Array.from({ length: si === 0 ? 3 : 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-28 rounded-md bg-muted" />
                    <div className="h-3 w-40 rounded-md bg-muted/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
