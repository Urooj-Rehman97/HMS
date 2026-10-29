import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { FilterSelect, Toolbar } from '../../components/common/Toolbar';
import MaintenanceForm from '../../components/maintenance/MaintenanceForm';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch, useList } from '../../hooks/useFetch';
import { maintenanceApi } from '../../services';
import { MAINTENANCE_CATEGORIES, MAINTENANCE_STATUSES, PRIORITIES, labelOf } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
/** Staff: GET /maintenance (filters + paging). Guest: GET /my/maintenance + "Report an issue". */
export default function Requests() { const { user } = useAuth(); return user?.role === 'guest' ? <GuestIssues /> : <StaffRequests />; }
function GuestIssues() {
    const { data, loading, error, reload } = useFetch(() => maintenanceApi.mine(), []);
    const [open, setOpen] = useState(false);
    return (<>
      <PageHeader title="Report an issue" sub="Something not right in your room? Tell us and we will fix it." actions={<Button onClick={() => setOpen(true)}><Plus size={16}/> Report an issue</Button>}/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <Skeleton className="h-32"/> : !data?.length ? <div className="glass rounded-2xl"><EmptyState title="No reported issues" text="Issues you report during your stay show up here with their progress."/></div> : (<div className="grid gap-4 md:grid-cols-2">{data.map(r => (<div key={r._id} className="glass rounded-2xl p-5"><div className="flex items-start justify-between gap-3"><p className="font-medium">{r.title}</p><StatusBadge status={r.status}/></div><p className="mt-1 text-xs text-muted">Room {roomNo(r.room)} · {labelOf(r.category)} · {formatDate(r.createdAt)}</p><p className="mt-3 text-sm text-mist">{r.description}</p></div>))}</div>)}
      <MaintenanceForm open={open} mode="guest" onClose={() => setOpen(false)} onSaved={reload}/>
    </>);
}
function StaffRequests() {
    const nav = useNavigate();
    const [status, setStatus] = useState('All');
    const [priority, setPriority] = useState('All');
    const [category, setCategory] = useState('All');
    const [open, setOpen] = useState(false);
    const list = useList(page => maintenanceApi.list({ page, limit: 10, status, priority, category }), [status, priority, category]);
    const cols = [
        { key: 't', head: 'Request', render: r => <span className="font-medium">{r.title}</span> }, { key: 'r', head: 'Room', render: r => roomNo(r.room) }, { key: 'c', head: 'Category', hideMobile: true, render: r => labelOf(r.category) },
        { key: 'a', head: 'Assigned to', hideMobile: true, render: r => r.assignedTo ? nameOf(r.assignedTo) : <span className="text-muted">Unassigned</span> }, { key: 'd', head: 'Reported', hideMobile: true, render: r => formatDate(r.createdAt) },
        { key: 'p', head: 'Priority', render: r => <StatusBadge status={r.priority}/> }, { key: 's', head: 'Status', render: r => <StatusBadge status={r.status}/> },
    ];
    return (<>
      <PageHeader title="Maintenance" sub="Repairs and issues reported by staff and guests." actions={<Button onClick={() => setOpen(true)}><Plus size={16}/> New request</Button>}/>
      <Toolbar><FilterSelect label="Statuses" value={status} onChange={setStatus} options={MAINTENANCE_STATUSES}/><FilterSelect label="Priorities" value={priority} onChange={setPriority} options={PRIORITIES}/><FilterSelect label="Categories" value={category} onChange={setCategory} options={MAINTENANCE_CATEGORIES}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl"><Table cols={cols} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} onRow={r => nav(`/portal/maintenance/${r._id}`)} pager={{ page: list.page, pages: list.pages, total: list.total, onPage: list.setPage }} emptyTitle="No maintenance requests"/></div>
      <MaintenanceForm open={open} mode="staff" onClose={() => setOpen(false)} onSaved={list.reload}/>
    </>);
}
