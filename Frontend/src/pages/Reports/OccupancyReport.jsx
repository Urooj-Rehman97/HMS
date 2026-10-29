import { ReportShell, humanize } from '../../components/reports/ReportView';
import { Panel } from '../../components/common/Detail';
import { HBars } from '../../components/Charts';
/** GET /reports/occupancy - occupancy rate overall and per room type. */
export default function OccupancyReport() {
    return <ReportShell kind="occupancy" back="/portal/reports" title="Occupancy report" sub="How full the hotel was in the period." top={d => {
            const rows = (d.byRoomType ?? []);
            const key = rows[0] ? Object.keys(rows[0]).find(k => /rate|percent/i.test(k)) : undefined;
            const label = (r) => String(r.roomType ?? r.name ?? r.type ?? r._id ?? '');
            if (!rows.length || !key)
                return null;
            return <Panel title={`${humanize(key)} by room type`}><HBars parts={rows.map(r => ({ label: label(r), v: Number(r[key]) || 0, c: '#c9a55c' }))}/></Panel>;
        }}/>;
}
