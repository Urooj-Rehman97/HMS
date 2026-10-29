import { http, pagedOf } from './api';
export const frontDeskApi = {
    /** POST /check-in-out/:reservationId/check-in */
    checkIn: async (reservationId, b) => (await http.post(`/check-in-out/${reservationId}/check-in`, b)).data,
    checkOut: async (reservationId, b) => (await http.post(`/check-in-out/${reservationId}/check-out`, b)).data,
    records: async (q = {}) => pagedOf(await http.get('/check-in-out', q), 'data'),
};
