// Loading skeletons for the dashboard list and detail page.

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="skeleton h-3 w-40 rounded" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-5 w-32 rounded" />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="skeleton h-14 w-14 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-48 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </div>
  );
}
