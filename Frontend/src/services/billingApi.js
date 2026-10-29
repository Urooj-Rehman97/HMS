import { http, pagedOf } from './api';
export const billingApi = {
    /** GET /billing?status&page&limit  (Admin/Manager/Receptionist). NOTE: the server path is /billing, not /bills. */
    list: async (q = {}) => pagedOf(await http.get('/billing', q), 'bills'),
    get: async (id) => (await http.get(`/billing/${id}`)).bill,
    byReservation: async (reservationId) => (await http.get(`/billing/reservation/${reservationId}`)).bill,
    create: async (b) => (await http.post('/billing', b)).bill,
    update: async (id, b) => (await http.put(`/billing/${id}`, b)).bill,
    addCharge: async (id, b) => (await http.post(`/billing/${id}/charges`, b)).bill,
    removeCharge: async (id, chargeId) => (await http.del(`/billing/${id}/charges/${chargeId}`)).bill,
    refresh: (id) => http.patch(`/billing/${id}/refresh`),
    /** Guest invoices (added endpoints GET /my/bills, /my/bills/:id). */
    mine: async () => ((await http.get('/my/bills')).bills ?? []),
    mineOne: async (id) => (await http.get(`/my/bills/${id}`)).bill,
};
export const paymentApi = {
    list: async (q = {}) => pagedOf(await http.get('/payments', q), 'payments'),
    forBill: async (billId) => { const b = await http.get(`/payments/bill/${billId}`); return { payments: (b.payments ?? []), bill: b.bill }; },
    create: async (b) => (await http.post('/payments', b)).payment,
    refund: (id, b) => http.post(`/payments/${id}/refund`, b),
};
