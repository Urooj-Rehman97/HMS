/** Currency comes from the hotel settings (public /hotel endpoint). Defaults to PKR until it is loaded. */
let code = 'PKR';
export const setCurrency = (c) => { if (c && /^[A-Za-z]{3,5}$/.test(c))
    code = c.toUpperCase(); };
export const currencyCode = () => code;
export function formatCurrency(n, max = 0) {
    const v = Number(n ?? 0) || 0;
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: 'code', minimumFractionDigits: max, maximumFractionDigits: max }).format(v).replace(/\u00a0/g, ' ');
    }
    catch {
        return `${code} ${v.toLocaleString('en-US', { maximumFractionDigits: max })}`;
    }
}
export const formatCompact = (n) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
