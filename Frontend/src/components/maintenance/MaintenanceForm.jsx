import { useEffect } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { Input, Select, Textarea } from '../Field';
import { Button } from '../ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../common/Toast';
import { maintenanceApi, reservationApi, roomApi } from '../../services';
import { MAINTENANCE_CATEGORIES, PRIORITIES, labelOf } from '../../utils/constants';
import { toInputDate } from '../../utils/formatDate';
import { idOf, roomNo } from '../../utils/entity';
import { maxLen, moneyRule } from '../../utils/validators';
/**
 * Three modes:
 *  - staff  → POST /maintenance      (choose any room)
 *  - guest  → POST /my/maintenance   (choose own checked-in stay; room comes from the stay)
 *  - edit   → PUT  /maintenance/:id  (Admin/Manager)
 */
export default function MaintenanceForm({ open, mode, request, defaultRoom, onClose, onSaved }) {
    const toast = useToast();
    const rooms = useFetch(() => roomApi.list({ isActive: 'true' }), [open], open && mode === 'staff');
    const stays = useFetch(async () => (await reservationApi.mine()).filter(r => r.status === 'CHECKED_IN'), [open], open && mode === 'guest');
    const init = () => ({ room: idOf(request?.room) || defaultRoom || '', reservation: '', title: request?.title ?? '', description: request?.description ?? '', category: request?.category ?? 'OTHER', priority: request?.priority ?? 'MEDIUM', estimatedCost: request?.estimatedCost != null ? String(request.estimatedCost) : '', scheduledDate: toInputDate(request?.scheduledDate) });
    const f = useForm(init(), v => ({ room: mode === 'staff' && !v.room ? 'Choose a room' : '', reservation: mode === 'guest' && !v.reservation ? 'Choose your stay' : '', title: !v.title.trim() ? 'Title is required' : v.title.length > 200 ? 'Title must be 200 characters or fewer' : '', description: !v.description.trim() ? 'Please describe the problem' : maxLen(v.description, 2000, 'Description'), estimatedCost: moneyRule(v.estimatedCost, 'Estimated cost', 0, false), scheduledDate: '' }));
    useEffect(() => { if (open)
        f.reset(init()); }, [open, request?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => {
        e.preventDefault();
        f.submit(async (v) => {
            const base = { title: v.title.trim(), description: v.description.trim(), category: v.category, priority: v.priority };
            if (mode !== 'guest') {
                if (v.estimatedCost !== '')
                    base.estimatedCost = Number(v.estimatedCost);
                if (v.scheduledDate)
                    base.scheduledDate = v.scheduledDate;
            }
            if (mode === 'edit')
                await maintenanceApi.update(request._id, base);
            else if (mode === 'staff')
                await maintenanceApi.create({ ...base, room: v.room });
            else
                await maintenanceApi.report({ ...base, reservation: v.reservation });
            toast.success(mode === 'edit' ? 'Request updated' : mode === 'guest' ? 'Thank you - we will look into it right away' : 'Request created');
            onSaved();
            onClose();
        });
    };
    const v = f.values, er = f.errors;
    return (<Modal open={open} onClose={onClose} title={mode === 'edit' ? 'Edit request' : mode === 'guest' ? 'Report an issue' : 'New maintenance request'}>
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        {mode === 'staff' && <div className="sm:col-span-2"><Select label="Room" required value={v.room} onChange={f.onChange('room')} onBlur={f.onBlur('room')} error={er.room}><option value="">{rooms.loading ? 'Loading…' : 'Select a room'}</option>{rooms.data?.map(r => <option key={r._id} value={r._id}>Room {r.roomNumber} · floor {r.floor}</option>)}</Select></div>}
        {mode === 'guest' && <div className="sm:col-span-2"><Select label="Your stay" required value={v.reservation} onChange={f.onChange('reservation')} error={er.reservation} hint={!stays.loading && !stays.data?.length ? 'Issues can be reported while you are checked in.' : undefined}><option value="">Select…</option>{stays.data?.map(r => <option key={r._id} value={r._id}>Room {roomNo(r.room)} · {r.bookingId}</option>)}</Select></div>}
        <div className="sm:col-span-2"><Input label="Title" required maxLength={200} value={v.title} onChange={f.onChange('title')} onBlur={f.onBlur('title')} error={er.title} placeholder="e.g. Air conditioner not cooling"/></div>
        <div className="sm:col-span-2"><Textarea label="Description" required rows={3} maxLength={2000} value={v.description} onChange={f.onChange('description')} onBlur={f.onBlur('description')} error={er.description}/></div>
        <Select label="Category" value={v.category} onChange={f.onChange('category')}>{MAINTENANCE_CATEGORIES.map(c => <option key={c} value={c}>{labelOf(c)}</option>)}</Select>
        <Select label="Priority" value={v.priority} onChange={f.onChange('priority')}>{PRIORITIES.map(c => <option key={c} value={c}>{labelOf(c)}</option>)}</Select>
        {mode !== 'guest' && <><Input label="Estimated cost" type="number" min={0} step="any" value={v.estimatedCost} onChange={f.onChange('estimatedCost')} error={er.estimatedCost}/><Input label="Scheduled date" type="date" value={v.scheduledDate} onChange={f.onChange('scheduledDate')}/></>}
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>{mode === 'edit' ? 'Save changes' : 'Submit'}</Button></div>
      </form>
    </Modal>);
}
