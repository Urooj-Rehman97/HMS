import { API_URL } from '../utils/constants';
import { session } from '../utils/session';
export const AUTH_EXPIRED_EVENT = 'auth:expired';
export class ApiError extends Error {
    constructor(message, status = 0, fields = {}) { super(message); this.status = status; this.fields = fields; }}
function parseErrors(body) {
    const out = {};
    const e = body?.errors;
    if (Array.isArray(e))
        e.forEach((x) => { const k = String(x?.path ?? x?.param ?? x?.field ?? ''); if (k && !out[k]) out[k] = String(x?.msg ?? x?.message ?? ''); });
    else if (e && typeof e === 'object')  Object.entries(e).forEach(([k, v]) => { out[k] = String(v?.message ?? v); });
    return out;}
const friendly = (status, msg) => {
    if (msg && !/^(Internal|Cast to|E11000|MongoServerError)/i.test(msg))
        return msg;
    if (status === 401)
        return 'Your session has expired. Please sign in again.';
    if (status === 403)
        return 'You do not have permission to do that.';
    if (status === 404)
        return 'We could not find what you were looking for.';
    if (status >= 500)
        return 'Something went wrong on our side. Please try again in a moment.';
    return 'Something went wrong. Please try again.';};
async function request(method, path, opts = {}) {
    const url = new URL(API_URL + path);
    if (opts.query) Object.entries(opts.query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== 'All') url.searchParams.set(k, String(v)); });
    const headers = { Accept: 'application/json' };
    const token = session.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let body;
    if (opts.form) body = opts.form; // the browser sets the multipart boundary itself
    else if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }
    let res;
    try { res = await fetch(url, { method, headers, body, signal: opts.signal });}
    catch (e) {
        if (e?.name === 'AbortError')
            throw e;
        throw new ApiError('Cannot reach the server. Check your internet connection and that the backend is running.', 0);}
    let data = null;
    try { data = await res.json();}
    catch { /* empty or non-JSON body */ }
    if (!res.ok || data?.success === false) {
        if (res.status === 401 && token && !path.startsWith('/auth/login')) { session.clear();  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));}
        throw new ApiError(friendly(res.status, data?.message), res.status, parseErrors(data));}
    return data;}
export const http = {
    get: (p, query, signal) => request('GET', p, { query, signal }),
    post: (p, body) => request('POST', p, { body }),
    put: (p, body) => request('PUT', p, { body }),
    patch: (p, body) => request('PATCH', p, { body }),
    del: (p) => request('DELETE', p),
    upload: (method, p, form) => request(method, p, { form }),};
/* ---- response helpers (the server's envelopes differ per module) ---------- */
export const dataOf = (b) => b?.data;
export function pagedOf(b, key) {
    const arr = (key ? b?.[key] : undefined) ?? b?.data?.users ?? b?.data ?? b?.items ?? [];
    const p = b?.pagination ?? b?.data?.pagination ?? {};
    const items = Array.isArray(arr) ? arr : [];
    const limit = Number(p.limit) || items.length || 10;
    const total = Number(p.total ?? p.totalGuests ?? p.totalItems ?? items.length);
    return { items, page: Number(p.page ?? p.currentPage ?? 1), limit, total, pages: Number(p.pages ?? p.totalPages ?? Math.max(1, Math.ceil(total / limit))) };}
export const listOf = (b, key) => { const a = (key ? b?.[key] : undefined) ?? b?.data ?? []; return Array.isArray(a) ? a : []; };
