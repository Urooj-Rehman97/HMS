import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { Detail, DetailGrid, Panel } from '../../components/common/Detail';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { Select, Textarea } from '../../components/Field';
import { Button, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { serviceApi, userApi } from '../../services';
import { SERVICE_REQUEST_STATUSES, labelOf } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { idOf, nameOf, roomNo } from '../../utils/entity';
import { ADMIN_MGR, OPS, can } from '../../utils/permissions';
import { maxLen } from '../../utils/validators';
/** GET /services/requests/:id · PATCH /:id/assign (Admin/Manager/Receptionist) · PATCH /:id/status (staff). */
export default function ServiceDetails() {
    const { id = '' } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const { data: r, loading, error, reload } = useFetch(() => serviceApi.requests.get(id), [id]);
    const [dlg, setDlg] = useState(null);
    if (error)
        return <><PageHeader back="/portal/services/requests" title="Request"/><ErrorState onRetry={reload} message={error}/></>;
    if (loading || !r)
        return <><PageHeader back="/portal/services/requests" title="Request"/><Skeleton className="h-56"/></>;
    const staff = user?.role !== 'guest';
    const final = ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status);
    return (<>
      <PageHeader back="/portal/services/requests" title={r.service?.name ?? 'Service request'} sub={`Room ${roomNo(r.room)} · ${nameOf(r.guest)}`} actions={<StatusBadge status={r.status}/>}/>
      {staff && !final && <div className="mb-6 flex flex-wrap gap-2"><Button onClick={() => setDlg('status')}>Update status</Button>{can(user?.role, ...OPS) && <Button variant="outline" onClick={() => setDlg('assign')}>{r.assignedTo ? 'Reassign' : 'Assign'}</Button>}</div>}
      <Panel title="Details"><DetailGrid>
        <Detail label="Quantity">{r.quantity}</Detail><Detail label="Total">{formatCurrency(r.totalAmount, 2)}</Detail>
        <Detail label="Requested">{formatDateTime(r.createdAt)}</Detail><Detail label="Scheduled for">{r.scheduledFor ? formatDateTime(r.scheduledFor) : ''}</Detail>
        <Detail label="Assigned to">{r.assignedTo ? nameOf(r.assignedTo) : 'Unassigned'}</Detail><Detail label="Added to bill">{r.addedToBill ? 'Yes' : 'No'}</Detail>
        <Detail label="Instructions">{r.specialInstructions}</Detail><Detail label="Completion notes">{r.completionNotes}</Detail><Detail label="Cancellation reason">{r.cancellationReason}</Detail>
      </DetailGrid></Panel>
      <StatusDialog open={dlg === 'status'} id={r._id} current={r.status} onClose={() => setDlg(null)} onSaved={() => { toast.success('Status updated'); reload(); }}/>
      <AssignDialog open={dlg === 'assign'} current={idOf(r.assignedTo)} onClose={() => setDlg(null)} onSave={async (u) => { try {
        await serviceApi.requests.assign(r._id, u);
        toast.success('Request assigned');
        setDlg(null);
        reload();
    }
    catch (e) {
        toast.error(e.message);
    } }}/>
    </>);
}
function AssignDialog({ open, current, onClose, onSave }) {
    const { user } = useAuth();
    const canList = can(user?.role, ...ADMIN_MGR);
    const staff = useFetch(async () => (await Promise.all(['Receptionist', 'Housekeeping', 'Manager'].map(role => userApi.list({ role, isActive: 'true', limit: 100 })))).flatMap(p => p.items), [open], open && canList);
    const [u, setU] = useState(current);
    useEffect(() => { if (open)
        setU(current); }, [open, current]);
    return (<Modal open={open} onClose={onClose} title="Assign request"><div className="space-y-4">{!canList ? <Alert kind="info">Only a manager or admin can pick who handles a request.</Alert> : <Select label="Staff member" value={u} onChange={e => setU(e.target.value)}><option value="">Select…</option>{staff.data?.map(x => <option key={x._id} value={x._id}>{nameOf(x)} ({x.role})</option>)}</Select>}<div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button disabled={!u || !canList} onClick={() => onSave(u)}>Assign</Button></div></div></Modal>);
}
function StatusDialog({ open, id, current, onClose, onSaved }) {
    const f = useForm({ status: current, completionNotes: '', cancellationReason: '' }, v => ({ status: '', completionNotes: maxLen(v.completionNotes, 1000, 'Notes'), cancellationReason: ['CANCELLED', 'REJECTED'].includes(v.status) && !v.cancellationReason.trim() ? 'A reason is required' : maxLen(v.cancellationReason, 1000, 'Reason') }));
    useEffect(() => { if (open)
        f.reset({ status: current, completionNotes: '', cancellationReason: '' }); }, [open, current]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { await serviceApi.requests.setStatus(id, { status: v.status, completionNotes: v.completionNotes.trim() || undefined, cancellationReason: v.cancellationReason.trim() || undefined }); onSaved(); onClose(); }); };
    const v = f.values;
    return (<Modal open={open} onClose={onClose} title="Update status"><form onSubmit={go} noValidate className="space-y-4">{f.formError && <Alert kind="error">{f.formError}</Alert>}
    <Select label="Status" value={v.status} onChange={f.onChange('status')}>{SERVICE_REQUEST_STATUSES.map(s => <option key={s} value={s}>{labelOf(s)}</option>)}</Select>
    {v.status === 'COMPLETED' && <Textarea label="Completion notes" rows={2} value={v.completionNotes} onChange={f.onChange('completionNotes')} error={f.errors.completionNotes}/>}
    {['CANCELLED', 'REJECTED'].includes(v.status) && <Textarea label="Reason" rows={2} value={v.cancellationReason} onChange={f.onChange('cancellationReason')} error={f.errors.cancellationReason}/>}
    <div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Update</Button></div></form></Modal>);
}
