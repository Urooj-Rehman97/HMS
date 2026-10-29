import { http, pagedOf, listOf } from './api';
export const feedbackApi = {
    list: async (q = {}) => pagedOf(await http.get('/feedback', q), 'data'),
    mine: async () => listOf(await http.get('/feedback/my-feedback')),
    summary: async () => (await http.get('/feedback/summary')).data,
    create: async (b) => (await http.post('/feedback', b)).data,
    update: async (id, b) => (await http.put(`/feedback/${id}`, b)).data,
    respond: (id, adminResponse) => http.patch(`/feedback/${id}/respond`, { adminResponse }),
    setStatus: (id, status) => http.patch(`/feedback/${id}/status`, { status }),
    remove: (id) => http.del(`/feedback/${id}`),
};
