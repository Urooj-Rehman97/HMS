import { http } from './api';
export const settingsApi = {
    get: async () => (await http.get('/settings')).data,
    create: async (b) => (await http.post('/settings', b)).data,
    update: async (b) => (await http.put('/settings', b)).data,
    patch: async (section, b) => (await http.patch(`/settings/${section}`, b)).data,
};
