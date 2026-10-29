export function BarChart({ data, labels }) {
    const max = Math.max(1, ...data);
    return (<div className="flex h-48 items-end gap-3" role="img" aria-label="Revenue bar chart">
      {data.map((v, i) => (<div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end"><div className="w-full rounded-t-md bg-gradient-to-t from-gold-deep/40 to-gold transition-all duration-700" style={{ height: `${(v / max) * 100}%` }} title={String(v)}/></div>
          <span className="text-[10px] text-muted">{labels?.[i] ?? i + 1}</span>
        </div>))}
    </div>);
}
export function Donut({ parts }) {
    const total = parts.reduce((a, b) => a + b.v, 0) || 1;
    let acc = 0;
    const R = 42, C = 2 * Math.PI * R;
    return (<div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90" role="img" aria-label="Occupancy chart">
        <circle cx="50" cy="50" r={R} fill="none" className="stroke-wash/10" strokeWidth="10"/>
        {parts.map(p => { const d = (p.v / total) * C; const el = <circle key={p.label} cx="50" cy="50" r={R} fill="none" stroke={p.c} strokeWidth="10" strokeDasharray={`${d} ${C - d}`} strokeDashoffset={-acc}/>; acc += d; return el; })}
      </svg>
      <ul className="space-y-1.5 text-sm">{parts.map(p => <li key={p.label} className="flex items-center gap-2 text-mist"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.c }}/>{p.label} <span className="text-cream">{p.v}</span></li>)}</ul>
    </div>);
}
export function HBars({ parts }) {
    const max = Math.max(1, ...parts.map(p => p.v));
    return <div className="space-y-4">{parts.map(p => <div key={p.label}><div className="mb-1 flex justify-between text-xs text-mist"><span>{p.label}</span><span className="text-cream">{p.v}</span></div><div className="h-2 rounded-full bg-wash/[0.06]"><div className="h-2 rounded-full transition-all duration-700" style={{ width: `${(p.v / max) * 100}%`, background: p.c }}/></div></div>)}</div>;
}
