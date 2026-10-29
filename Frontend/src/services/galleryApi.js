import { http, pagedOf, listOf } from './api';
export const galleryApi = {
    /** Public (no login): only active images. */
    active: async () => listOf(await http.get('/gallery/active')),
    list: async (q = {}) => pagedOf(await http.get('/gallery', q), 'data'),
    create: (form) => http.upload('POST', '/gallery', form),
    update: (id, form) => http.upload('PUT', `/gallery/${id}`, form),
    setActive: (id, active) => http.patch(`/gallery/${id}/${active ? 'activate' : 'deactivate'}`),
    remove: (id) => http.del(`/gallery/${id}`),
};
