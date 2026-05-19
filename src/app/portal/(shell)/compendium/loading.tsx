export default function PageLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background animate-pulse">
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <div className="h-8 w-8 rounded-xl bg-muted shrink-0" />
          <div className="h-4 w-32 rounded-md bg-muted" />
        </div>
      </div>
      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted/50 border border-border/40 h-20" />
        ))}
      </div>
    </div>
  );
}
