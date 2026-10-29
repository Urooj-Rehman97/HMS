import { http, listOf } from './api';
export const roomApi = {
    list: async (q = {}) => listOf(await http.get('/rooms', q)),
    /** Public inventory endpoint; returns actual available rooms, not room types. */
    available: async (q = {}) => listOf(await http.get('/rooms/available', q)),
    uploadImage: async (id, file) => {
        if (!file) throw new Error('Please select a room image.');
        const form = new FormData();
        form.append('image', file);
        const result = await http.upload('POST', `/rooms/${id}/image`, form);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('rooms:changed'));
        return result?.data ?? result;
    },
    /** → { total, byStatus: { AVAILABLE: 12, OCCUPIED: 3, ... } } */
    stats: async () => { const d = (await http.get('/rooms/stats')).data; const byStatus = {}; (d?.byStatus ?? []).forEach((s) => { byStatus[s._id] = s.count; }); return { total: Number(d?.totalRooms ?? 0), byStatus }; },
    get: async (id) => (await http.get(`/rooms/${id}`)).data,
    create: async (b) => (await http.post('/rooms', b)).data,
    update: async (id, b) => (await http.put(`/rooms/${id}`, b)).data,
    setStatus: (id, status) => http.patch(`/rooms/${id}/status`, { status }),
    setActive: (id, active) => http.patch(`/rooms/${id}/${active ? 'activate' : 'deactivate'}`),
    remove: (id) => http.del(`/rooms/${id}`),
    types: {
        list: async () => listOf(await http.get('/room-types')),
        active: async () => listOf(await http.get('/room-types/active')),
        create: async (b) => (await http.post('/room-types', b)).data,
        update: async (id, b) => (await http.put(`/room-types/${id}`, b)).data,
        setActive: (id, active) => http.patch(`/room-types/${id}/${active ? 'activate' : 'deactivate'}`),
        remove: (id) => http.del(`/room-types/${id}`),
    },
};
