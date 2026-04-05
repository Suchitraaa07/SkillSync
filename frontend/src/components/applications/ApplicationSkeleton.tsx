export function ApplicationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/65" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-[360px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/65" />
        ))}
      </div>
      <div className="h-[320px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/65" />
    </div>
  );
}
