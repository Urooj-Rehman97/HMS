import { Link } from 'react-router-dom';
import { CalendarPlus, ConciergeBell, Wrench, MessageSquare, Receipt, BedDouble } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { Panel } from '../../components/common/Detail';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { reservationApi } from '../../services';
import { formatDate, nightsBetween } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { roomNo, roomTypeNameOf } from '../../utils/entity';
const ACTIONS = [
    { to: '/reserve', label: 'Book a room', icon: CalendarPlus }, { to: '/portal/services', label: 'Request a service', icon: ConciergeBell },
    { to: '/portal/maintenance', label: 'Report an issue', icon: Wrench }, { to: '/portal/feedback', label: 'Leave feedback', icon: MessageSquare }, { to: '/portal/billing', label: 'My invoices', icon: Receipt },
];
/** GET /my/reservations - everything a guest needs: current stay, upcoming trips, quick actions. */
export default function GuestDashboard() {
    const { user } = useAuth();
    const { data, loading, error, reload } = useFetch(() => reservationApi.mine(), []);
    const all = data ?? [];
    const current = all.find(r => r.status === 'CHECKED_IN');
    const upcoming = all.filter(r => ['PENDING', 'CONFIRMED'].includes(r.status)).sort((a, b) => +new Date(a.checkInDate) - +new Date(b.checkInDate));
    const past = all.filter(r => ['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(r.status));
    return (<>
      <PageHeader title={`Welcome, ${user?.firstName ?? ''}`} sub="Your stays, requests and invoices in one place."/>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ACTIONS.map(a => <Link key={a.to} to={a.to} className="glass flex flex-col items-center gap-2 rounded-2xl p-4 text-center text-sm transition hover:-translate-y-0.5 hover:border-gold"><a.icon size={20} className="text-gold-ink"/>{a.label}</Link>)}
      </div>
      {error ? <div className="mt-6"><ErrorState onRetry={reload} message={error}/></div> : (<div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Current stay">
            {loading ? <Skeleton className="h-24"/> : current ? (<Link to={`/portal/reservations/${current._id}`} className="block rounded-xl border border-gold/30 bg-gold/5 p-4 transition hover:border-gold">
                <div className="flex items-center justify-between"><span className="font-serif text-xl">Room {roomNo(current.room)}</span><StatusBadge status={current.status}/></div>
                <p className="mt-1 text-sm text-mist">{roomTypeNameOf(current)} · until {formatDate(current.checkOutDate)}</p>
                <p className="mt-3 text-xs text-gold-ink">Request services or report an issue from the menu →</p>
              </Link>) : <EmptyState title="No active stay" text="When you check in, your stay appears here."/>}
          </Panel>
          <Panel title="Upcoming reservations" actions={<Link to="/portal/reservations" className="text-xs text-gold-ink hover:underline">View all</Link>}>
            {loading ? <Skeleton className="h-24"/> : !upcoming.length ? <EmptyState title="Nothing booked" text="Find a room and plan your next stay." action={<Link to="/reserve" className="btn-gold">Book now</Link>}/> : (<ul className="divide-y divide-wash/10">{upcoming.slice(0, 4).map(r => (<li key={r._id}><Link to={`/portal/reservations/${r._id}`} className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-gold-ink">
                  <span><span className="flex items-center gap-2 font-medium"><BedDouble size={14} className="text-gold-ink"/>{roomTypeNameOf(r) || 'Room'}</span><span className="block text-xs text-muted">{formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)} · {nightsBetween(r.checkInDate, r.checkOutDate)} nights · {formatCurrency(r.totalAmount)}</span></span><StatusBadge status={r.status}/></Link></li>))}</ul>)}
          </Panel>
          {past.length > 0 && <Panel title="Past stays"><p className="text-sm text-mist">You have {past.length} past reservation{past.length > 1 ? 's' : ''}. After a stay you can <Link to="/portal/feedback" className="text-gold-ink hover:underline">share your feedback</Link>.</p></Panel>}
        </div>)}
    </>);
}
