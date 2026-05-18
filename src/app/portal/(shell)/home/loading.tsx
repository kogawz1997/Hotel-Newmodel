export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border/40">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted" />
            <div className="h-5 w-28 rounded-md bg-muted" />
          </div>
          <div className="h-7 w-20 rounded-full bg-muted" />
        </div>
      </div>

      <div className="px-4 pt-5 pb-24 max-w-screen-sm mx-auto space-y-4">
        {/* Greeting */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded-md bg-muted" />
          <div className="h-7 w-48 rounded-md bg-muted" />
        </div>

        {/* Search bar */}
        <div className="h-12 rounded-2xl bg-muted" />

        {/* Category grid */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted" />
          ))}
        </div>

        {/* Promo cards */}
        <div className="space-y-2">
          <div className="h-4 w-24 rounded-md bg-muted" />
          <div className="h-36 rounded-2xl bg-muted" />
        </div>

        {/* Hotel list */}
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-md bg-muted" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
