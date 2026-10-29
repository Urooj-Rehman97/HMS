import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { Chips } from '../../components/common/Toolbar';
import { ReportBody } from '../../components/reports/ReportView';
import { ErrorState, Skeleton } from '../../components/ui';
import { useDateRange } from '../../components/common/DateRange';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { reportApi } from '../../services';
import { ADMIN_MGR, can } from '../../utils/permissions';
const KINDS = [
    { k: 'reservations', l: 'Reservations', all: false }, { k: 'rooms', l: 'Rooms', all: false }, { k: 'guests', l: 'Guests', all: false },
    { k: 'occupancy', l: 'Occupancy', all: true }, { k: 'revenue', l: 'Revenue', all: true }, { k: 'payments', l: 'Payments', all: true }, { k: 'feedback', l: 'Feedback', all: true }, { k: 'operations', l: 'Operations', all: true },
];
const DETAIL = { occupancy: '/portal/reports/occupancy', revenue: '/portal/reports/revenue', guests: '/portal/reports/guests' };
/** Report hub: one tab per GET /reports/:kind the signed-in role may open. */
export default function Reports() {
    const { user } = useAuth();
    const admin = can(user?.role, ...ADMIN_MGR);
    const kinds = useMemo(() => KINDS.filter(x => admin || !x.all), [admin]);
    const [kind, setKind] = useState(kinds[0].k);
    const { range, control } = useDateRange('30');
    const dated = kind !== 'rooms';
    const { data, loading, error, reload } = useFetch(() => reportApi.get(kind, dated ? range : {}), [kind, range.startDate, range.endDate, dated]);
    return (<>
      <PageHeader title="Reports & analytics" sub="Operational and financial reports for the selected period." actions={dated ? control : undefined}/>
      <div className="mb-5 flex flex-wrap items-center gap-2"><Chips value={KINDS.find(x => x.k === kind).l} onChange={l => setKind(KINDS.find(x => x.l === l).k)} options={kinds.map(x => x.l)}/>{DETAIL[kind] && <Link className="ml-auto text-sm text-gold-ink hover:underline" to={DETAIL[kind]}>Open detailed {kind} view →</Link>}</div>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading || !data ? <div className="space-y-4"><Skeleton className="h-28"/><Skeleton className="h-64"/></div> : <ReportBody data={data}/>}
    </>);
}
