/** Keeps the unread-notification badge (bell icon) up to date. Uses the tiny /notifications/unread-count call, refreshed every 60 s while the tab is visible. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationApi } from '../services';
import { useAuth } from '../hooks/useAuth';
const NotificationContext = createContext({ unread: 0, refresh: () => { }, setUnread: () => { } });
export const useNotifications = () => useContext(NotificationContext);
export const useNotify = useNotifications;
export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [unread, setUnread] = useState(0);
    const uid = user?._id;
    const refresh = useCallback(() => { if (!uid) {
        setUnread(0);
        return;
    } notificationApi.unreadCount().then(setUnread).catch(() => { }); }, [uid]);
    useEffect(() => {
        refresh();
        if (!uid)
            return;
        const t = window.setInterval(() => { if (document.visibilityState === 'visible')
            refresh(); }, 60000);
        return () => window.clearInterval(t);
    }, [uid, refresh]);
    const value = useMemo(() => ({ unread, refresh, setUnread }), [unread, refresh]);
    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
