import { useMemo, useState } from 'react';
import { addDaysISO, todayISO } from '../../utils/formatDate';
const PRESETS = [{ k: '7', l: 'Last 7 days', d: 7 }, { k: '30', l: 'Last 30 days', d: 30 }, { k: '90', l: 'Last 90 days', d: 90 }, { k: '365', l: 'Last 12 months', d: 365 }, { k: 'custom', l: 'Custom range', d: 0 }];
/** Preset + custom date range. Usage: const { range, control } = useDateRange('30'); … {control} */
export function useDateRange(initial = '30') {
    const [preset, setPreset] = useState(initial);
    const [custom, setCustom] = useState({ startDate: addDaysISO(todayISO(), -30), endDate: todayISO() });
    const range = useMemo(() => {
        if (preset === 'custom')
            return custom.startDate && custom.endDate && custom.startDate <= custom.endDate ? custom : { startDate: addDaysISO(todayISO(), -30), endDate: todayISO() };
        return { startDate: addDaysISO(todayISO(), -Number(preset)), endDate: todayISO() };
    }, [preset, custom]);
    const invalid = preset === 'custom' && custom.startDate > custom.endDate;
    const control = (<div className="flex flex-wrap items-center gap-2">
      <select className="field !w-auto" aria-label="Date range" value={preset} onChange={e => setPreset(e.target.value)}>{PRESETS.map(p => <option key={p.k} value={p.k}>{p.l}</option>)}</select>
      {preset === 'custom' && <>
        <input type="date" className="field !w-auto" aria-label="From" max={custom.endDate} value={custom.startDate} onChange={e => setCustom(c => ({ ...c, startDate: e.target.value }))}/>
        <input type="date" className="field !w-auto" aria-label="To" min={custom.startDate} max={todayISO()} value={custom.endDate} onChange={e => setCustom(c => ({ ...c, endDate: e.target.value }))}/>
        {invalid && <span role="alert" className="text-xs text-red-500">“From” must be before “To”.</span>}
      </>}
    </div>);
    return { range, control, preset };
}
