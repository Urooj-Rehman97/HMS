import { LayoutDashboard, CalendarDays, BedDouble, Users, UserCog, UserRound, LogIn, LogOut, Receipt, SprayCan, Wrench, ConciergeBell, MessageSquare, BarChart3, Bell, Settings, UserCircle, Images } from 'lucide-react';
const ALL = ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'];
export const OPS = ['admin', 'manager', 'receptionist'];
export const ADMIN_MGR = ['admin', 'manager'];
export const HOUSE = ['admin', 'manager', 'housekeeping'];
export const STAFF = ['admin', 'manager', 'receptionist', 'housekeeping'];
/**
 * Single source of truth for the portal sidebar AND route guards.
 * Roles here match the server's `allowRoles(...)` on the endpoints each page depends on.
 */
export const PORTAL_NAV = [
    { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
    { to: '/portal/reservations', label: 'Reservations', icon: CalendarDays, roles: [...OPS, 'guest'] },
    { to: '/portal/rooms', label: 'Rooms', icon: BedDouble, roles: STAFF },
    { to: '/portal/guests', label: 'Guest Profiles', icon: UserRound, roles: OPS },
    { to: '/portal/users', label: 'User Accounts', icon: Users, roles: ADMIN_MGR },
    { to: '/portal/staff', label: 'Staff', icon: UserCog, roles: ADMIN_MGR },
    { to: '/portal/check-in', label: 'Check-in', icon: LogIn, roles: OPS },
    { to: '/portal/check-out', label: 'Check-out', icon: LogOut, roles: OPS },
    { to: '/portal/billing', label: 'Billing', icon: Receipt, roles: [...OPS, 'guest'] },
    { to: '/portal/housekeeping', label: 'Housekeeping', icon: SprayCan, roles: [...HOUSE, 'receptionist'] },
    { to: '/portal/maintenance', label: 'Maintenance', icon: Wrench, roles: ALL },
    { to: '/portal/services', label: 'Services', icon: ConciergeBell, roles: ALL },
    { to: '/portal/feedback', label: 'Feedback', icon: MessageSquare, roles: [...OPS, 'guest'] },
    { to: '/portal/reports', label: 'Reports', icon: BarChart3, roles: OPS },
    { to: '/portal/gallery', label: 'Gallery', icon: Images, roles: ADMIN_MGR },
    { to: '/portal/notifications', label: 'Notifications', icon: Bell, roles: ALL },
    { to: '/portal/settings', label: 'Settings', icon: Settings, roles: ADMIN_MGR },
    { to: '/portal/profile', label: 'My Profile', icon: UserCircle, roles: ALL },
];
export const navFor = (role) => PORTAL_NAV.filter(n => !!role && n.roles.includes(role));
export const can = (role, ...allowed) => !!role && allowed.includes(role);
export const isStaff = (role) => !!role && role !== 'guest';
/** Server sends 'Admin' / 'Housekeeping' ... → 'admin' / 'housekeeping'. Unknown values fall back to the least-privileged role. */
export const normalizeRole = (r) => {
    const v = String(r ?? '').toLowerCase().replace(/[\s_-]/g, '');
    return ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'].find(x => x === v) ?? 'guest';
};
