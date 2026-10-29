import { Link } from 'react-router-dom';
import { ClipboardList, Hourglass, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Panel } from '../../components/common/Detail';
import { EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { housekeepingApi } from '../../services';
import { formatDate } from '../../utils/formatDate';
import { roomNo } from '../../utils/entity';
import { labelOf } from '../../utils/constants';
/** GET /housekeeping/my-tasks - the tasks assigned to the logged-in housekeeper. */
export default function HousekeepingDashboard() {
    const { user } = useAuth();
    const { data, loading, error, reload } = useFetch(() => housekeepingApi.mine(), []);
    const tasks = data ?? [];
    const open = tasks.filter(t => ['PENDING', 'ASSIGNED'].includes(t.status)), going = tasks.filter(t => t.status === 'IN_PROGRESS'), done = tasks.filter(t => t.status === 'COMPLETED');
    const active = tasks.filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status));
    return (<>
      <PageHeader title={`Hello, ${user?.firstName ?? ''}`} sub="Your cleaning tasks." actions={<Link to="/portal/housekeeping/schedule" className="btn-outline">Cleaning schedule</Link>}/>
      {error ? <ErrorState onRetry={reload} message={error}/> : (<>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard loading={loading} icon={ClipboardList} label="To do" value={open.length}/>
            <StatCard loading={loading} icon={Hourglass} label="In progress" value={going.length}/>
            <StatCard loading={loading} icon={CheckCircle2} label="Completed" value={done.length}/>
          </div>
          <div className="mt-6"><Panel title="Active tasks" actions={<Link to="/portal/housekeeping" className="text-xs text-gold-ink hover:underline">All tasks</Link>}>
            {loading ? <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-12"/>)}</div> : !active.length ? <EmptyState title="All clear" text="You have no open tasks."/> : (<ul className="divide-y divide-wash/10">{active.map(t => (<li key={t._id}><Link to={`/portal/housekeeping/${t._id}`} className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-gold-ink">
                  <span><span className="block font-medium">Room {roomNo(t.room)} · {labelOf(t.taskType)}</span><span className="block text-xs text-muted">Scheduled {formatDate(t.scheduledDate)} · {labelOf(t.priority)} priority</span></span><StatusBadge status={t.status}/></Link></li>))}</ul>)}
          </Panel></div>
        </>)}
    </>);
}
