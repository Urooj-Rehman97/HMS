import { http, pagedOf, listOf } from './api';
export const serviceApi = {
    list: async () => listOf(await http.get('/services')),
    active: async () => listOf(await http.get('/services/active')),
    create: async (b) => (await http.post('/services', b)).data,
    update: async (id, b) => (await http.put(`/services/${id}`, b)).data,
    setActive: (id, active) => http.patch(`/services/${id}/${active ? 'activate' : 'deactivate'}`),
    /** Requests live under /services/requests (NOT /service-requests). */
    requests: {
        list: async (q = {}) => pagedOf(await http.get('/services/requests', q), 'data'),
        get: async (id) => (await http.get(`/services/requests/${id}`)).data,
        create: async (b) => (await http.post('/services/requests', b)).data,
        assign: (id, assignedTo) => http.patch(`/services/requests/${id}/assign`, { assignedTo }),
        setStatus: (id, b) => http.patch(`/services/requests/${id}/status`, b),
    },
};
