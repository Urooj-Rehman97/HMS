import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { roomApi } from '../../services';
import { ROOM_STATUSES, labelOf } from '../../utils/constants';
/** Live room board grouped by status. Changing the dropdown calls PATCH /rooms/:id/status. */
export default function RoomStatus() {
    const toast = useToast();
    const { data, loading, error, reload } = useFetch(() => roomApi.list({ isActive: 'true' }), []);
    const [busy, setBusy] = useState('');
    const groups = useMemo(() => ROOM_STATUSES.map(s => ({ s, rooms: (data ?? []).filter(r => r.status === s) })), [data]);
    const change = async (id, status) => { setBusy(id); try {
        await roomApi.setStatus(id, status);
        toast.success(`Room set to ${labelOf(status).toLowerCase()}`);
        reload();
    }
    catch (e) {
        toast.error(e.message);
    }
    finally {
        setBusy('');
    } };
    return (<>
      <PageHeader back="/portal/rooms" title="Room status board" sub="Move rooms between cleaning, available and maintenance in one click."/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-48"/>)}</div> : (<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{groups.map(g => (<section key={g.s} className="glass rounded-2xl p-4"><div className="mb-3 flex items-center justify-between"><StatusBadge status={g.s}/><span className="text-xs text-muted">{g.rooms.length}</span></div>
            {!g.rooms.length ? <p className="py-6 text-center text-xs text-muted">No rooms</p> : <ul className="space-y-2">{g.rooms.map(r => (<li key={r._id} className="flex items-center justify-between gap-3 rounded-xl border border-wash/10 px-3 py-2"><Link to={`/portal/rooms/${r._id}`} className="min-w-0 text-sm hover:text-gold-ink"><span className="font-medium">{r.roomNumber}</span> <span className="text-xs text-muted">{r.roomType?.name}</span></Link>
                <select aria-label={`Status of room ${r.roomNumber}`} disabled={busy === r._id} className="field !w-auto !py-1.5 text-xs" value={r.status} onChange={e => change(r._id, e.target.value)}>{ROOM_STATUSES.map(s => <option key={s} value={s}>{labelOf(s)}</option>)}</select></li>))}</ul>}
          </section>))}</div>)}
    </>);
}
