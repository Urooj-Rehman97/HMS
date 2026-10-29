/** Endpoints that need NO login (added server routes /api/public/*). Results are cached for the page session. */
import { http, listOf } from './api';
import { setCurrency } from '../utils/formatCurrency';
let hotel = null;
let types = null;
export const publicApi = {
    hotel: () => (hotel ??= http.get('/public/hotel').then(b => { const d = b.data ?? null; setCurrency(d?.currency); return d; }).catch(() => { hotel = null; return null; })),
    roomTypes: () => (types ??= http.get('/public/room-types').then(b => listOf(b)).catch(e => { types = null; throw e; })),
    availability: async (q) => { const b = await http.get('/public/availability', q); return { available: !!b.available, count: Number(b.count ?? 0) }; },
    /** Drop caches (after admin edits settings). */
    reset: () => { hotel = null; types = null; },
};
