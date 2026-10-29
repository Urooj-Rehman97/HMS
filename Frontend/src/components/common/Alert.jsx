import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
const tone = {
    error: ['border-red-600/30 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:text-red-300', AlertCircle],
    success: ['border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300', CheckCircle2],
    info: ['border-gold/40 bg-gold/10 text-gold-ink', Info],
};
export function Alert({ kind = 'info', children }) {
    const [cls, Icon] = tone[kind];
    return <div role={kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${cls}`}><Icon size={16} className="mt-0.5 shrink-0"/><div>{children}</div></div>;
}
export default Alert;
