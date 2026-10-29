import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Logo } from './Navbar';
import { useFetch } from '../../hooks/useFetch';
import { publicApi } from '../../services';
import { useAuth } from '../../hooks/useAuth';
/** Contact details come from the hotel settings (GET /public/hotel); sensible defaults show until they load. */
export default function Footer() {
    const { user } = useAuth();
    const { data: h } = useFetch(() => publicApi.hotel(), []);
    const address = [h?.address, h?.city, h?.country].filter(Boolean).join(', ') || 'Karachi, Pakistan';
    const a = 'transition-colors hover:text-gold-ink';
    return (<footer className="border-t border-wash/[0.06] bg-ink-1">
      <div className="mx-auto grid max-w-shell gap-10 px-5 py-14 md:grid-cols-2 md:px-8 lg:grid-cols-4">
        <div className="lg:col-span-2"><Logo /><p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">{h?.hotelDescription || 'Exceptional stays. Beautifully remembered. A quiet standard of luxury hospitality.'}</p></div>
        <div><p className="eyebrow">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-mist">
            <li><Link className={a} to="/rooms">Rooms & Suites</Link></li><li><Link className={a} to="/gallery">Gallery</Link></li><li><Link className={a} to="/about">About</Link></li><li><Link className={a} to="/contact">Contact</Link></li>
            {user ? <li><Link className={a} to="/portal">My dashboard</Link></li> : <><li><Link className={a} to="/login">Login</Link></li><li><Link className={a} to="/register">Register</Link></li></>}
          </ul></div>
        <div><p className="eyebrow">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-mist">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-gold-ink"/>{address}</li>
            {h?.phone && <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-gold-ink"/><a className={a} href={`tel:${h.phone.replace(/\s/g, '')}`}>{h.phone}</a></li>}
            {h?.email && <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-gold-ink"/><a className={`${a} break-all`} href={`mailto:${h.email}`}>{h.email}</a></li>}
            {h?.checkInTime && <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-gold-ink"/>Check-in {h.checkInTime} · Check-out {h.checkOutTime}</li>}
          </ul></div>
      </div>
      <div className="border-t border-wash/[0.06] px-5 py-6 text-center text-xs text-muted">© {new Date().getFullYear()} {h?.hotelName || 'LuxuryStay'} Hospitality. All rights reserved.</div>
    </footer>);
}
