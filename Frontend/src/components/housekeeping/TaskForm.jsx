import { useEffect } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { Input, Select, Textarea } from '../Field';
import { Button } from '../ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../common/Toast';
import { housekeepingApi, roomApi, userApi } from '../../services';
import { PRIORITIES, TASK_TYPES, labelOf } from '../../utils/constants';
import { toInputDate, todayISO } from '../../utils/formatDate';
import { idOf, nameOf } from '../../utils/entity';
import { maxLen } from '../../utils/validators';
/** Create (POST /housekeeping) or edit (PUT /housekeeping/:id) a cleaning task. Admin / Manager only. */
export default function TaskForm({ open, task, defaultRoom, onClose, onSaved }) {
    const toast = useToast();
    const rooms = useFetch(() => roomApi.list({ isActive: 'true' }), [open], open && !task);
    const staff = useFetch(async () => (await userApi.list({ role: 'Housekeeping', isActive: 'true', limit: 100 })).items, [open], open);
    const init = () => ({ room: idOf(task?.room) || defaultRoom || '', taskType: task?.taskType ?? 'REGULAR_CLEANING', priority: task?.priority ?? 'MEDIUM', scheduledDate: toInputDate(task?.scheduledDate) || todayISO(), assignedTo: idOf(task?.assignedTo), notes: task?.notes ?? '' });
    const f = useForm(init(), v => ({ room: v.room ? '' : 'Choose a room', scheduledDate: !v.scheduledDate ? 'Date is required' : '', notes: maxLen(v.notes, 500, 'Notes') }));
    useEffect(() => { if (open)
        f.reset(init()); }, [open, task?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => {
        e.preventDefault();
        f.submit(async (v) => {
            const body = { taskType: v.taskType, priority: v.priority, scheduledDate: v.scheduledDate, notes: v.notes.trim() };
            if (v.assignedTo)
                body.assignedTo = v.assignedTo;
            task ? await housekeepingApi.update(task._id, body) : await housekeepingApi.create({ ...body, room: v.room });
            toast.success(task ? 'Task updated' : 'Task created');
            onSaved();
            onClose();
        });
    };
    return (<Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New housekeeping task'}>
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        {!task && <div className="sm:col-span-2"><Select label="Room" required value={f.values.room} onChange={f.onChange('room')} onBlur={f.onBlur('room')} error={f.errors.room}><option value="">{rooms.loading ? 'Loading…' : 'Select a room'}</option>{rooms.data?.map(r => <option key={r._id} value={r._id}>Room {r.roomNumber} · floor {r.floor}</option>)}</Select></div>}
        <Select label="Task type" value={f.values.taskType} onChange={f.onChange('taskType')}>{TASK_TYPES.map(t => <option key={t} value={t}>{labelOf(t)}</option>)}</Select>
        <Select label="Priority" value={f.values.priority} onChange={f.onChange('priority')}>{PRIORITIES.map(t => <option key={t} value={t}>{labelOf(t)}</option>)}</Select>
        <Input label="Scheduled date" type="date" required value={f.values.scheduledDate} onChange={f.onChange('scheduledDate')} error={f.errors.scheduledDate}/>
        <Select label="Assign to" value={f.values.assignedTo} onChange={f.onChange('assignedTo')}><option value="">Unassigned</option>{staff.data?.map(u => <option key={u._id} value={u._id}>{nameOf(u)}</option>)}</Select>
        <div className="sm:col-span-2"><Textarea label="Notes" rows={2} value={f.values.notes} onChange={f.onChange('notes')} error={f.errors.notes}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>{task ? 'Save changes' : 'Create task'}</Button></div>
      </form>
    </Modal>);
}
