export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded bg-surface-elevated ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl p-3 bg-surface-elevated border border-[var(--color-border)] space-y-2">
      <SkeletonLine className="h-4 w-3/4" />
      <SkeletonLine className="h-3 w-1/2" />
      <div className="flex gap-2">
        <SkeletonLine className="h-5 w-16 rounded-full" />
        <SkeletonLine className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonColumn() {
  return (
    <div className="w-72 shrink-0 flex flex-col rounded-2xl glass">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <SkeletonLine className="h-4 w-24" />
      </div>
      <div className="p-2 space-y-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function SkeletonMessage({ own = false }) {
  return (
    <div className={`flex gap-3 ${own ? 'flex-row-reverse' : ''}`}>
      <div className="w-8 h-8 rounded-full animate-pulse bg-surface-elevated shrink-0" />
      <div className={`max-w-[70%] space-y-1 ${own ? 'items-end' : ''}`}>
        <div className="flex gap-2">
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-3 w-12" />
        </div>
        <SkeletonLine className={`h-10 rounded-2xl ${own ? 'w-48' : 'w-56'}`} />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl animate-pulse bg-surface-elevated" />
        <div className="space-y-2">
          <SkeletonLine className="h-6 w-16" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCalendar() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <SkeletonLine className="h-8 w-32" />
        <SkeletonLine className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-7 gap-px glass rounded-2xl overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="text-center py-3 bg-surface-elevated">
            <SkeletonLine className="h-3 w-8 mx-auto" />
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[100px] p-2 border-t border-[var(--color-border)] bg-surface-elevated">
            <SkeletonLine className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
