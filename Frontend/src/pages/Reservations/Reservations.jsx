import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, CalendarSearch } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { Chips, FilterSelect, SearchBox, Toolbar } from '../../components/common/Toolbar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useFetch, useList } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { reservationApi } from '../../services';
import { PAYMENT_STATUSES, RESERVATION_STATUSES } from '../../utils/constants';
import { formatDate, nightsBetween } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { nameOf, roomNo, roomTypeNameOf } from '../../utils/entity';
/** Staff: GET /reservations (server-side search, filters, paging). Guest: GET /my/reservations. */
export default function Reservations() {
    const { user } = useAuth();
    return user?.role === 'guest' ? <GuestReservations /> : <StaffReservations />;
}
function StaffReservations() {
    const nav = useNavigate();
    const [search, setSearch] = useState('');
    const q = useDebounce(search.trim(), 350);
    const [status, setStatus] = useState('All');
    const [pay, setPay] = useState('All');
    const list = useList(page => reservationApi.list({ page, limit: 10, search: q, status, paymentStatus: pay }), [q, status, pay]);
    const cols = [
        { key: 'id', head: 'Booking', render: r => <span className="font-medium">{r.bookingId}</span> },
        { key: 'guest', head: 'Guest', render: r => nameOf(r.guest) },
        { key: 'room', head: 'Room', render: r => r.room ? `${roomNo(r.room)} · ${roomTypeNameOf(r) || roomTypeNameOf(r.room)}` : <span className="text-muted">Not assigned</span> },
        { key: 'dates', head: 'Stay', render: r => <>{formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)}<span className="ml-1 text-xs text-muted">({nightsBetween(r.checkInDate, r.checkOutDate)}n)</span></> },
        { key: 'total', head: 'Total', render: r => formatCurrency(r.totalAmount) },
        { key: 'pay', head: 'Payment', render: r => <StatusBadge status={r.paymentStatus}/> },
        { key: 'status', head: 'Status', render: r => <StatusBadge status={r.status}/> },
    ];
    return (<>
      <PageHeader title="Reservations" sub="Search, confirm and manage every booking." actions={<><Link to="/portal/reservations/availability" className="btn-outline"><CalendarSearch size={16}/> Availability</Link><Link to="/portal/reservations/new" className="btn-gold"><CalendarPlus size={16}/> New</Link></>}/>
      <Toolbar><SearchBox value={search} onChange={setSearch} placeholder="Booking ID…"/><FilterSelect label="Statuses" value={status} onChange={setStatus} options={RESERVATION_STATUSES}/><FilterSelect label="Payments" value={pay} onChange={setPay} options={PAYMENT_STATUSES}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl"><Table cols={cols} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} onRow={r => nav(`/portal/reservations/${r._id}`)} pager={{ page: list.page, pages: list.pages, total: list.total, onPage: list.setPage }} emptyTitle="No reservations found" emptyText="Try different filters or create a new reservation."/></div>
    </>);
}
function GuestReservations() {
    const toast = useToast();
    const { data, loading, error, reload } = useFetch(() => reservationApi.mine(), []);
    const [tab, setTab] = useState('All');
    const [cancel, setCancel] = useState(null);
    const rows = (data ?? []).filter(r => tab === 'All' || r.status === tab);
    return (<>
      <PageHeader title="My reservations" sub="Your bookings with LuxuryStay." actions={<Link to="/reserve" className="btn-gold"><CalendarPlus size={16}/> Book a room</Link>}/>
      <Toolbar><Chips value={tab} onChange={setTab} options={['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']}/></Toolbar>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1].map(i => <Skeleton key={i} className="h-40"/>)}</div> : !rows.length ? <div className="glass rounded-2xl"><EmptyState title="No reservations" text="When you book a stay it will show up here." action={<Link to="/reserve" className="btn-gold">Book a room</Link>}/></div> : (<div className="grid gap-4 md:grid-cols-2">{rows.map(r => (<div key={r._id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="font-serif text-xl">{roomTypeNameOf(r) || 'Room'}</p><p className="text-xs text-muted">{r.bookingId}</p></div><StatusBadge status={r.status}/></div>
            <p className="mt-3 text-sm text-mist">{formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)} · {nightsBetween(r.checkInDate, r.checkOutDate)} nights</p>
            <p className="mt-1 text-sm">{formatCurrency(r.totalAmount)} <span className="text-xs text-muted">· <StatusBadge status={r.paymentStatus}/></span></p>
            <div className="mt-4 flex flex-wrap gap-2"><Link to={`/portal/reservations/${r._id}`} className="btn-outline !py-2">Details</Link>{['PENDING', 'CONFIRMED'].includes(r.status) && <Button variant="danger" className="!py-2" onClick={() => setCancel(r)}>Cancel</Button>}</div>
          </div>))}</div>)}
      <ConfirmDialog open={!!cancel} danger title="Cancel this reservation?" message={`Booking ${cancel?.bookingId ?? ''} will be cancelled. This cannot be undone.`} confirmLabel="Cancel reservation" onClose={() => setCancel(null)} onConfirm={async () => { try {
        await reservationApi.cancelMine(cancel._id, 'Cancelled by guest');
        toast.success('Reservation cancelled');
        reload();
    }
    catch (e) {
        toast.error(e.message);
        throw e;
    } }}/>
    </>);
}
