import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, SmartImage, Skeleton } from '../../components/ui';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';
import { Toolbar } from '../../components/common/Toolbar';
import { Input } from '../../components/Field';
import { useFetch } from '../../hooks/useFetch';
import { roomApi } from '../../services/roomApi';
import { imageUrl, pick, roomLabel, uid } from '../../utils/entity';
import { nightsBetween, todayISO } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
export default function Availability() {
    const [d, setD] = useState({ in: todayISO(), out: new Date(Date.now() + 864e5).toISOString().slice(0, 10), guests: '2' });
    const ok = d.out > d.in;
    const { data, loading, error, reload } = useFetch(() => ok ? roomApi.available({ checkIn: d.in, checkOut: d.out, guests: d.guests }) : Promise.resolve([]), [d.in, d.out, d.guests]);
    return (<>
    <Toolbar><div className="grid w-full gap-4 sm:max-w-2xl sm:grid-cols-3">
      <Input label="Check-in" type="date" min={todayISO()} value={d.in} onChange={e => setD({ ...d, in: e.target.value })}/>
      <Input label="Check-out" type="date" min={d.in} value={d.out} onChange={e => setD({ ...d, out: e.target.value })} error={ok ? undefined : 'Must be after check-in'}/>
      <Input label="Guests" type="number" min={1} value={d.guests} onChange={e => setD({ ...d, guests: e.target.value })}/></div></Toolbar>
    {error ? <ErrorState onRetry={reload} message={error}/> : (<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{loading ? [0, 1, 2].map(n => <Skeleton key={n} 
    className="h-64"/>) : (data ?? []).map(r => (<GlassCard key={uid(r)} className="overflow-hidden"><div className="aspect-[16/9]"><SmartImage 
    src={imageUrl(pick(r, 'images.0', 'image', 'roomType.images.0')) || '/images/deluxe.jpg'} alt={roomLabel(r)}/></div>
          <div className="p-5"><h3 className="text-xl">{roomLabel(r)}</h3><p className="mt-1 text-sm text-mist">
            {formatCurrency(pick(r, 'price', 'pricePerNight', 'roomType.basePrice', 'roomType.price'))} / night · {nightsBetween(d.in, d.out)} night(s)</p>
            <Link to={`/portal/reservations/new?room=${uid(r)}&in=${d.in}&out=${d.out}`} className="btn-outline mt-4 w-full">Book this room</Link></div></GlassCard>))}</div>)}
    {!loading && !error && ok && !data?.length && <GlassCard><EmptyState title="No rooms available for these dates" text="Rooms that are already reserved, under maintenance, 
    or being cleaned for today cannot be booked for this date range. Try different dates or select another room."/></GlassCard>}
  </>);
}
