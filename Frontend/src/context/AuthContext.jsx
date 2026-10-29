import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, AUTH_EXPIRED_EVENT } from '../services';
import { session } from '../utils/session';
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => session.getUser());
    const [verifying, setVerifying] = useState(() => !!session.getToken());
    // Verify a restored session once, on first load.
    useEffect(() => {
        if (!session.getToken()) {
            setVerifying(false);
            return;
        }
        let alive = true;
        authApi.me()
            .then(({ user: fresh }) => { if (!alive)
            return; session.setUser(fresh); setUser(fresh); })
            .catch(err => { if (!alive)
            return; if (err?.status === 401 || err?.status === 403) {
            session.clear();
            setUser(null);
        } /* network error: keep the cached session */ })
            .finally(() => alive && setVerifying(false));
        return () => { alive = false; };
    }, []);
    // api.js fires this when any request gets a 401 (expired / invalid token).
    useEffect(() => {
        const onExpired = () => setUser(null);
        window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
        return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
    }, []);
    const login = useCallback(async (email, password) => {
        const { token, user: u } = await authApi.login(email.trim().toLowerCase(), password);
        session.write(token, u);
        setUser(u);
        return u;
    }, []);
    const logout = useCallback(() => { session.clear(); setUser(null); }, []);
    const updateUser = useCallback((patch) => {
        setUser(prev => { if (!prev)
            return prev; const next = { ...prev, ...patch }; next.fullName = `${next.firstName} ${next.lastName}`.trim(); session.setUser(next); return next; });
    }, []);
    const value = useMemo(() => ({ user, isAuthenticated: !!user, verifying, login, logout, updateUser }), [user, verifying, login, logout, updateUser]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
