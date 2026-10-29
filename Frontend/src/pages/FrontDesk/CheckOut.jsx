import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { Chips, SearchBox, Toolbar } from '../../components/common/Toolbar';
import { CheckOutModal } from '../../components/frontdesk/DeskModals';
import { Button, StatusBadge } from '../../components/ui';
import { useFetch, useList } from '../../hooks/useFetch';
import { frontDeskApi, reservationApi } from '../../services';
import { formatDate, formatDateTime, toInputDate, todayISO } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
/** Front desk "departures": in-house guests. After checking out, staff continue to the bill. */
export default function CheckOut() {
    const nav = useNavigate();
    const [tab, setTab] = useState('In-house');
    const [q, setQ] = useState('');
    const [target, setTarget] = useState(null);
    const today = todayISO();
    const inh = useFetch(async () => (await reservationApi.list({ status: 'CHECKED_IN', limit: 100 })).items, []);
    const hist = useList(p => frontDeskApi.records({ page: p, limit: 10, status: 'CHECKED_OUT' }), []);
    const rows = useMemo(() => (inh.data ?? []).filter(r => (!q.trim() || `${r.bookingId} ${nameOf(r.guest)} ${roomNo(r.room)}`.toLowerCase().includes(q.trim().toLowerCase())) && (tab === 'In-house' || toInputDate(r.checkOutDate) <= today)), [inh.data, q, tab, today]);
    const cols = [
        { key: 'b', head: 'Booking', render: r => <Link className="font-medium hover:text-gold-ink" to={`/portal/reservations/${r._id}`} onClick={e => e.stopPropagation()}>{r.bookingId}</Link> }, { key: 'g', head: 'Guest', render: r => nameOf(r.guest) }, { key: 'r', head: 'Room', render: r => roomNo(r.room) },
        { key: 'd', head: 'Departure', render: r => <>{formatDate(r.checkOutDate)}{toInputDate(r.checkOutDate) <= today && <span className="ml-2"><StatusBadge status="PENDING" label="Due"/></span>}</> },
        { key: 'a', head: '', render: r => <Button className="!px-4 !py-1.5 text-xs" onClick={() => setTarget(r)}>Check out</Button> },
    ];
    const hcols = [{ key: 'g', head: 'Guest', render: r => nameOf(r.guest) }, { key: 'r', head: 'Room', render: r => roomNo(r.room) }, { key: 'b', head: 'Booking', render: r => r.reservation?.bookingId ?? '—' }, { key: 'o', head: 'Checked out', render: r => formatDateTime(r.actualCheckOutTime) }];
    return (<>
      <PageHeader title="Check-out desk" sub="Check guests out, then create their bill from the reservation."/>
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Booking, guest or room…"/><Chips value={tab} onChange={setTab} options={['In-house', 'Due today', 'History']}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl">
        {tab === 'History' ? <Table cols={hcols} rows={hist.items} loading={hist.loading} error={hist.error} onRetry={hist.reload} pager={{ page: hist.page, pages: hist.pages, total: hist.total, onPage: hist.setPage }} emptyTitle="No check-outs yet"/>
            : <Table key={tab} cols={cols} rows={rows} loading={inh.loading} error={inh.error} onRetry={inh.reload} emptyTitle="No guests to check out"/>}
      </div>
      <CheckOutModal r={target} onClose={() => setTarget(null)} onDone={r => { inh.reload(); hist.reload(); nav(`/portal/reservations/${r._id}`); }}/>
    </>);
}
