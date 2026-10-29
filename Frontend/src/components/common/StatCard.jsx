/** KPI tile used on dashboards and reports. */
export default function StatCard({ label, value, icon: I, hint, loading }) {
    return (<div className="glass min-w-0 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3"><p className="text-xs uppercase tracking-wider text-muted">{label}</p>{I && <I size={18} className="shrink-0 text-gold-ink"/>}</div>
      {loading ? <div className="mt-3 h-8 w-24 animate-pulse rounded bg-wash/10"/> : <p className="mt-2 truncate font-serif text-3xl">{value}</p>}
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>);
}
