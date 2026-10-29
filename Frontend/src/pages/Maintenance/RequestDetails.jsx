import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { Detail, DetailGrid, Panel } from '../../components/common/Detail';
import MaintenanceForm from '../../components/maintenance/MaintenanceForm';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { maintenanceApi, userApi } from '../../services';
import { MAINTENANCE_STATUSES, labelOf } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { idOf, nameOf, roomNo } from '../../utils/entity';
import { ADMIN_MGR, can } from '../../utils/permissions';
import { maxLen, moneyRule } from '../../utils/validators';
/** GET /maintenance/:id · PATCH /:id/assign · PATCH /:id/status · PUT /:id · DELETE /:id (assign/status/edit/delete: Admin/Manager). */
export default function RequestDetails() {
    const { id = '' } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const manage = can(user?.role, ...ADMIN_MGR);
    const { data: r, loading, error, reload } = useFetch(() => maintenanceApi.get(id), [id]);
    const [dlg, setDlg] = useState(null);
    if (error)
        return <><PageHeader back="/portal/maintenance" title="Request"/><ErrorState onRetry={reload} message={error}/></>;
    if (loading || !r)
        return <><PageHeader back="/portal/maintenance" title="Request"/><Skeleton className="h-56"/></>;
    const final = ['COMPLETED', 'CANCELLED'].includes(r.status);
    return (<>
      <PageHeader back="/portal/maintenance" title={r.title} sub={`Room ${roomNo(r.room)} · ${labelOf(r.category)}`} actions={<><StatusBadge status={r.priority}/><StatusBadge status={r.status}/></>}/>
      {manage && <div className="mb-6 flex flex-wrap gap-2"><Button onClick={() => setDlg('assign')}>{r.assignedTo ? 'Reassign' : 'Assign'}</Button>{!final && <Button variant="outline" onClick={() => setDlg('status')}>Update status</Button>}{!final && <Button variant="glass" onClick={() => setDlg('edit')}>Edit</Button>}<Button variant="danger" onClick={() => setDlg('delete')}>Delete</Button></div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Problem"><p className="whitespace-pre-wrap text-sm text-mist">{r.description}</p></Panel>
        <Panel title="Details"><DetailGrid><Detail label="Reported by">{nameOf(r.reportedBy)}</Detail><Detail label="Reported on">{formatDateTime(r.createdAt)}</Detail><Detail label="Assigned to">{r.assignedTo ? nameOf(r.assignedTo) : 'Unassigned'}</Detail><Detail label="Scheduled">{r.scheduledDate ? formatDate(r.scheduledDate) : ''}</Detail><Detail label="Estimated cost">{r.estimatedCost != null ? formatCurrency(r.estimatedCost) : ''}</Detail><Detail label="Actual cost">{r.actualCost != null ? formatCurrency(r.actualCost) : ''}</Detail><Detail label="Completion notes">{r.completionNotes}</Detail><Detail label="Cancellation reason">{r.cancellationReason}</Detail></DetailGrid></Panel>
      </div>
      <MaintenanceForm open={dlg === 'edit'} mode="edit" request={r} onClose={() => setDlg(null)} onSaved={reload}/>
      <AssignDialog open={dlg === 'assign'} current={idOf(r.assignedTo)} onClose={() => setDlg(null)} onSave={async (u) => { try {
        await maintenanceApi.assign(r._id, u);
        toast.success('Request assigned');
        setDlg(null);
        reload();
    }
    catch (e) {
        toast.error(e.message);
    } }}/>
      <StatusDialog open={dlg === 'status'} current={r.status} onClose={() => setDlg(null)} onSaved={reload} id={r._id}/>
      <ConfirmDialog open={dlg === 'delete'} danger title="Delete this request?" message="This permanently removes the maintenance request." confirmLabel="Delete" onClose={() => setDlg(null)} onConfirm={async () => { try {
        await maintenanceApi.remove(r._id);
        toast.success('Request deleted');
        nav('/portal/maintenance');
    }
    catch (e) {
        toast.error(e.message);
        throw e;
    } }}/>
    </>);
}
function AssignDialog({ open, current, onClose, onSave }) {
    const staff = useFetch(async () => (await Promise.all(['Manager', 'Housekeeping', 'Receptionist'].map(role => userApi.list({ role, isActive: 'true', limit: 100 })))).flatMap(p => p.items), [open], open);
    const [u, setU] = useState(current);
    useEffect(() => { if (open)
        setU(current); }, [open, current]);
    return (<Modal open={open} onClose={onClose} title="Assign request"><div className="space-y-4"><Select label="Staff member" value={u} onChange={e => setU(e.target.value)} hint={staff.loading ? 'Loading…' : undefined}><option value="">Select…</option>{staff.data?.map(x => <option key={x._id} value={x._id}>{nameOf(x)} ({x.role})</option>)}</Select><div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button disabled={!u} onClick={() => onSave(u)}>Assign</Button></div></div></Modal>);
}
function StatusDialog({ open, current, id, onClose, onSaved }) {
    const toast = useToast();
    const f = useForm({ status: current, actualCost: '', completionNotes: '', cancellationReason: '' }, v => ({ status: '', actualCost: moneyRule(v.actualCost, 'Actual cost', 0, false), completionNotes: maxLen(v.completionNotes, 1000, 'Notes'), cancellationReason: v.status === 'CANCELLED' && !v.cancellationReason.trim() ? 'A reason is required' : maxLen(v.cancellationReason, 500, 'Reason') }));
    useEffect(() => { if (open)
        f.reset({ status: current, actualCost: '', completionNotes: '', cancellationReason: '' }); }, [open, current]); // eslint-disable-line react-hooks/exhaustive-deps
    const v = f.values;
    const go = (e) => { e.preventDefault(); f.submit(async (x) => { await maintenanceApi.setStatus(id, { status: x.status, ...(x.status === 'COMPLETED' ? { actualCost: x.actualCost === '' ? undefined : Number(x.actualCost), completionNotes: x.completionNotes.trim() } : {}), ...(x.status === 'CANCELLED' ? { cancellationReason: x.cancellationReason.trim() } : {}) }); toast.success('Status updated'); onSaved(); onClose(); }); };
    return (<Modal open={open} onClose={onClose} title="Update status"><form onSubmit={go} noValidate className="space-y-4">
      {f.formError && <Alert kind="error">{f.formError}</Alert>}
      <Select label="Status" value={v.status} onChange={f.onChange('status')}>{MAINTENANCE_STATUSES.map(s => <option key={s} value={s}>{labelOf(s)}</option>)}</Select>
      {v.status === 'COMPLETED' && <><Input label="Actual cost" type="number" min={0} step="any" value={v.actualCost} onChange={f.onChange('actualCost')} error={f.errors.actualCost}/><Textarea label="Completion notes" rows={2} value={v.completionNotes} onChange={f.onChange('completionNotes')} error={f.errors.completionNotes}/></>}
      {v.status === 'CANCELLED' && <Textarea label="Cancellation reason" rows={2} value={v.cancellationReason} onChange={f.onChange('cancellationReason')} error={f.errors.cancellationReason}/>}
      <div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Update</Button></div></form></Modal>);
}
