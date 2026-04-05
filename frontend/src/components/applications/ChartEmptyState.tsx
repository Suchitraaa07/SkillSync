type ChartEmptyStateProps = {
  message: string;
};

export function ChartEmptyState({ message }: ChartEmptyStateProps) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/45 px-6 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}
