import { Link } from 'react-router-dom';
import { BedDouble, CalendarCheck, Banknote, Percent, Users, SprayCan, Wrench, Wallet } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Panel } from '../../components/common/Detail';
import { ErrorState } from '../../components/ui';
import { Donut, HBars } from '../../components/Charts';
import { useDateRange } from '../../components/common/DateRange';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { reportApi } from '../../services';
import { formatCurrency } from '../../utils/formatCurrency';
import { labelOf } from '../../utils/constants';
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
/** GET /reports/dashboard?startDate&endDate (Admin / Manager). */
export default function AdminDashboard() {
    const { user } = useAuth();
    const { range, control } = useDateRange('30');
    const { data: d, loading, error, reload } = useFetch(() => reportApi.get('dashboard', range), [range.startDate, range.endDate]);
    const r = d?.rooms ?? {}, res = d?.reservations ?? {}, rev = d?.revenue ?? {}, ops = d?.operations ?? {};
const methods = (Array.isArray(d?.payments) ? d.payments : []).map(m => ({
    label: labelOf(m._id ?? m.method),
    v: Number(m.total ?? m.amount ?? m.count ?? 0),
    c: '#c9a55c'
}));
    return (<>
      <PageHeader title={`${greet()}, ${user?.firstName ?? ''}`} sub="Here is how the hotel is performing." actions={control}/>
      {error ? <ErrorState onRetry={reload} message={error}/> : (<>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard loading={loading} icon={Percent} label="Occupancy" value={`${Number(r.occupancyRate ?? 0).toFixed(0)}%`} hint={`${r.occupied ?? 0} of ${r.total ?? 0} rooms occupied now`}/>
            <StatCard loading={loading} icon={Banknote} label="Revenue" value={formatCurrency(rev.total)} hint="Billed in this period"/>
            <StatCard loading={loading} icon={Wallet} label="Outstanding" value={formatCurrency(rev.outstanding)} hint={`${formatCurrency(rev.paid)} collected`}/>
            <StatCard loading={loading} icon={Users} label="Guests" value={d?.guests?.total ?? 0} hint="Guest profiles"/>
            <StatCard loading={loading} icon={BedDouble} label="Rooms available" value={r.available ?? 0} hint={`${r.cleaning ?? 0} cleaning · ${r.maintenance ?? 0} in maintenance`}/>
            <StatCard loading={loading} icon={CalendarCheck} label="Reservations" value={res.total ?? 0} hint={`${res.confirmed ?? 0} confirmed · ${res.checkedIn ?? 0} in-house`}/>
            <Link to="/portal/housekeeping" className="block transition hover:-translate-y-0.5"><StatCard loading={loading} icon={SprayCan} label="Housekeeping open" value={ops.pendingHousekeeping ?? 0} hint="Tasks waiting"/></Link>
            <Link to="/portal/maintenance" className="block transition hover:-translate-y-0.5"><StatCard loading={loading} icon={Wrench} label="Maintenance open" value={ops.pendingMaintenance ?? 0} hint="Requests waiting"/></Link>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Room status" actions={<Link to="/portal/rooms/status" className="text-xs text-gold-ink hover:underline">Open room board</Link>}>
              <Donut parts={[{ label: 'Available', v: r.available ?? 0, c: '#34d399' }, { label: 'Occupied', v: r.occupied ?? 0, c: '#a78bfa' }, { label: 'Cleaning', v: r.cleaning ?? 0, c: '#38bdf8' }, { label: 'Maintenance', v: r.maintenance ?? 0, c: '#fb923c' }]}/>
            </Panel>
            <Panel title="Reservations by status" actions={<Link to="/portal/reports" className="text-xs text-gold-ink hover:underline">All reports</Link>}>
              <HBars parts={[{ label: 'Confirmed', v: res.confirmed ?? 0, c: '#34d399' }, { label: 'Checked in', v: res.checkedIn ?? 0, c: '#a78bfa' }, { label: 'Checked out', v: res.checkedOut ?? 0, c: '#38bdf8' }, { label: 'Cancelled', v: res.cancelled ?? 0, c: '#f87171' }]}/>
            </Panel>
            {methods.length > 0 && <Panel title="Payments by method (amount)"><HBars parts={methods}/></Panel>}
          </div>
        </>)}
    </>);
}
