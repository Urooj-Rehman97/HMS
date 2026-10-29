/**
 * Session storage for the logged-in user.
 *
 * WHY sessionStorage: it survives a page refresh and in-app navigation, but it is
 * cleared automatically when the browser TAB is closed - a sensible default for a
 * hotel system that staff may use on shared computers.
 *
 * What is stored (one JSON entry, key = SESSION_KEY):
 *   { token: "<JWT from /auth/login>", user: { _id, firstName, lastName, fullName, email, phone, role } }
 * Nothing else (no password, no full user document) is ever saved.
 */
export const SESSION_KEY = 'luxurystay.session';
const LEGACY_KEYS = ['luxurystay-token']; // older builds kept the JWT in localStorage - remove it
/** Reads the `exp` claim of a JWT (seconds) without any library. Returns 0 when unreadable. */
export function tokenExpiry(token) {
    try {
        const part = token.split('.')[1];
        const json = decodeURIComponent(atob(part.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
        return Number(JSON.parse(json).exp) || 0;
    }
    catch {
        return 0;
    }
}
export const isExpired = (token) => { const exp = tokenExpiry(token); return !exp || exp * 1000 <= Date.now(); };
function read() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw)
            return null;
        const s = JSON.parse(raw);
        if (!s?.token || !s.user?._id || !s.user.role || isExpired(s.token)) {
            clear();
            return null;
        }
        return s;
    }
    catch {
        clear();
        return null;
    }
}
function write(token, user) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
        LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
    }
    catch { /* storage blocked: user stays logged in for this page view only */ }
}
function clear() { try {
    sessionStorage.removeItem(SESSION_KEY);
    LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
}
catch { /* ignore */ } }
export const session = {
    read, write, clear,
    getToken: () => read()?.token ?? null,
    getUser: () => read()?.user ?? null,
    /** Replace only the stored user (e.g. after editing the profile) and keep the token. */
    setUser: (user) => { const s = read(); if (s)
        write(s.token, user); },
};
