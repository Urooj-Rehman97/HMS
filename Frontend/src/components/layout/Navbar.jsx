/**
 * Public site navbar.
 *   Logged OUT → "Login" + "Register" (+ Reserve call-to-action)
 *   Logged IN  → the user's NAME (menu with Dashboard / Profile / Logout) instead of "Login"
 * It reads `user` from AuthContext, which itself is restored from sessionStorage - so the name is
 * there right after a refresh, and Logout switches the bar back instantly with no reload.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, UserCircle, LogOut, Bell, CalendarDays } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../common/Toast';
import { ROLE_LABEL } from '../../utils/constants';
import { initialsOf } from '../../utils/entity';
/** Only pages that exist and matter to a guest. Home is the logo; Login/Register are on the right. */
const LINKS = [
    { label: 'Rooms & Suites', to: '/rooms' },
    { label: 'Experiences', to: '/#experiences' },
    { label: 'Dining', to: '/#dining' },
    { label: 'Gallery', to: '/gallery' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
];
export const Logo = () => (<Link to="/" className="shrink-0 font-serif text-xl tracking-wide sm:text-[22px]" aria-label="LuxuryStay home">Luxury<span className="italic text-gold-ink">Stay</span></Link>);
export default function Navbar() {
    const { user, logout } = useAuth();
    const { unread } = useNotifications();
    const toast = useToast();
    const navigate = useNavigate();
    const { pathname, hash } = useLocation();
    const [solid, setSolid] = useState(false);
    const [mobile, setMobile] = useState(false);
    const [menu, setMenu] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => { const f = () => setSolid(window.scrollY > 24); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
    useEffect(() => { setMobile(false); setMenu(false); }, [pathname]);
    useEffect(() => {
        if (!hash) return;
        const targetId = decodeURIComponent(hash.slice(1));
        const timer = window.setTimeout(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => window.clearTimeout(timer);
    }, [pathname, hash]);
    useEffect(() => { document.body.style.overflow = mobile ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [mobile]);
    useEffect(() => {
        if (!mobile && !menu)
            return;
        const key = (e) => { if (e.key === 'Escape') {
            setMobile(false);
            setMenu(false);
        } };
        const click = (e) => { if (menu && menuRef.current && !menuRef.current.contains(e.target))
            setMenu(false); };
        window.addEventListener('keydown', key);
        document.addEventListener('mousedown', click);
        return () => { window.removeEventListener('keydown', key); document.removeEventListener('mousedown', click); };
    }, [mobile, menu]);
    const doLogout = () => { logout(); setMenu(false); setMobile(false); toast.success('You have been signed out.'); if (pathname.startsWith('/portal') || pathname === '/reserve')
        navigate('/login', { replace: true }); };
    const isStaff = !!user && user.role !== 'guest';
    const reserveTo = isStaff ? '/portal/reservations/new' : '/reserve';
    const overHero = pathname === '/' && !solid && !mobile; // transparent bar over the home hero photo
    const link = ({ isActive }) => `whitespace-nowrap text-sm transition-colors hover:text-gold-ink ${isActive ? 'text-gold-ink' : 'text-mist'}`;
    const menuItem = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-cream transition hover:bg-wash/10';
    return (<>
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${overHero ? 'dark-scope' : ''} ${solid || mobile ? 'glass-strong border-x-0 border-t-0 shadow-xl shadow-black/10' : 'border-b border-transparent'}`}>
      <nav className="mx-auto flex min-h-[68px] max-w-shell items-center justify-between gap-4 px-4 sm:px-5 md:min-h-[76px] md:px-8" aria-label="Main">
        <Logo />

        {/* desktop links (visible from 1024px up - the old bar had a gap with no links at this width) */}
        <ul className="hidden items-center gap-6 lg:flex xl:gap-9">
          {LINKS.map(l => <li key={l.to}><NavLink to={l.to} className={link}>{l.label}</NavLink></li>)}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline-flex"><ThemeToggle /></span>

          {user ? (<div className="relative hidden lg:block" ref={menuRef}>
              <button type="button" onClick={() => setMenu(m => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label={`Account menu for ${user.fullName}`} className="flex items-center gap-2.5 rounded-full border border-wash/15 py-1 pl-1 pr-3 text-sm transition hover:border-gold">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-xs font-medium text-gold-ink">{initialsOf(user.fullName)}</span>
                <span className="max-w-[140px] truncate" data-testid="nav-username">{user.fullName}</span>
                <ChevronDown size={14} className={`text-mist transition-transform ${menu ? 'rotate-180' : ''}`}/>
              </button>
              {menu && (<div role="menu" className="glass-strong absolute right-0 mt-3 w-64 origin-top-right animate-pop rounded-2xl p-2 shadow-2xl">
                  <div className="border-b border-wash/10 px-3 pb-3 pt-2"><p className="truncate text-sm font-medium">{user.fullName}</p><p className="truncate text-xs text-muted">{user.email}</p><p className="mt-1 text-[11px] uppercase tracking-wider text-gold-ink">{ROLE_LABEL[user.role]}</p></div>
                  <div className="py-2">
                    <Link role="menuitem" to="/portal" className={menuItem}><LayoutDashboard size={16} className="text-gold-ink"/> Dashboard</Link>
                    {user.role === 'guest' && <Link role="menuitem" to="/portal/reservations" className={menuItem}><CalendarDays size={16} className="text-gold-ink"/> My reservations</Link>}
                    <Link role="menuitem" to="/portal/notifications" className={menuItem}><Bell size={16} className="text-gold-ink"/> Notifications{unread > 0 && <span className="ml-auto rounded-full bg-gold px-2 text-[11px] font-semibold text-black">{unread}</span>}</Link>
                    <Link role="menuitem" to="/portal/profile" className={menuItem}><UserCircle size={16} className="text-gold-ink"/> My profile</Link>
                  </div>
                  <button role="menuitem" type="button" onClick={doLogout} className={`${menuItem} border-t border-wash/10 !rounded-t-none pt-3 text-red-500 dark:text-red-300`}><LogOut size={16}/> Log out</button>
                </div>)}
            </div>) : (<div className="hidden items-center gap-2 lg:flex">
              <Link to="/login" className="px-2 text-sm text-mist transition hover:text-gold-ink">Login</Link>
              <Link to="/register" className="btn-outline !px-5 !py-2">Register</Link>
            </div>)}

          <Link to={reserveTo} className="btn-gold !px-4 !py-2 sm:!px-5 sm:!py-2.5">Reserve</Link>
          <button type="button" className="rounded-full p-2 text-cream transition hover:bg-wash/10 lg:hidden" aria-label={mobile ? 'Close menu' : 'Open menu'} aria-expanded={mobile} aria-controls="mobile-menu" onClick={() => setMobile(m => !m)}>
            {mobile ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      </nav>

    </header>
      {/* mobile / tablet panel. It is a SIBLING of <header>, not a child: the header has backdrop-filter, which would make it the
            containing block of this fixed panel and collapse it to the header's height. */}
      <div id="mobile-menu" className={`fixed inset-x-0 bottom-0 top-[68px] z-40 overflow-y-auto md:top-[76px] border-t border-wash/10 bg-ink transition-[opacity,visibility] duration-200 lg:hidden ${mobile ? 'visible opacity-100' : 'invisible opacity-0'}`} aria-hidden={!mobile}>
        <div className="mx-auto max-w-shell px-5 pb-10 pt-5 sm:px-8">
          {user && (<div className="mb-4 flex items-center gap-3 rounded-2xl border border-wash/10 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 font-medium text-gold-ink">{initialsOf(user.fullName)}</span>
              <div className="min-w-0"><p className="truncate font-medium">{user.fullName}</p><p className="text-[11px] uppercase tracking-wider text-gold-ink">{ROLE_LABEL[user.role]}</p></div>
            </div>)}
          <ul className="grid">
            {[{ label: 'Home', to: '/' }, ...LINKS].map(l => <li key={l.to}><NavLink to={l.to} end onClick={() => setMobile(false)} className={({ isActive }) => `block border-b border-wash/10 py-3.5 font-serif text-2xl ${isActive ? 'text-gold-ink' : ''}`}>{l.label}</NavLink></li>)}
          </ul>
          {user ? (<div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link to="/portal" className="btn-glass" onClick={() => setMobile(false)}><LayoutDashboard size={16}/> Dashboard</Link>
              <Link to="/portal/profile" className="btn-glass" onClick={() => setMobile(false)}><UserCircle size={16}/> My profile</Link>
              <button type="button" onClick={doLogout} className="btn-danger sm:col-span-2"><LogOut size={16}/> Log out</button>
            </div>) : (<div className="mt-5 grid grid-cols-2 gap-3">
              <Link to="/login" className="btn-glass" onClick={() => setMobile(false)}>Login</Link>
              <Link to="/register" className="btn-outline" onClick={() => setMobile(false)}>Register</Link>
            </div>)}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-wash/10 px-4 py-3 sm:hidden"><span className="text-sm text-mist">Appearance</span><ThemeToggle /></div>
        </div>
      </div>
    </>);
}
