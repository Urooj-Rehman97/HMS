import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BedDouble, CheckCircle2, Receipt, XCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { Detail, DetailGrid, Panel } from '../../components/common/Detail';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Select, Textarea, Input } from '../../components/Field';
import { Button, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { billingApi, reservationApi } from '../../services';
import { PAYMENT_STATUSES } from '../../utils/constants';
import { formatDate, formatDateTime, nightsBetween } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { nameOf, roomLabel, roomTypeNameOf } from '../../utils/entity';
import { intRange, maxLen } from '../../utils/validators';
/** GET /reservations/:id + actions: confirm, assign room, payment status, cancel, no-show, edit, create bill. */
export default function ReservationDetails() {
    const { id = '' } = useParams();
    const nav = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const staff = user?.role !== 'guest';
    const { data: r, loading, error, reload } = useFetch(() => reservationApi.get(id), [id]);
    const bill = useFetch(async () => { try {
        return await billingApi.byReservation(id);
    }
    catch {
        return null;
    } }, [id], staff);
    const [dlg, setDlg] = useState(null);
    const [busy, setBusy] = useState(false);
    const run = async (fn, ok) => { setBusy(true); try {
        await fn();
        toast.success(ok);
        reload();
        return true;
    }
    catch (e) {
        toast.error(e.message);
        return false;
    }
    finally {
        setBusy(false);
    } };
    if (error)
        return <><PageHeader back="/portal/reservations" title="Reservation"/><ErrorState onRetry={reload} message={error}/></>;
    if (loading || !r)
        return <><PageHeader back="/portal/reservations" title="Reservation"/><div className="space-y-4"><Skeleton className="h-28"/><Skeleton className="h-64"/></div></>;
    const open = ['PENDING', 'CONFIRMED'].includes(r.status);
    const editable = !['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(r.status);
    const createBill = () => run(async () => { const b = await billingApi.create({ reservation: r._id, tax: r.tax, discount: r.discount }); nav(`/portal/billing/${b._id}`); }, 'Bill created');
    return (<>
      <PageHeader back="/portal/reservations" title={r.bookingId} sub={`${nameOf(r.guest)} · ${formatDate(r.checkInDate)} → ${formatDate(r.checkOutDate)}`} actions={<><StatusBadge status={r.status}/><StatusBadge status={r.paymentStatus}/></>}/>
      {staff && (<div className="mb-6 flex flex-wrap gap-2">
          {r.status === 'PENDING' && <Button loading={busy} onClick={() => run(() => reservationApi.confirm(r._id), 'Reservation confirmed')}><CheckCircle2 size={16}/> Confirm</Button>}
          {editable && <Button variant="outline" onClick={() => setDlg('room')}><BedDouble size={16}/> {r.room ? 'Change room' : 'Assign room'}</Button>}
          {r.status === 'CONFIRMED' && <Link to="/portal/check-in" className="btn-outline">Go to check-in</Link>}
          {r.status === 'CHECKED_IN' && <Link to="/portal/check-out" className="btn-outline">Go to check-out</Link>}
          {editable && <Button variant="glass" onClick={() => setDlg('edit')}>Edit details</Button>}
          <Button variant="glass" onClick={() => setDlg('payment')}>Payment status</Button>
          {bill.data ? <Link to={`/portal/billing/${bill.data._id}`} className="btn-glass"><Receipt size={16}/> View bill</Link> : ['CHECKED_IN', 'CHECKED_OUT'].includes(r.status) && <Button variant="glass" loading={busy} onClick={createBill}><Receipt size={16}/> Create bill</Button>}
          {open && <Button variant="glass" onClick={() => setDlg('noshow')}>Mark no-show</Button>}
          {open && <Button variant="danger" onClick={() => setDlg('cancel')}><XCircle size={16}/> Cancel</Button>}
        </div>)}
      {!staff && open && <div className="mb-6"><Button variant="danger" onClick={() => setDlg('cancel')}><XCircle size={16}/> Cancel reservation</Button></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Stay"><DetailGrid>
            <Detail label="Room">{r.room ? roomLabel({ ...r.room, roomType: r.roomType }) : <span className="text-muted">Not assigned yet</span>}</Detail>
            <Detail label="Room type">{roomTypeNameOf(r)}</Detail>
            <Detail label="Check-in">{formatDate(r.checkInDate)}</Detail><Detail label="Check-out">{formatDate(r.checkOutDate)}</Detail>
            <Detail label="Nights">{nightsBetween(r.checkInDate, r.checkOutDate)}</Detail><Detail label="Guests">{r.adults} adult{r.adults === 1 ? '' : 's'}{r.children ? `, ${r.children} child${r.children === 1 ? '' : 'ren'}` : ''}</Detail>
            <Detail label="Booking source">{String(r.bookingSource ?? '').replace('_', ' ').toLowerCase()}</Detail><Detail label="Booked on">{formatDateTime(r.createdAt)}</Detail>
          </DetailGrid></Panel>
          {r.specialRequests && <Panel title="Special requests"><p className="whitespace-pre-wrap text-sm text-mist">{r.specialRequests}</p></Panel>}
          {r.status === 'CANCELLED' && <Panel title="Cancellation"><DetailGrid><Detail label="Cancelled on">{formatDateTime(r.cancelledAt)}</Detail><Detail label="Reason">{r.cancellationReason}</Detail></DetailGrid></Panel>}
        </div>
        <div className="space-y-6">
          {staff && <Panel title="Guest"><DetailGrid cols={2}><Detail label="Name">{nameOf(r.guest)}</Detail><Detail label="Email">{r.guest?.email}</Detail><Detail label="Phone">{r.guest?.phone}</Detail></DetailGrid></Panel>}
          <Panel title="Charges"><dl className="space-y-2 text-sm">
            <div className="flex justify-between text-mist"><dt>Rate / night</dt><dd>{formatCurrency(r.roomRate)}</dd></div>
            <div className="flex justify-between text-mist"><dt>Tax & service</dt><dd>{formatCurrency(r.tax)}</dd></div>
            {Number(r.discount) > 0 && <div className="flex justify-between text-mist"><dt>Discount</dt><dd>−{formatCurrency(r.discount)}</dd></div>}
            <div className="flex justify-between border-t border-wash/10 pt-3 font-serif text-xl"><dt>Total</dt><dd>{formatCurrency(r.totalAmount)}</dd></div></dl></Panel>
        </div>
      </div>

      <RoomDialog open={dlg === 'room'} r={r} onClose={() => setDlg(null)} onSave={room => run(() => reservationApi.assignRoom(r._id, room), 'Room assigned').then(ok => ok && setDlg(null))}/>
      <PaymentDialog open={dlg === 'payment'} current={r.paymentStatus} onClose={() => setDlg(null)} onSave={s => run(() => reservationApi.setPaymentStatus(r._id, s), 'Payment status updated').then(ok => ok && setDlg(null))}/>
      <EditDialog open={dlg === 'edit'} r={r} onClose={() => setDlg(null)} onSave={b => run(() => reservationApi.update(r._id, b), 'Reservation updated').then(ok => ok && setDlg(null))}/>
      <CancelDialog open={dlg === 'cancel'} onClose={() => setDlg(null)} onSave={reason => run(() => (staff ? reservationApi.cancel(r._id, reason) : reservationApi.cancelMine(r._id, reason)), 'Reservation cancelled').then(ok => ok && setDlg(null))}/>
      <ConfirmDialog open={dlg === 'noshow'} title="Mark as no-show?" message="The guest did not arrive. The reservation will be marked as a no-show." confirmLabel="Mark no-show" onClose={() => setDlg(null)} onConfirm={async () => { if (!(await run(() => reservationApi.setStatus(r._id, 'NO_SHOW'), 'Marked as no-show')))
        throw new Error('failed'); }}/>
    </>);
}
function RoomDialog({ open, r, onClose, onSave }) {
    const typeId = r.roomType?._id ?? r.roomType;
    const { data: rooms, loading, error } = useFetch(() => reservationApi.availability({ roomType: typeId, checkInDate: r.checkInDate.slice(0, 10), checkOutDate: r.checkOutDate.slice(0, 10), excludeReservation: r._id }), [r._id, r.checkInDate, r.checkOutDate], open && !!typeId);
    const [room, setRoom] = useState('');
    return (<Modal open={open} onClose={onClose} title={r.room ? 'Change room' : 'Assign room'}>
      <div className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        <Select label="Available rooms" value={room} onChange={e => setRoom(e.target.value)} hint={loading ? 'Checking availability…' : undefined}><option value="">Select a room</option>{(rooms ?? []).map(x => <option key={x._id} value={x._id}>Room {x.roomNumber} · floor {x.floor}{x._id === r.room?._id ? ' (current)' : ''}</option>)}</Select>
        <div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Close</Button><Button disabled={!room} onClick={() => onSave(room)}>Save</Button></div>
      </div>
    </Modal>);
}
function PaymentDialog({ open, current, onClose, onSave }) {
    const [s, setS] = useState(current);
    return (<Modal open={open} onClose={onClose} title="Payment status"><div className="space-y-4"><Select label="Status" value={s} onChange={e => setS(e.target.value)}>{PAYMENT_STATUSES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}</Select><p className="text-xs text-muted">Normally this updates automatically when payments are recorded against the bill.</p><div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Close</Button><Button onClick={() => onSave(s)}>Save</Button></div></div></Modal>);
}
function CancelDialog({ open, onClose, onSave }) {
    const [reason, setReason] = useState('');
    const err = maxLen(reason, 500, 'Reason');
    return (<Modal open={open} onClose={onClose} title="Cancel reservation"><div className="space-y-4"><Textarea label="Reason (optional)" rows={3} value={reason} onChange={e => setReason(e.target.value)} error={err}/><div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Keep reservation</Button><Button variant="danger" disabled={!!err} onClick={() => onSave(reason.trim())}>Cancel reservation</Button></div></div></Modal>);
}
function EditDialog({ open, r, onClose, onSave }) {
    const [v, setV] = useState({ adults: String(r.adults ?? 1), children: String(r.children ?? 0), specialRequests: r.specialRequests ?? '' });
    const e = { adults: intRange(v.adults, 1, 20, 'Adults'), children: intRange(v.children, 0, 20, 'Children'), specialRequests: maxLen(v.specialRequests, 1000, 'Special requests') };
    return (<Modal open={open} onClose={onClose} title="Edit reservation">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Adults" type="number" min={1} value={v.adults} onChange={x => setV({ ...v, adults: x.target.value })} error={e.adults}/>
        <Input label="Children" type="number" min={0} value={v.children} onChange={x => setV({ ...v, children: x.target.value })} error={e.children}/>
        <div className="sm:col-span-2"><Textarea label="Special requests" rows={3} value={v.specialRequests} onChange={x => setV({ ...v, specialRequests: x.target.value })} error={e.specialRequests}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Close</Button><Button disabled={Object.values(e).some(Boolean)} onClick={() => onSave({ adults: Number(v.adults), children: Number(v.children), specialRequests: v.specialRequests.trim() })}>Save</Button></div>
      </div>
    </Modal>);
}
