import { ReportShell } from '../../components/reports/ReportView';
import { Panel } from '../../components/common/Detail';
import { BarChart } from '../../components/Charts';
import { formatCurrency } from '../../utils/formatCurrency';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** GET /reports/revenue - revenue, collected and outstanding amounts, charge breakdown and monthly trend. */
export default function RevenueReport() {
    return <ReportShell kind="revenue" back="/portal/reports" title="Revenue report" sub="Billed, collected and outstanding amounts." top={d => {
            const m = (d.monthly ?? []);
            if (!m.length)
                return null;
            const val = (r) => Number(r.revenue ?? r.total ?? r.totalAmount ?? 0);
            const lab = (r) => { const id = r._id; return id && typeof id === 'object' ? `${MONTHS[(Number(id.month) || 1) - 1]} ${String(id.year ?? '').slice(2)}` : String(r.month ?? id ?? ''); };
            return <Panel title="Monthly revenue"><BarChart data={m.map(val)} labels={m.map(lab)}/><p className="mt-2 text-xs text-muted">Highest month: {formatCurrency(Math.max(...m.map(val)))}</p></Panel>;
        }}/>;
}
