import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import RoomForm from '../../components/rooms/RoomForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { FilterSelect, SearchBox, Toolbar } from '../../components/common/Toolbar';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { roomApi } from '../../services';
import { ROOM_STATUSES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { rateOf, imageUrl } from '../../utils/entity';
import { SmartImage } from '../../components/ui';
import { ADMIN_MGR, can } from '../../utils/permissions';
/** GET /rooms (+ /room-types for the filter). Admin/Manager can add, edit, activate and delete rooms. */
export default function Rooms() {
    const { user } = useAuth();
    const toast = useToast();
    const manage = can(user?.role, ...ADMIN_MGR);
    const rooms = useFetch(() => roomApi.list(), []);
    const types = useFetch(() => roomApi.types.list(), []);
    const [status, setStatus] = useState('All');
    const [type, setType] = useState('All');
    const [q, setQ] = useState('');
    const [edit, setEdit] = useState(undefined); // undefined = closed, null = new
    const [del, setDel] = useState(null);
    const shown = useMemo(() => (rooms.data ?? []).filter(r => (status === 'All' || r.status === status) && (type === 'All' || r.roomType?._id === type) && (!q.trim() || String(r.roomNumber).toLowerCase().includes(q.trim().toLowerCase()))), [rooms.data, status, type, q]);
    const toggle = async (r) => { try {
        await roomApi.setActive(r._id, !r.isActive);
        toast.success(r.isActive ? 'Room deactivated' : 'Room activated');
        rooms.reload();
    }
    catch (e) {
        toast.error(e.message);
    } };
    return (<>
      <PageHeader title="Rooms" sub={`${rooms.data?.length ?? 0} rooms in the hotel.`} actions={<><Link to="/portal/rooms/types" className="btn-outline"><Layers size={16}/> Room types</Link>{manage && <Button onClick={() => setEdit(null)}><Plus size={16}/> Add room</Button>}</>}/>
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Room number…"/><FilterSelect label="Statuses" value={status} onChange={setStatus} options={ROOM_STATUSES}/>
        <select className="field !w-auto" aria-label="Room type" value={type} onChange={e => setType(e.target.value)}><option value="All">All types</option>{types.data?.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select></Toolbar>
      {rooms.error ? <ErrorState onRetry={rooms.reload} message={rooms.error}/> : rooms.loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-36"/>)}</div> : !shown.length ? <div className="glass rounded-2xl"><EmptyState title="No rooms found" text="Adjust the filters or add a room."/></div> : (<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{shown.map(r => (<div key={r._id} className={`glass flex flex-col overflow-hidden rounded-2xl ${r.isActive === false ? 'opacity-60' : ''}`}>
            <div className="relative h-40 bg-wash/[0.04]">{r.image ? <SmartImage src={imageUrl(r.image)} alt={`Room ${r.roomNumber}`} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-sm text-muted">No room image uploaded</div>}</div><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-2"><Link to={`/portal/rooms/${r._id}`} className="font-serif text-3xl transition hover:text-gold-ink">{r.roomNumber}</Link><StatusBadge status={r.status}/></div>
            <p className="mt-1 text-sm text-mist">{r.roomType?.name ?? '—'} · floor {r.floor}</p>
            <p className="mt-2 text-sm text-gold-ink">{formatCurrency(rateOf(r))} <span className="text-xs text-muted">/ night{r.price != null ? ' (custom)' : ''}</span></p>
            {r.isActive === false && <p className="mt-1 text-xs text-muted">Deactivated</p>}
            {manage && <div className="mt-auto flex flex-wrap gap-2 pt-4"><Button variant="glass" className="!px-4 !py-1.5 text-xs" onClick={() => setEdit(r)}>Edit</Button><Button variant="glass" className="!px-4 !py-1.5 text-xs" onClick={() => toggle(r)}>{r.isActive === false ? 'Activate' : 'Deactivate'}</Button><Button variant="danger" className="!px-4 !py-1.5 text-xs" onClick={() => setDel(r)}>Delete</Button></div>}</div>
          </div>))}</div>)}
      <RoomForm open={edit !== undefined} room={edit} types={types.data ?? []} onClose={() => setEdit(undefined)} onSaved={rooms.reload}/>
      <ConfirmDialog open={!!del} danger title={`Delete room ${del?.roomNumber ?? ''}?`} message="This permanently removes the room. Rooms with reservations cannot be deleted - deactivate them instead." confirmLabel="Delete room" onClose={() => setDel(null)} onConfirm={async () => { try {
        await roomApi.remove(del._id);
        toast.success('Room deleted');
        rooms.reload();
    }
    catch (e) {
        toast.error(e.message);
        throw e;
    } }}/>
    </>);
}
