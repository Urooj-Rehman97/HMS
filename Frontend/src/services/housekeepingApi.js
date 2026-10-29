import { http, pagedOf, listOf } from './api';
export const housekeepingApi = {
    list: async (q = {}) => pagedOf(await http.get('/housekeeping', q), 'data'),
    mine: async () => listOf(await http.get('/housekeeping/my-tasks')),
    get: async (id) => (await http.get(`/housekeeping/${id}`)).data,
    create: async (b) => (await http.post('/housekeeping', b)).data,
    update: async (id, b) => (await http.put(`/housekeeping/${id}`, b)).data,
    setStatus: (id, status, completionNotes) => http.patch(`/housekeeping/${id}/status`, { status, completionNotes }),
    inspect: (id, inspectionPassed, completionNotes) => http.patch(`/housekeeping/${id}/inspection`, { inspectionPassed, completionNotes }),
};
