import { http } from './api';
import { normalizeRole } from '../utils/permissions';
/** Reduce the server's user document to the small object we keep in sessionStorage. */
export function toSessionUser(u) {
    const firstName = String(u?.firstName ?? ''), lastName = String(u?.lastName ?? '');
    return { _id: String(u?._id ?? ''), firstName, lastName, fullName: `${firstName} ${lastName}`.trim() || String(u?.email ?? 'Guest'), email: String(u?.email ?? ''), phone: String(u?.phone ?? ''), role: normalizeRole(u?.role) };
}
export const authApi = {
    /** POST /auth/login → { token, user } */
    login: async (email, password) => { const b = await http.post('/auth/login', { email, password }); return { token: String(b.data.token), user: toSessionUser(b.data.user) }; },
    /** POST /auth/register (guest) - the server does NOT return a token, the guest signs in afterwards. */
    register: async (body) => { const b = await http.post('/auth/register', body); return toSessionUser(b.data?.user); },
    /** GET /auth/me - used to verify a restored session. */
    me: async () => { const b = await http.get('/auth/me'); return { user: toSessionUser(b.data?.user), raw: b.data?.user }; },
    forgotPassword: (email) => http.post('/auth/forgot-password', { email }),
    resetPassword: (token, password, confirmPassword) => http.post('/auth/reset-password', { token, password, confirmPassword }),
    staffSetup: (token, password, confirmPassword) => http.post('/auth/staff/setup', { token, password, confirmPassword }),
    changePassword: (currentPassword, newPassword, confirmPassword) => http.patch('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
};
