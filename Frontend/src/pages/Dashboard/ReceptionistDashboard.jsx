import { Link } from 'react-router-dom';
import { LogIn, LogOut, UserPlus, CalendarPlus, BedDouble } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Panel } from '../../components/common/Detail';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { reservationApi, roomApi } from '../../services';
import { formatDate, toInputDate, todayISO } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
function MiniList({ rows, loading, empty, to }) {
    if (loading)
        return <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-12"/>)}</div>;
    if (!rows.length)
        return <EmptyState title={empty} text="Nothing to do right now."/>;
    return (<ul className="divide-y divide-wash/10">
      {rows.slice(0, 6).map(r => (<li key={r._id}><Link to={`/portal/reservations/${r._id}`} className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-gold-ink">
          <span className="min-w-0"><span className="block truncate font-medium">{nameOf(r.guest)}</span><span className="block text-xs text-muted">{r.bookingId} · Room {roomNo(r.room)} · {formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)}</span></span>
          <StatusBadge status={r.status}/>
        </Link></li>))}
      {rows.length > 6 && <li className="pt-3 text-center"><Link to={to} className="text-xs text-gold-ink hover:underline">View all {rows.length}</Link></li>}
    </ul>);
}
/** Front-desk view: today's arrivals / in-house guests / departures, from GET /reservations and /rooms/stats. */
export default function ReceptionistDashboard() {
    const { user } = useAuth();
    const today = todayISO();
    const { data, loading, error, reload } = useFetch(async () => {
        const [conf, pend, inh, stats] = await Promise.all([reservationApi.list({ status: 'CONFIRMED', limit: 100 }), reservationApi.list({ status: 'PENDING', limit: 100 }), reservationApi.list({ status: 'CHECKED_IN', limit: 100 }), roomApi.stats()]);
        return { conf: conf.items, pend: pend.items, inh: inh.items, stats };
    }, []);
    const arrivals = (data?.conf ?? []).filter(r => toInputDate(r.checkInDate) <= today);
    const departures = (data?.inh ?? []).filter(r => toInputDate(r.checkOutDate) <= today);
    return (<>
      <PageHeader title={`Welcome, ${user?.firstName ?? ''}`} sub="Today at the front desk." actions={<><Link to="/portal/walk-in" className="btn-outline"><UserPlus size={16}/> Walk-in</Link><Link to="/portal/reservations/new" className="btn-gold"><CalendarPlus size={16}/> New reservation</Link></>}/>
      {error ? <ErrorState onRetry={reload} message={error}/> : (<>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard loading={loading} icon={LogIn} label="Arrivals due" value={arrivals.length}/>
            <StatCard loading={loading} icon={BedDouble} label="In-house guests" value={data?.inh.length ?? 0}/>
            <StatCard loading={loading} icon={LogOut} label="Departures due" value={departures.length}/>
            <StatCard loading={loading} icon={BedDouble} label="Rooms available" value={data?.stats.byStatus.AVAILABLE ?? 0} hint={`of ${data?.stats.total ?? 0} rooms`}/>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Arrivals" actions={<Link to="/portal/check-in" className="text-xs text-gold-ink hover:underline">Check-in desk</Link>}><MiniList rows={arrivals} loading={loading} empty="No arrivals due" to="/portal/check-in"/></Panel>
            <Panel title="Departures" actions={<Link to="/portal/check-out" className="text-xs text-gold-ink hover:underline">Check-out desk</Link>}><MiniList rows={departures} loading={loading} empty="No departures due" to="/portal/check-out"/></Panel>
            <Panel title="Awaiting confirmation" actions={<Link to="/portal/reservations" className="text-xs text-gold-ink hover:underline">All reservations</Link>}><MiniList rows={data?.pend ?? []} loading={loading} empty="Nothing pending" to="/portal/reservations"/></Panel>
          </div>
        </>)}
    </>);
}
