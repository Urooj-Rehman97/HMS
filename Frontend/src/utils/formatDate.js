/**
 * Stay dates (check-in / check-out) are stored as UTC midnight, so they are displayed in UTC.
 * That keeps "1 Jan" as "1 Jan" for every visitor, whatever their time zone.
 */
const toDate = (v) => { if (!v)
    return null; const d = new Date(v); return isNaN(+d) ? null : d; };
export const formatDate = (v) => toDate(v)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) ?? '—';
/** Moments in time (created / updated / paid) are shown in the viewer's local time. */
export const formatDateTime = (v) => toDate(v)?.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) ?? '—';
/** yyyy-mm-dd for <input type="date"> */
export const toInputDate = (v) => toDate(v)?.toISOString().slice(0, 10) ?? '';
/** Today's date in the VIEWER's calendar (not UTC), as yyyy-mm-dd. */
export const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const addDaysISO = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const nightsBetween = (a, b) => (a && b ? Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 864e5)) : 0);
export function timeAgo(v) {
    const d = toDate(v);
    if (!d)
        return '';
    const s = Math.max(0, (Date.now() - +d) / 1000);
    if (s < 60)
        return 'Just now';
    if (s < 3600)
        return `${Math.floor(s / 60)} min ago`;
    if (s < 86400)
        return `${Math.floor(s / 3600)} h ago`;
    if (s < 604800)
        return `${Math.floor(s / 86400)} d ago`;
    return formatDate(d);
}
