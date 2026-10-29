import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, BedDouble } from 'lucide-react';
import { Button } from './ui';
import { useFetch } from '../hooks/useFetch';
import { publicApi } from '../services';
import { addDaysISO, todayISO } from '../utils/formatDate';
/** Home-page search bar. Room types come from GET /public/room-types. Submitting opens the booking page with the choices filled in. */
export default function BookingWidget() {
    const nav = useNavigate();
    const types = useFetch(() => publicApi.roomTypes(), []);
    const today = todayISO();
    const [v, setV] = useState({ in: '', out: '', guests: '2', type: '' });
    const [err, setErr] = useState('');
    const set = (k) => (e) => setV(p => ({ ...p, [k]: e.target.value, ...(k === 'in' && p.out <= e.target.value ? { out: addDaysISO(e.target.value, 1) } : {}) }));
    const submit = (e) => {
        e.preventDefault();
        if (!v.in || !v.out)
            return setErr('Please choose check-in and check-out dates.');
        if (v.in < today)
            return setErr('Check-in cannot be in the past.');
        if (v.out <= v.in)
            return setErr('Check-out must be after check-in.');
        setErr('');
        nav(`/reserve?in=${v.in}&out=${v.out}&guests=${v.guests}${v.type ? `&type=${v.type}` : ''}`);
    };
    const Cell = ({ icon: I, label, children }) => (<label className="block"><span className="label flex items-center gap-1.5"><I size={13} className="text-gold-ink"/>{label}</span>{children}</label>);
    return (<form onSubmit={submit} noValidate className="glass-strong rounded-2xl p-4 shadow-2xl shadow-black/40 md:p-5" aria-label="Check availability">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_.7fr_1.2fr_auto] lg:items-end">
        <Cell icon={CalendarDays} label="Check-in"><input type="date" min={today} className="field !h-12" value={v.in} onChange={set('in')}/></Cell>
        <Cell icon={CalendarDays} label="Check-out"><input type="date" min={v.in ? addDaysISO(v.in, 1) : today} className="field !h-12" value={v.out} onChange={set('out')}/></Cell>
        <Cell icon={Users} label="Guests"><select className="field !h-12" value={v.guests} onChange={set('guests')}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n}>{n}</option>)}</select></Cell>
        <Cell icon={BedDouble} label="Room type"><select className="field !h-12" value={v.type} onChange={set('type')}><option value="">Any room</option>{types.data?.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select></Cell>
        <Button type="submit" className="w-full sm:col-span-2 lg:col-span-1">Check Availability</Button>
      </div>
      {err && <p role="alert" className="mt-3 text-sm text-red-300">{err}</p>}
    </form>);
}
