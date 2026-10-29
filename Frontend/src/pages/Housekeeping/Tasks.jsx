import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { FilterSelect, Toolbar } from '../../components/common/Toolbar';
import TaskForm from '../../components/housekeeping/TaskForm';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch, useList } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { housekeepingApi } from '../../services';
import { PRIORITIES, TASK_STATUSES, labelOf } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
import { ADMIN_MGR, can } from '../../utils/permissions';
/** Housekeeper: GET /housekeeping/my-tasks with one-tap status buttons. Others: GET /housekeeping (filters + paging). */
export default function Tasks() { const { user } = useAuth(); return user?.role === 'housekeeping' ? <MyTasks /> : <AllTasks />; }
function MyTasks() {
    const toast = useToast();
    const { data, loading, error, reload } = useFetch(() => housekeepingApi.mine(), []);
    const [busy, setBusy] = useState('');
    const set = async (t, status) => { setBusy(t._id); try {
        await housekeepingApi.setStatus(t._id, status);
        toast.success(status === 'COMPLETED' ? 'Task completed - awaiting inspection' : 'Task started');
        reload();
    }
    catch (e) {
        toast.error(e.message);
    }
    finally {
        setBusy('');
    } };
    const open = (data ?? []).filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status));
    const done = (data ?? []).filter(t => t.status === 'COMPLETED');
    return (<>
      <PageHeader title="My tasks" sub="Rooms assigned to you." actions={<Link to="/portal/housekeeping/schedule" className="btn-outline"><CalendarDays size={16}/> Schedule</Link>}/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <Skeleton className="h-40"/> : !open.length ? <div className="glass rounded-2xl"><EmptyState title="All caught up" text="No open tasks right now."/></div> : (<div className="grid gap-4 md:grid-cols-2">{open.map(t => (<div key={t._id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between"><Link to={`/portal/housekeeping/${t._id}`} className="font-serif text-2xl hover:text-gold-ink">Room {roomNo(t.room)}</Link><StatusBadge status={t.status}/></div>
            <p className="mt-1 text-sm text-mist">{labelOf(t.taskType)} · {formatDate(t.scheduledDate)}</p><div className="mt-2"><StatusBadge status={t.priority} label={`${labelOf(t.priority)} priority`}/></div>
            {t.notes && <p className="mt-3 text-sm text-mist">{t.notes}</p>}
            <div className="mt-4 flex gap-2">{t.status !== 'IN_PROGRESS' ? <Button loading={busy === t._id} onClick={() => set(t, 'IN_PROGRESS')}>Start</Button> : <Button loading={busy === t._id} onClick={() => set(t, 'COMPLETED')}>Mark complete</Button>}<Link className="btn-glass" to={`/portal/housekeeping/${t._id}`}>Details</Link></div>
          </div>))}</div>)}
      {done.length > 0 && <p className="mt-6 text-sm text-mist">{done.length} completed task{done.length > 1 ? 's' : ''} on record.</p>}
    </>);
}
function AllTasks() {
    const { user } = useAuth();
    const nav = useNavigate();
    const manage = can(user?.role, ...ADMIN_MGR);
    const [status, setStatus] = useState('All');
    const [priority, setPriority] = useState('All');
    const [create, setCreate] = useState(false);
    const list = useList(page => housekeepingApi.list({ page, limit: 10, status, priority }), [status, priority]);
    const cols = [
        { key: 'r', head: 'Room', render: t => <span className="font-medium">{roomNo(t.room)}</span> }, { key: 't', head: 'Task', render: t => labelOf(t.taskType) }, { key: 'd', head: 'Date', render: t => formatDate(t.scheduledDate) },
        { key: 'a', head: 'Assigned to', hideMobile: true, render: t => t.assignedTo ? nameOf(t.assignedTo) : <span className="text-muted">Unassigned</span> }, { key: 'p', head: 'Priority', hideMobile: true, render: t => <StatusBadge status={t.priority}/> }, { key: 's', head: 'Status', render: t => <StatusBadge status={t.status}/> },
    ];
    return (<>
      <PageHeader title="Housekeeping" sub="Cleaning tasks across the hotel." actions={<><Link to="/portal/housekeeping/schedule" className="btn-outline"><CalendarDays size={16}/> Schedule</Link>{manage && <Button onClick={() => setCreate(true)}><Plus size={16}/> New task</Button>}</>}/>
      <Toolbar><FilterSelect label="Statuses" value={status} onChange={setStatus} options={TASK_STATUSES}/><FilterSelect label="Priorities" value={priority} onChange={setPriority} options={PRIORITIES}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl"><Table cols={cols} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} onRow={t => nav(`/portal/housekeeping/${t._id}`)} pager={{ page: list.page, pages: list.pages, total: list.total, onPage: list.setPage }} emptyTitle="No tasks" emptyText="Tasks are created automatically at check-out, or add one manually."/></div>
      <TaskForm open={create} onClose={() => setCreate(false)} onSaved={list.reload}/>
    </>);
}
