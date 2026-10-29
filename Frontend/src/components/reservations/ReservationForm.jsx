import { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Input, Select, Textarea } from '../Field';
import { Button } from '../ui';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import { useForm } from '../../hooks/useForm';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../common/Toast';
import { guestApi, reservationApi, roomApi, settingsApi } from '../../services';
import { addDaysISO, nightsBetween, todayISO } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { emailRule, intRange, moneyRule, nameRule, phoneRule, maxLen } from '../../utils/validators';
import { nameOf, rateOf } from '../../utils/entity';
const validate = (capacity, source) => (v) => {
    const e = { guest: v.guest ? '' : 'Choose a guest', roomType: v.roomType ? '' : 'Choose a room type', room: v.room ? '' : 'Choose an available room' };
    e.checkInDate = !v.checkInDate ? 'Check-in date is required' : v.checkInDate < todayISO() ? 'Check-in cannot be in the past' : source === 'WALK_IN' && v.checkInDate !== todayISO() ? 'Walk-ins check in today' : '';
    e.checkOutDate = !v.checkOutDate ? 'Check-out date is required' : v.checkOutDate <= v.checkInDate ? 'Check-out must be after check-in' : '';
    e.adults = intRange(v.adults, 1, 20, 'Adults');
    e.children = intRange(v.children, 0, 20, 'Children');
    if (!e.adults && !e.children && capacity && Number(v.adults) + Number(v.children) > capacity)
        e.adults = `This room type sleeps up to ${capacity} guests`;
    e.roomRate = moneyRule(v.roomRate, 'Room rate', 0);
    e.tax = moneyRule(v.tax, 'Tax', 0);
    e.discount = moneyRule(v.discount, 'Discount', 0);
    e.specialRequests = maxLen(v.specialRequests, 1000, 'Special requests');
    return e;
};
export default function ReservationForm({ source = 'STAFF', onCreated }) {
    const toast = useToast();
    const guests = useFetch(() => guestApi.active(), []);
    const types = useFetch(() => roomApi.types.active(), []);
    const settings = useFetch(() => settingsApi.get().catch(() => null), []);
    const [typeCap, setTypeCap] = useState(0);
    const f = useForm({ guest: '', roomType: '', room: '', checkInDate: todayISO(), checkOutDate: addDaysISO(todayISO(), 1), adults: '1', children: '0', roomRate: '', tax: '0', discount: '0', specialRequests: '' }, v => validate(typeCap, source)(v));
    const v = f.values;
    const [rooms, setRooms] = useState([]);
    const [checking, setChecking] = useState(false);
    const [availErr, setAvailErr] = useState('');
    const [quick, setQuick] = useState(false);
    // Re-check availability whenever type or dates change.
    useEffect(() => {
        setRooms([]);
        setAvailErr('');
        f.set('room', '');
        if (!v.roomType || !v.checkInDate || !v.checkOutDate || v.checkOutDate <= v.checkInDate)
            return;
        let alive = true;
        setChecking(true);
        reservationApi.availability({ roomType: v.roomType, checkInDate: v.checkInDate, checkOutDate: v.checkOutDate })
            .then(r => { if (!alive)
            return; setRooms(r); if (r[0]) {
            f.set('room', r[0]._id);
            f.set('roomRate', String(rateOf({ ...r[0], roomType: types.data?.find(t => t._id === v.roomType) })));
        } })
            .catch(e => alive && setAvailErr(e.message)).finally(() => alive && setChecking(false));
        return () => { alive = false; };
    }, [v.roomType, v.checkInDate, v.checkOutDate]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { setTypeCap(Number(types.data?.find(t => t._id === v.roomType)?.capacity ?? 0)); }, [v.roomType, types.data]);
    const nights = nightsBetween(v.checkInDate, v.checkOutDate);
    const base = nights * (Number(v.roomRate) || 0);
    const suggestedTax = useMemo(() => { const s = settings.data; if (!s)
        return 0; const pct = (s.taxEnabled ? Number(s.taxPercentage) || 0 : 0) + (s.serviceChargeEnabled ? Number(s.serviceChargePercentage) || 0 : 0); return Math.round(base * pct) / 100; }, [settings.data, base]);
    const total = base + (Number(v.tax) || 0) - (Number(v.discount) || 0);
    const submit = (e) => {
        e.preventDefault();
        f.submit(async (val) => {
            const r = await reservationApi.create({ guest: val.guest, roomType: val.roomType, room: val.room, checkInDate: val.checkInDate, checkOutDate: val.checkOutDate, adults: Number(val.adults), children: Number(val.children), roomRate: Number(val.roomRate), tax: Number(val.tax), discount: Number(val.discount), bookingSource: source, specialRequests: val.specialRequests.trim() || undefined });
            toast.success('Reservation created');
            await onCreated(r);
        });
    };
    return (<form onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
          {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
          <div className="sm:col-span-2"><div className="flex items-end gap-2"><div className="flex-1"><Select label="Guest" required value={v.guest} onChange={f.onChange('guest')} onBlur={f.onBlur('guest')} error={f.errors.guest}><option value="">{guests.loading ? 'Loading guests…' : 'Select a guest'}</option>{guests.data?.map(g => <option key={g._id} value={g._id}>{nameOf(g)} — {g.email}</option>)}</Select></div>
            <Button variant="glass" onClick={() => setQuick(true)} className="!px-4"><UserPlus size={16}/> New</Button></div>
            {guests.error && <p className="mt-1 text-xs text-red-500">{guests.error}</p>}</div>
          <Select label="Room type" required value={v.roomType} onChange={f.onChange('roomType')} onBlur={f.onBlur('roomType')} error={f.errors.roomType}><option value="">{types.loading ? 'Loading…' : 'Select a type'}</option>{types.data?.map(t => <option key={t._id} value={t._id}>{t.name} — {formatCurrency(t.basePrice)} / night</option>)}</Select>
          <Select label="Room" required value={v.room} onChange={e => { f.onChange('room')(e); const r = rooms.find(x => x._id === e.target.value); if (r)
        f.set('roomRate', String(rateOf({ ...r, roomType: types.data?.find(t => t._id === v.roomType) }))); }} error={f.errors.room} hint={checking ? 'Checking availability…' : v.roomType && !rooms.length && !availErr ? 'No rooms free for these dates' : undefined}>
            <option value="">{rooms.length ? 'Select a room' : '—'}</option>{rooms.map(r => <option key={r._id} value={r._id}>Room {r.roomNumber} (floor {r.floor})</option>)}</Select>
          <Input label="Check-in" type="date" required min={todayISO()} value={v.checkInDate} onChange={e => { f.onChange('checkInDate')(e); if (v.checkOutDate <= e.target.value)
        f.set('checkOutDate', addDaysISO(e.target.value, 1)); }} onBlur={f.onBlur('checkInDate')} error={f.errors.checkInDate}/>
          <Input label="Check-out" type="date" required min={addDaysISO(v.checkInDate || todayISO(), 1)} value={v.checkOutDate} onChange={f.onChange('checkOutDate')} onBlur={f.onBlur('checkOutDate')} error={f.errors.checkOutDate}/>
          <Input label="Adults" type="number" min={1} max={20} required value={v.adults} onChange={f.onChange('adults')} onBlur={f.onBlur('adults')} error={f.errors.adults}/>
          <Input label="Children" type="number" min={0} max={20} value={v.children} onChange={f.onChange('children')} onBlur={f.onBlur('children')} error={f.errors.children}/>
          {availErr && <div className="sm:col-span-2"><Alert kind="error">{availErr}</Alert></div>}
          <div className="sm:col-span-2"><Textarea label="Special requests" rows={3} maxLength={1000} value={v.specialRequests} onChange={f.onChange('specialRequests')} error={f.errors.specialRequests}/></div>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="glass space-y-4 rounded-2xl p-5">
          <h2 className="font-serif text-xl">Charges</h2>
          <Input label="Room rate / night" type="number" min={0} step="any" value={v.roomRate} onChange={f.onChange('roomRate')} onBlur={f.onBlur('roomRate')} error={f.errors.roomRate}/>
          <Input label="Tax & service charge" type="number" min={0} step="any" value={v.tax} onChange={f.onChange('tax')} error={f.errors.tax} hint={suggestedTax ? `Settings suggest ${formatCurrency(suggestedTax, 2)}` : undefined}/>
          {suggestedTax > 0 && Number(v.tax) !== suggestedTax && <button type="button" className="-mt-2 text-xs text-gold-ink hover:underline" onClick={() => f.set('tax', String(suggestedTax))}>Use suggested tax</button>}
          <Input label="Discount" type="number" min={0} step="any" value={v.discount} onChange={f.onChange('discount')} error={f.errors.discount}/>
          <dl className="space-y-1.5 border-t border-wash/10 pt-4 text-sm"><div className="flex justify-between text-mist"><dt>{nights} night{nights === 1 ? '' : 's'} × {formatCurrency(Number(v.roomRate) || 0)}</dt><dd>{formatCurrency(base)}</dd></div><div className="flex justify-between font-serif text-xl"><dt>Total</dt><dd>{formatCurrency(Math.max(0, total))}</dd></div></dl>
          <Button type="submit" loading={f.submitting} className="w-full">{source === 'WALK_IN' ? 'Create & continue' : 'Create reservation'}</Button>
        </div>
      </aside>
      <QuickGuest open={quick} onClose={() => setQuick(false)} onCreated={g => { guests.reload(); f.set('guest', g._id); setQuick(false); }}/>
    </form>);
}
/** Minimal guest creation (POST /guests) so the desk can book without leaving the form. */
function QuickGuest({ open, onClose, onCreated }) {
    const toast = useToast();
    const f = useForm({ firstName: '', lastName: '', email: '', phone: '' }, v => ({ firstName: nameRule(v.firstName, 'First name'), lastName: nameRule(v.lastName, 'Last name'), email: emailRule(v.email), phone: phoneRule(v.phone) }));
    const go = (e) => { e.preventDefault(); e.stopPropagation(); f.submit(async (v) => { const g = await guestApi.create({ firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim().toLowerCase(), phone: v.phone.trim() }); toast.success('Guest created'); f.reset(); onCreated(g); }); };
    return (<Modal open={open} onClose={onClose} title="New guest">
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        <Input label="First name" required value={f.values.firstName} onChange={f.onChange('firstName')} onBlur={f.onBlur('firstName')} error={f.errors.firstName}/>
        <Input label="Last name" required value={f.values.lastName} onChange={f.onChange('lastName')} onBlur={f.onBlur('lastName')} error={f.errors.lastName}/>
        <Input label="Email" type="email" required value={f.values.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} error={f.errors.email}/>
        <Input label="Phone" type="tel" required value={f.values.phone} onChange={f.onChange('phone')} onBlur={f.onBlur('phone')} error={f.errors.phone}/>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Create guest</Button></div>
      </form>
    </Modal>);
}
