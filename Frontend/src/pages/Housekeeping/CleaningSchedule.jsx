import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { housekeepingApi } from '../../services';
import { formatDate, toInputDate, todayISO } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
import { labelOf } from '../../utils/constants';
/** Open tasks grouped by scheduled day (overdue first). Data: GET /housekeeping (or /my-tasks for housekeepers). */
export default function CleaningSchedule() {
    const { user } = useAuth();
    const { data, loading, error, reload } = useFetch(async () => user?.role === 'housekeeping' ? housekeepingApi.mine() : (await Promise.all(['PENDING', 'ASSIGNED', 'IN_PROGRESS'].map(status => housekeepingApi.list({ status, limit: 100 })))).flatMap(p => p.items), [user?.role]);
    const today = todayISO();
    const days = useMemo(() => {
        const map = new Map();
        (data ?? []).filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status)).forEach(t => { const k = toInputDate(t.scheduledDate); map.set(k, [...(map.get(k) ?? []), t]); });
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [data]);
    return (<>
      <PageHeader back="/portal/housekeeping" title="Cleaning schedule" sub="Open tasks by day."/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <Skeleton className="h-48"/> : !days.length ? <div className="glass rounded-2xl"><EmptyState title="Nothing scheduled" text="There are no open cleaning tasks."/></div> : (<div className="space-y-5">{days.map(([day, tasks]) => (<section key={day} className="glass rounded-2xl p-5"><h2 className="mb-3 flex items-center gap-3 font-serif text-xl">{formatDate(day)}{day < today ? <StatusBadge status="URGENT" label="Overdue"/> : day === today && <StatusBadge status="PENDING" label="Today"/>}</h2>
            <ul className="divide-y divide-wash/10">{tasks.map(t => (<li key={t._id}><Link to={`/portal/housekeeping/${t._id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:text-gold-ink"><span><span className="font-medium">Room {roomNo(t.room)}</span> <span className="text-xs text-muted">· {labelOf(t.taskType)}{t.assignedTo ? ` · ${nameOf(t.assignedTo)}` : ' · unassigned'}</span></span><span className="flex gap-2"><StatusBadge status={t.priority}/><StatusBadge status={t.status}/></span></Link></li>))}</ul></section>))}</div>)}
    </>);
}
