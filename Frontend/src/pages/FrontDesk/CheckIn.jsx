import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { Chips, SearchBox, Toolbar } from '../../components/common/Toolbar';
import { CheckInModal } from '../../components/frontdesk/DeskModals';
import { Button, StatusBadge } from '../../components/ui';
import { useFetch, useList } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { frontDeskApi, reservationApi } from '../../services';
import { formatDate, formatDateTime, toInputDate, todayISO } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
/** Front desk "arrivals": confirmed reservations ready for check-in, plus a history of check-in records. */
export default function CheckIn() {
    const toast = useToast();
    const [tab, setTab] = useState('Due today');
    const [q, setQ] = useState('');
    const [target, setTarget] = useState(null);
    const today = todayISO();
    const conf = useFetch(async () => (await reservationApi.list({ status: 'CONFIRMED', limit: 100 })).items, []);
    const pend = useFetch(async () => (await reservationApi.list({ status: 'PENDING', limit: 100 })).items, []);
    const hist = useList(p => frontDeskApi.records({ page: p, limit: 10 }), []);
    const match = (r) => !q.trim() || `${r.bookingId} ${nameOf(r.guest)} ${roomNo(r.room)}`.toLowerCase().includes(q.trim().toLowerCase());
    const confirmIt = async (r) => { try {
        await reservationApi.confirm(r._id);
        toast.success('Reservation confirmed');
        conf.reload();
        pend.reload();
    }
    catch (e) {
        toast.error(e.message);
    } };
    const rows = useMemo(() => {
        const c = (conf.data ?? []).filter(match);
        return tab === 'Due today' ? c.filter(r => toInputDate(r.checkInDate) <= today) : tab === 'Upcoming' ? c.filter(r => toInputDate(r.checkInDate) > today) : (pend.data ?? []).filter(match);
    }, [conf.data, pend.data, tab, q, today]); // eslint-disable-line react-hooks/exhaustive-deps
    const cols = [
        { key: 'b', head: 'Booking', render: r => <Link className="font-medium hover:text-gold-ink" to={`/portal/reservations/${r._id}`} onClick={e => e.stopPropagation()}>{r.bookingId}</Link> },
        { key: 'g', head: 'Guest', render: r => nameOf(r.guest) },
        { key: 'r', head: 'Room', render: r => r.room ? roomNo(r.room) : <Link className="text-gold-ink hover:underline" to={`/portal/reservations/${r._id}`} onClick={e => e.stopPropagation()}>Assign room</Link> },
        { key: 'd', head: 'Stay', render: r => `${formatDate(r.checkInDate)} → ${formatDate(r.checkOutDate)}` },
        { key: 'a', head: '', render: r => tab === 'Awaiting confirmation' ? <Button className="!px-4 !py-1.5 text-xs" onClick={() => confirmIt(r)}>Confirm</Button>
                : <Button className="!px-4 !py-1.5 text-xs" disabled={!r.room || toInputDate(r.checkInDate) > today} title={!r.room ? 'Assign a room first' : toInputDate(r.checkInDate) > today ? 'Too early: guest arrives later' : undefined} onClick={e => { e.stopPropagation(); setTarget(r); }}>Check in</Button> },
    ];
    const hcols = [
        { key: 'g', head: 'Guest', render: r => nameOf(r.guest) }, { key: 'r', head: 'Room', render: r => roomNo(r.room) }, { key: 'b', head: 'Booking', render: r => r.reservation?.bookingId ?? '—' },
        { key: 'i', head: 'Checked in', render: r => formatDateTime(r.actualCheckInTime) }, { key: 'o', head: 'Checked out', hideMobile: true, render: r => r.actualCheckOutTime ? formatDateTime(r.actualCheckOutTime) : '—' }, { key: 's', head: 'Status', render: r => <StatusBadge status={r.status}/> },
    ];
    return (<>
      <PageHeader title="Check-in desk" sub="Arrivals ready to be checked in. A guest can only be checked in on or after their arrival date, with a room assigned."/>
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Booking, guest or room…"/><Chips value={tab} onChange={setTab} options={['Due today', 'Upcoming', 'Awaiting confirmation', 'History']}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl">
        {tab === 'History' ? <Table cols={hcols} rows={hist.items} loading={hist.loading} error={hist.error} onRetry={hist.reload} pager={{ page: hist.page, pages: hist.pages, total: hist.total, onPage: hist.setPage }} emptyTitle="No check-in records"/>
            : <Table key={tab} cols={cols} rows={rows} loading={conf.loading || pend.loading} error={conf.error || pend.error} onRetry={() => { conf.reload(); pend.reload(); }} emptyTitle={tab === 'Due today' ? 'No arrivals due' : tab === 'Upcoming' ? 'No upcoming arrivals' : 'Nothing awaiting confirmation'}/>}
      </div>
      <CheckInModal r={target} onClose={() => setTarget(null)} onDone={() => { conf.reload(); hist.reload(); }}/>
    </>);
}
