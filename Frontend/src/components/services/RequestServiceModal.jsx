import { useEffect } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { Input, Select, Textarea } from '../Field';
import { Button } from '../ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../common/Toast';
import { reservationApi, serviceApi } from '../../services';
import { formatCurrency } from '../../utils/formatCurrency';
import { intRange, maxLen } from '../../utils/validators';
import { roomNo } from '../../utils/entity';
/** Guest requests a service for a current stay: POST /services/requests {reservation, service, quantity, scheduledFor, specialInstructions}. */
export default function RequestServiceModal({ open, service, onClose, onDone }) {
    const toast = useToast();
    const stays = useFetch(async () => (await reservationApi.mine()).filter(r => ['CONFIRMED', 'CHECKED_IN'].includes(r.status)), [open], open);
    const services = useFetch(() => serviceApi.active(), [open], open && !service);
    const f = useForm({ reservation: '', service: service?._id ?? '', quantity: '1', scheduledFor: '', specialInstructions: '' }, v => ({ reservation: v.reservation ? '' : 'Choose your stay', service: v.service ? '' : 'Choose a service', quantity: intRange(v.quantity, 1, 50, 'Quantity'), scheduledFor: v.scheduledFor && new Date(v.scheduledFor) < new Date() ? 'Choose a time in the future' : '', specialInstructions: maxLen(v.specialInstructions, 1000, 'Instructions') }));
    useEffect(() => { if (open)
        f.reset({ reservation: '', service: service?._id ?? '', quantity: '1', scheduledFor: '', specialInstructions: '' }); }, [open, service?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (open && stays.data?.length === 1)
        f.set('reservation', stays.data[0]._id); }, [open, stays.data]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { await serviceApi.requests.create({ reservation: v.reservation, service: v.service, quantity: Number(v.quantity), scheduledFor: v.scheduledFor ? new Date(v.scheduledFor).toISOString() : undefined, specialInstructions: v.specialInstructions.trim() || undefined }); toast.success('Request sent. Our team will confirm shortly.'); onDone(); onClose(); }); };
    const v = f.values;
    return (<Modal open={open} onClose={onClose} title={service ? `Request: ${service.name}` : 'Request a service'}>
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        {!stays.loading && !stays.data?.length && <div className="sm:col-span-2"><Alert kind="info">Services can be requested once you have a confirmed or current stay.</Alert></div>}
        <div className="sm:col-span-2"><Select label="Your stay" required value={v.reservation} onChange={f.onChange('reservation')} error={f.errors.reservation}><option value="">Select…</option>{stays.data?.map(r => <option key={r._id} value={r._id}>{r.bookingId}{r.room ? ` · Room ${roomNo(r.room)}` : ''}</option>)}</Select></div>
        {!service && <div className="sm:col-span-2"><Select label="Service" required value={v.service} onChange={f.onChange('service')} error={f.errors.service}><option value="">Select…</option>{services.data?.map(s => <option key={s._id} value={s._id}>{s.name} — {formatCurrency(s.price)}</option>)}</Select></div>}
        <Input label="Quantity" type="number" min={1} max={50} value={v.quantity} onChange={f.onChange('quantity')} error={f.errors.quantity}/>
        <Input label="When (optional)" type="datetime-local" value={v.scheduledFor} onChange={f.onChange('scheduledFor')} error={f.errors.scheduledFor}/>
        <div className="sm:col-span-2"><Textarea label="Special instructions" rows={2} maxLength={1000} value={v.specialInstructions} onChange={f.onChange('specialInstructions')} error={f.errors.specialInstructions}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Send request</Button></div>
      </form>
    </Modal>);
}
