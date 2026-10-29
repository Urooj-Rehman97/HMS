import { http, pagedOf } from './api';
export const userApi = {
    /** GET /users?role&isActive&search&page&limit  (Admin/Manager) */
    list: async (q = {}) => pagedOf(await http.get('/users', q), 'users'),
    get: async (id) => { const b = await http.get(`/users/${id}`); return b.data?.user ?? b.data; },
    /** POST /users/staff → creates the staff user and e-mails an invitation link. */
    inviteStaff: (body) => http.post('/users/staff', body),
    resendInvitation: (id) => http.post(`/users/${id}/resend-invitation`, {}),
    update: (id, body) => http.put(`/users/${id}`, body),
    setActive: (id, active) => http.patch(`/users/${id}/${active ? 'activate' : 'deactivate'}`),
    /** Own profile (any role) - added server endpoint PUT /my/profile. */
    updateMine: async (body) => (await http.put('/my/profile', body)).data?.user,
};
