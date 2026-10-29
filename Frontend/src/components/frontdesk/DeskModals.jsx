import { useEffect } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { Input, Select, Textarea } from '../Field';
import { Button } from '../ui';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../common/Toast';
import { frontDeskApi } from '../../services';
import { KEY_TYPES, labelOf } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
import { maxLen } from '../../utils/validators';
const ID_TYPES = ['Passport', 'National ID card', 'Driver licence', 'Other'];
const CI0 = { identityVerified: false, identityDocumentType: '', identityDocumentNumber: '', keyIssued: true, keyType: 'CARD', keyNumber: '', checkInNotes: '' };
const ciValidate = (v) => ({
    identityVerified: v.identityVerified ? '' : 'Confirm that you have verified the guest’s ID', identityDocumentType: v.identityDocumentType ? '' : 'Select the document type',
    identityDocumentNumber: !v.identityDocumentNumber.trim() ? 'Document number is required' : v.identityDocumentNumber.length > 100 ? 'Too long' : !/^[A-Za-z0-9][A-Za-z0-9\s./-]{2,}$/.test(v.identityDocumentNumber.trim()) ? 'Enter a valid document number' : '',
    keyType: v.keyIssued && !v.keyType ? 'Select the key type' : '', keyNumber: maxLen(v.keyNumber, 100, 'Key number'), checkInNotes: maxLen(v.checkInNotes, 1000, 'Notes'),
});
/** POST /check-in-out/:reservationId/check-in */
export function CheckInModal({ r, onClose, onDone }) {
    const toast = useToast();
    const f = useForm(CI0, ciValidate);
    const v = f.values, e = f.errors;
    useEffect(() => { if (r)
        f.reset(CI0); }, [r?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (ev) => {
        ev.preventDefault();
        f.submit(async (x) => {
            await frontDeskApi.checkIn(r._id, { identityVerified: x.identityVerified, identityDocumentType: x.identityDocumentType, identityDocumentNumber: x.identityDocumentNumber.trim(), keyIssued: x.keyIssued, ...(x.keyIssued ? { keyType: x.keyType, keyNumber: x.keyNumber.trim() } : {}), checkInNotes: x.checkInNotes.trim() });
            toast.success(`${nameOf(r.guest)} checked in to room ${roomNo(r.room)}`);
            onDone();
            onClose();
        });
    };
    return (<Modal open={!!r} onClose={onClose} title="Check in guest">
      {r && <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 rounded-xl border border-wash/10 p-3 text-sm"><p className="font-medium">{nameOf(r.guest)} · Room {roomNo(r.room)}</p><p className="text-xs text-muted">{r.bookingId} · {formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)}</p></div>
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        <Select label="ID document" required value={v.identityDocumentType} onChange={f.onChange('identityDocumentType')} onBlur={f.onBlur('identityDocumentType')} error={e.identityDocumentType}><option value="">Select…</option>{ID_TYPES.map(t => <option key={t}>{t}</option>)}</Select>
        <Input label="Document number" required maxLength={100} value={v.identityDocumentNumber} onChange={f.onChange('identityDocumentNumber')} onBlur={f.onBlur('identityDocumentNumber')} error={e.identityDocumentNumber}/>
        <div className="sm:col-span-2"><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--gold))]" checked={v.identityVerified} onChange={f.onChange('identityVerified')}/>I have verified the guest’s identity</label>{e.identityVerified && <p role="alert" className="mt-1 text-xs text-red-500">{e.identityVerified}</p>}</div>
        <div className="sm:col-span-2"><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--gold))]" checked={v.keyIssued} onChange={f.onChange('keyIssued')}/>Room key issued</label></div>
        {v.keyIssued && <><Select label="Key type" value={v.keyType} onChange={f.onChange('keyType')} error={e.keyType}>{KEY_TYPES.map(k => <option key={k} value={k}>{labelOf(k)}</option>)}</Select><Input label="Key number" maxLength={100} value={v.keyNumber} onChange={f.onChange('keyNumber')} error={e.keyNumber}/></>}
        <div className="sm:col-span-2"><Textarea label="Notes" rows={2} maxLength={1000} value={v.checkInNotes} onChange={f.onChange('checkInNotes')} error={e.checkInNotes}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Check in</Button></div>
      </form>}
    </Modal>);
}
/** POST /check-in-out/:reservationId/check-out */
export function CheckOutModal({ r, onClose, onDone }) {
    const toast = useToast();
    const f = useForm({ keyReturned: true, checkOutNotes: '' }, v => ({ keyReturned: '', checkOutNotes: maxLen(v.checkOutNotes, 1000, 'Notes') }));
    useEffect(() => { if (r)
        f.reset({ keyReturned: true, checkOutNotes: '' }); }, [r?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (ev) => { ev.preventDefault(); f.submit(async (x) => { await frontDeskApi.checkOut(r._id, { keyReturned: x.keyReturned, checkOutNotes: x.checkOutNotes.trim() }); toast.success('Guest checked out. The room is now marked for cleaning.'); onDone(r); onClose(); }); };
    return (<Modal open={!!r} onClose={onClose} title="Check out guest">
      {r && <form onSubmit={go} noValidate className="space-y-4">
        <div className="rounded-xl border border-wash/10 p-3 text-sm"><p className="font-medium">{nameOf(r.guest)} · Room {roomNo(r.room)}</p><p className="text-xs text-muted">{r.bookingId} · until {formatDate(r.checkOutDate)}</p></div>
        {f.formError && <Alert kind="error">{f.formError}</Alert>}
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--gold))]" checked={f.values.keyReturned} onChange={f.onChange('keyReturned')}/>Room key returned</label>
        <Textarea label="Notes" rows={2} maxLength={1000} value={f.values.checkOutNotes} onChange={f.onChange('checkOutNotes')} error={f.errors.checkOutNotes}/>
        <p className="text-xs text-muted">Next: create the bill from the reservation page and record the guest’s payment.</p>
        <div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Check out</Button></div>
      </form>}
    </Modal>);
}
