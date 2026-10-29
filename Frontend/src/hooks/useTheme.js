import { useSyncExternalStore } from 'react';
const KEY = 'luxurystay-theme';
const LEGACY_KEY = 'luxurystay-admin-theme'; // the admin-only toggle used this key before the site-wide theme
function read() {
    try {
        return (localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)) === 'light' ? 'light' : 'dark';
    }
    catch {
        return 'dark';
    }
}
function apply(t) {
    document.documentElement.dataset.theme = t;
    document.documentElement.style.colorScheme = t;
}
let current = typeof window === 'undefined' ? 'dark' : read();
const subs = new Set();
if (typeof window !== 'undefined')
    apply(current);
export function setTheme(t) {
    current = t;
    apply(t);
    try {
        localStorage.setItem(KEY, t);
    }
    catch { /* storage unavailable: theme still applies for this session */ }
    subs.forEach(f => f());
}
/** Site-wide theme shared by the public site and the admin panel. */
export function useTheme() {
    const theme = useSyncExternalStore(cb => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current, () => 'dark');
    return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
