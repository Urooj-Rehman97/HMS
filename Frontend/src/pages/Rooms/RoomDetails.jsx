import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { Detail, DetailGrid, Panel } from '../../components/common/Detail';
import RoomForm from '../../components/rooms/RoomForm';
import { Button, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { roomApi } from '../../services';
import { ROOM_STATUSES, labelOf } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { nameOf, rateOf } from '../../utils/entity';
import { ADMIN_MGR, can } from '../../utils/permissions';
/** GET /rooms/:id - room facts, current booking and quick status change. */
export default function RoomDetails() {
    const { id = '' } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const { data: r, loading, error, reload } = useFetch(() => roomApi.get(id), [id]);
    const types = useFetch(() => roomApi.types.list(), [], can(user?.role, ...ADMIN_MGR));
    const [edit, setEdit] = useState(false);
    if (error)
        return <><PageHeader back="/portal/rooms" title="Room"/><ErrorState onRetry={reload} message={error}/></>;
    if (loading || !r)
        return <><PageHeader back="/portal/rooms" title="Room"/><Skeleton className="h-64"/></>;
    const cb = r.currentBooking;
    const change = async (s) => { try {
        await roomApi.setStatus(r._id, s);
        toast.success(`Room set to ${labelOf(s).toLowerCase()}`);
        reload();
    }
    catch (e) {
        toast.error(e.message);
    } };
    return (<>
      <PageHeader back="/portal/rooms" title={`Room ${r.roomNumber}`} sub={`${r.roomType?.name ?? ''} · floor ${r.floor}`} actions={<><StatusBadge status={r.status}/>{can(user?.role, ...ADMIN_MGR) && <Button variant="outline" onClick={() => setEdit(true)}>Edit</Button>}</>}/>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><Panel title="Details"><DetailGrid>
          <Detail label="Room type">{r.roomType?.name}</Detail><Detail label="Capacity">{r.roomType?.capacity} guests</Detail>
          <Detail label="Rate / night">{formatCurrency(rateOf(r))}{r.price != null && <span className="ml-1 text-xs text-muted">(custom)</span>}</Detail><Detail label="Active">{r.isActive === false ? 'No' : 'Yes'}</Detail>
          <Detail label="Amenities">{r.roomType?.amenities?.join(', ')}</Detail><Detail label="Notes">{r.notes}</Detail>
        </DetailGrid></Panel></div>
        <div className="space-y-6">
          <Panel title="Change status"><select aria-label="Room status" className="field" value={r.status} onChange={e => change(e.target.value)}>{ROOM_STATUSES.map(s => <option key={s} value={s}>{labelOf(s)}</option>)}</select></Panel>
          <Panel title="Current booking">{cb && typeof cb === 'object' ? <div className="text-sm"><Link to={`/portal/reservations/${cb._id}`} className="font-medium text-gold-ink hover:underline">{cb.bookingId}</Link><p className="mt-1 text-mist">{nameOf(cb.guest)}</p><p className="text-xs text-muted">{formatDate(cb.checkInDate)} → {formatDate(cb.checkOutDate)}</p></div> : <p className="text-sm text-mist">No guest is checked in.</p>}</Panel>
        </div>
      </div>
      <RoomForm open={edit} room={r} types={types.data ?? []} onClose={() => setEdit(false)} onSaved={reload}/>
    </>);
}
