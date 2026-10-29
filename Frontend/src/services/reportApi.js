import { http } from './api';
export const reportApi = {
    /** kind: dashboard | occupancy | revenue | reservations | payments | rooms | guests | feedback | operations */
    get: async (kind, q = {}) => (await http.get(`/reports/${kind}`, q)).data,
};
