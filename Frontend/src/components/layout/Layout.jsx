import { Suspense, useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { PageFallback } from '../common/EmptyState';
import { initialsOf } from '../../utils/entity';
import { PORTAL_NAV } from '../../utils/permissions';
import { ROLE_LABEL } from '../../utils/constants';
/** Authenticated shell shared by every role: sidebar + top bar + routed page. */
export default function Layout() {
    const { user, logout } = useAuth();
    const { unread } = useNotifications();
    const nav = useNavigate();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    useEffect(() => setOpen(false), [pathname]);
    useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
    useEffect(() => { if (!open)
        return; const k = (e) => e.key === 'Escape' && setOpen(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
    const title = [...PORTAL_NAV].sort((a, b) => b.to.length - a.to.length).find(n => pathname === n.to || pathname.startsWith(n.to + '/'))?.label ?? 'Portal';
    useEffect(() => { document.title = `${title} — LuxuryStay`; }, [title]);
    if (!user)
        return null;
    const initials = initialsOf(user.fullName);
    return (<div className="admin-theme min-h-screen bg-ink-1">
      <aside className="fixed inset-y-0 left-0 z-40 hidden border-r border-wash/10 bg-ink md:block md:w-[68px] xl:w-64"><Sidebar role={user.role} compact/></aside>
      {open && <div className="fixed inset-0 z-50 md:hidden"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}/><aside role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-wash/10 bg-ink"><Sidebar role={user.role}/></aside></div>}
      <div className="md:pl-[68px] xl:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-wash/10 bg-ink/85 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3"><button type="button" className="-ml-1 rounded-lg p-2 md:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}</button><h1 className="truncate font-serif text-lg sm:text-xl">{title}</h1></div>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <Link to="/portal/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative p-1 text-mist hover:text-gold-ink"><Bell size={18}/>{unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-medium text-black">{unread > 9 ? '9+' : unread}</span>}</Link>
            <Link to="/portal/profile" className="hidden text-right leading-tight sm:block"><span className="block text-sm">{user.fullName}</span><span className="block text-[11px] text-muted">{ROLE_LABEL[user.role]}</span></Link>
            <Link to="/portal/profile" aria-label="Profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm text-gold-ink">{initials}</Link>
            <button type="button" aria-label="Log out" title="Log out" onClick={() => { logout(); nav('/login'); }} className="rounded-full p-2 text-mist hover:text-gold-ink"><LogOut size={18}/></button>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1400px] p-4 md:p-6 xl:p-8"><Suspense fallback={<PageFallback />}><div key={pathname} className="page-enter"><Outlet /></div></Suspense></main>
      </div>
    </div>);
}
