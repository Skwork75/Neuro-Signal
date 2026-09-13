export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6" aria-busy="true">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-10 w-72 rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-xl bg-white/80" />
        <div className="h-28 rounded-xl bg-white/80" />
        <div className="h-28 rounded-xl bg-white/80" />
      </div>
      <div className="h-40 rounded-xl bg-white/80" />
    </div>
  );
}