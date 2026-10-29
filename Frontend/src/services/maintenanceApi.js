import { http, pagedOf, listOf } from './api';
export const maintenanceApi = {
    list: async (q = {}) => pagedOf(await http.get('/maintenance', q), 'data'),
    get: async (id) => (await http.get(`/maintenance/${id}`)).data,
    create: async (b) => (await http.post('/maintenance', b)).data,
    update: async (id, b) => (await http.put(`/maintenance/${id}`, b)).data,
    assign: (id, assignedTo) => http.patch(`/maintenance/${id}/assign`, { assignedTo }),
    setStatus: (id, b) => http.patch(`/maintenance/${id}/status`, b),
    remove: (id) => http.del(`/maintenance/${id}`),
    /** Guest-reported issues (added endpoints POST/GET /my/maintenance). */
    report: async (b) => (await http.post('/my/maintenance', b)).data,
    mine: async () => listOf(await http.get('/my/maintenance')),
};
