import { NavLink, Link } from 'react-router-dom';
import { navFor } from '../../utils/permissions';
/** Role-aware navigation. `compact` collapses to icons on tablet widths. */
export default function Sidebar({ role, compact }) {
    return (<nav aria-label="Portal" className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <Link to="/" className={`mb-4 px-3 pt-2 font-serif text-lg ${compact ? 'md:hidden xl:block' : ''}`}>Luxury<span className="italic text-gold-ink">Stay</span></Link>
      {navFor(role).map(({ to, label, icon: I }) => (<NavLink key={to} to={to} end={to === '/portal'} title={label} aria-label={label} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-gold/10 font-medium text-cream ring-1 ring-gold/40 dark:[&_svg]:text-gold' : 'text-mist hover:bg-wash/5 hover:text-cream'}`}>
          <I size={18} className="shrink-0"/><span className={compact ? 'md:hidden xl:inline' : ''}>{label}</span>
        </NavLink>))}
    </nav>);
}
