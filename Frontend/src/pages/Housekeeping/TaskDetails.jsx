import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { Detail, DetailGrid, Panel } from '../../components/common/Detail';
import TaskForm from '../../components/housekeeping/TaskForm';
import Modal from '../../components/common/Modal';
import { Textarea } from '../../components/Field';
import { Button, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { housekeepingApi } from '../../services';
import { labelOf } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
import { ADMIN_MGR, can } from '../../utils/permissions';
import { maxLen } from '../../utils/validators';
/** GET /housekeeping/:id; PATCH /:id/status; PATCH /:id/inspection (Admin/Manager). */
export default function TaskDetails() {
    const { id = '' } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const manage = can(user?.role, ...ADMIN_MGR);
    const { data: t, loading, error, reload } = useFetch(() => housekeepingApi.get(id), [id]);
    const [edit, setEdit] = useState(false);
    const [note, setNote] = useState(null);
    const [busy, setBusy] = useState(false);
    if (error)
        return <><PageHeader back="/portal/housekeeping" title="Task"/><ErrorState onRetry={reload} message={error}/></>;
    if (loading || !t)
        return <><PageHeader back="/portal/housekeeping" title="Task"/><Skeleton className="h-56"/></>;
    const run = async (fn, ok) => { setBusy(true); try {
        await fn();
        toast.success(ok);
        setNote(null);
        reload();
    }
    catch (e) {
        toast.error(e.message);
    }
    finally {
        setBusy(false);
    } };
    const final = ['COMPLETED', 'CANCELLED'].includes(t.status);
    const submitNote = () => {
        if (!note)
            return;
        const text = note.text.trim();
        if (note.kind === 'complete')
            return run(() => housekeepingApi.setStatus(t._id, 'COMPLETED', text), 'Task completed');
        if (note.kind === 'cancel')
            return run(() => housekeepingApi.setStatus(t._id, 'CANCELLED', text), 'Task cancelled');
        return run(() => housekeepingApi.inspect(t._id, note.kind === 'inspect-pass', text), note.kind === 'inspect-pass' ? 'Inspection passed' : 'Inspection failed');
    };
    const err = note ? maxLen(note.text, 500, 'Notes') : '';
    return (<>
      <PageHeader back="/portal/housekeeping" title={`Room ${roomNo(t.room)} · ${labelOf(t.taskType)}`} sub={`Scheduled ${formatDate(t.scheduledDate)}`} actions={<><StatusBadge status={t.priority}/><StatusBadge status={t.status}/></>}/>
      <div className="mb-6 flex flex-wrap gap-2">
        {['PENDING', 'ASSIGNED'].includes(t.status) && <Button loading={busy} onClick={() => run(() => housekeepingApi.setStatus(t._id, 'IN_PROGRESS'), 'Task started')}>Start</Button>}
        {t.status === 'IN_PROGRESS' && <Button onClick={() => setNote({ kind: 'complete', text: '' })}>Mark complete</Button>}
        {manage && t.status === 'COMPLETED' && t.inspectionPassed == null && <><Button variant="outline" onClick={() => setNote({ kind: 'inspect-pass', text: '' })}>Inspection passed</Button><Button variant="danger" onClick={() => setNote({ kind: 'inspect-fail', text: '' })}>Inspection failed</Button></>}
        {manage && !final && <><Button variant="glass" onClick={() => setEdit(true)}>Edit / assign</Button><Button variant="danger" onClick={() => setNote({ kind: 'cancel', text: '' })}>Cancel task</Button></>}
      </div>
      <Panel title="Details"><DetailGrid>
        <Detail label="Room">{roomNo(t.room)} · floor {t.room?.floor}</Detail><Detail label="Assigned to">{t.assignedTo ? nameOf(t.assignedTo) : 'Unassigned'}</Detail>
        <Detail label="Notes">{t.notes}</Detail><Detail label="Completion notes">{t.completionNotes}</Detail>
        <Detail label="Started">{t.startedAt ? formatDateTime(t.startedAt) : ''}</Detail><Detail label="Completed">{t.completedAt ? formatDateTime(t.completedAt) : ''}</Detail>
        <Detail label="Inspection">{t.inspectionPassed == null ? '' : t.inspectionPassed ? 'Passed' : 'Failed'}</Detail>
      </DetailGrid></Panel>
      <TaskForm open={edit} task={t} onClose={() => setEdit(false)} onSaved={reload}/>
      <Modal open={!!note} onClose={() => setNote(null)} title={note?.kind === 'cancel' ? 'Cancel task' : note?.kind.startsWith('inspect') ? 'Inspection result' : 'Complete task'}>
        <div className="space-y-4"><Textarea label="Notes (optional)" rows={3} value={note?.text ?? ''} onChange={e => setNote(n => n && { ...n, text: e.target.value })} error={err}/><div className="flex justify-end gap-3"><Button variant="glass" onClick={() => setNote(null)}>Close</Button><Button variant={note?.kind === 'cancel' || note?.kind === 'inspect-fail' ? 'danger' : 'gold'} loading={busy} disabled={!!err} onClick={submitNote}>Confirm</Button></div></div>
      </Modal>
    </>);
}
