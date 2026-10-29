    import { http, pagedOf } from './api';
    export const reservationApi = {
        /** GET /reservations?search&status&paymentStatus&bookingSource&page&limit (staff) */
        list: async (q = {}) => pagedOf(await http.get('/reservations', q), 'reservations'),
        /** Date-based availability: GET /reservations/availability?roomType&checkInDate&checkOutDate */
        /** Rooms of a type that are free for the dates. The server answers { available, count, rooms }. */
        availability: async (q) => ((await http.get('/reservations/availability', q)).rooms ?? []),
        get: async (id) => (await http.get(`/reservations/${id}`)).reservation,
        byGuest: async (guestId) => { const b = await http.get(`/reservations/guest/${guestId}`); return (b.reservations ?? b.data ?? []); },
        create: async (b) => (await http.post('/reservations', b)).reservation,
        update: async (id, b) => (await http.put(`/reservations/${id}`, b)).reservation,
        assignRoom: (id, room) => http.patch(`/reservations/${id}/assign-room`, { room }),
        confirm: (id) => http.patch(`/reservations/${id}/confirm`),
        setStatus: (id, status) => http.patch(`/reservations/${id}/status`, { status }),
        setPaymentStatus: (id, paymentStatus) => http.patch(`/reservations/${id}/payment-status`, { paymentStatus }),
        cancel: (id, reason) => http.patch(`/reservations/${id}/cancel`, { reason }),
        /** Reservations of the signed-in guest (added endpoint GET /my/reservations). */
        mine: async () => ((await http.get('/my/reservations')).reservations ?? []),
        /** Guest online booking (added endpoint POST /my/reservations). */
        book: async (b) => (await http.post('/my/reservations', b)).reservation,
        cancelMine: (id, reason) => http.patch(`/my/reservations/${id}/cancel`, { reason }),
    };
