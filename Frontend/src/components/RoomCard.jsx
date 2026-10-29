import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { SmartImage } from './ui';
import { formatCurrency } from '../utils/formatCurrency';
import { imageUrl } from '../utils/entity';
/** Public showcase card for an actual available Room document from GET /rooms/available. */
export default function RoomCard({ room }) {
  const type = typeof room?.roomType === 'object' ? room.roomType : null;
  const image = imageUrl(room?.image);
  const price = Number(room?.price ?? type?.basePrice ?? 0);
  return <article className="group glass overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:border-gold/40">
    <div className="relative aspect-[4/3] overflow-hidden bg-wash/[0.04]">{image ? <SmartImage src={image} alt={`Room ${room.roomNumber}`} className="transition duration-700 ease-out group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-sm text-muted">Room image not uploaded</div>}<span className="absolute left-3 top-3 rounded-full border border-emerald-400/30 bg-black/75 px-3 py-1 text-xs text-emerald-300">Available</span></div>
    <div className="p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl">Room {room.roomNumber}</h3><p className="mt-1 text-sm text-mist">{type?.name ?? 'Room'}{room.floor !== undefined ? ` · Floor ${room.floor}` : ''}</p></div><p className="shrink-0 text-right text-xs text-mist">per night<br/><span className="font-serif text-xl text-gold-ink">{formatCurrency(price)}</span></p></div>
    {type?.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mist">{type.description}</p>}<div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted"><span className="flex items-center gap-1"><Users size={13}/>Up to {type?.capacity ?? '—'} guests</span>{(type?.amenities ?? []).slice(0,3).map(a => <span key={a}>{a}</span>)}</div><Link to={`/reserve?type=${encodeURIComponent(type?._id ?? '')}`} className="btn-outline mt-5 !py-2">Reserve this room</Link></div>
  </article>;
}
