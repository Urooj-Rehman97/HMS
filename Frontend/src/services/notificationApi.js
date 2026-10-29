import { http, pagedOf } from './api';
export const notificationApi = {
    list: async (q = {}) => pagedOf(await http.get('/notifications/my', q), 'data'),
    unreadCount: async () => Number((await http.get('/notifications/unread-count')).data?.unreadCount ?? 0),
    markRead: (id) => http.patch(`/notifications/${id}/read`),
    markAllRead: () => http.patch('/notifications/mark-all-read'),
    remove: (id) => http.del(`/notifications/${id}`),
    removeRead: () => http.del('/notifications/read'),
    /** Admin/Manager only. */
    send: (b) => http.post('/notifications', b),
};
