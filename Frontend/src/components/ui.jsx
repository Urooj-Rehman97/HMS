import { motion } from 'framer-motion';
import { labelOf } from '../utils/constants';
export { Button } from './common/Button';
export { EmptyState, ErrorState } from './common/EmptyState';
export const ease = [0.22, 1, 0.36, 1];
export function Reveal({ children, delay = 0, className = '' }) {
    return (<motion.div className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease, delay: Math.min(delay, 0.3) }}>
      {children}
    </motion.div>);
}
export const GlassCard = ({ children, className = '' }) => (<div className={`glass rounded-2xl ${className}`}>{children}</div>);
export function SectionHeading({ eyebrow, title, sub, center }) {
    return (<div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-4xl leading-[1.1] md:text-5xl">{title}</h2>
      {sub && <p className="mt-5 leading-relaxed text-mist">{sub}</p>}
    </div>);
}
const green = 'bg-emerald-500/10 text-emerald-700 border-emerald-600/30 dark:text-emerald-300 dark:border-emerald-500/30';
const amber = 'bg-gold/15 text-gold-ink border-gold/40';
const violet = 'bg-violet-500/10 text-violet-700 border-violet-600/30 dark:text-violet-300 dark:border-violet-500/30';
const sky = 'bg-sky-500/10 text-sky-700 border-sky-600/30 dark:text-sky-300 dark:border-sky-500/30';
const orange = 'bg-orange-500/10 text-orange-700 border-orange-600/30 dark:text-orange-300 dark:border-orange-500/30';
const red = 'bg-red-500/10 text-red-700 border-red-600/30 dark:text-red-300 dark:border-red-500/30';
const neutral = 'bg-wash/5 text-mist border-wash/10';
/** Tone per server status code (see utils/constants.js). Unknown codes fall back to neutral. */
const tones = {
    AVAILABLE: green, CONFIRMED: green, PAID: green, PUBLISHED: green, ACTIVE: green, COMPLETED: green, PASSED: green, RESOLVED: green,
    CLEANING: sky, CHECKED_OUT: sky, REFUNDED: sky, ASSIGNED: sky, VACANT: sky,
    PENDING: amber, PARTIAL: amber, PARTIALLY_PAID: amber, OPEN: amber, DRAFT: amber, MEDIUM: amber, NORMAL: amber, ON_HOLD: amber,
    OCCUPIED: violet, CHECKED_IN: violet, IN_PROGRESS: violet,
    MAINTENANCE: orange, HIGH: orange,
    CANCELLED: red, FAILED: red, UNPAID: red, URGENT: red, REJECTED: red, NO_SHOW: red, OVERDUE: red,
    LOW: neutral, INACTIVE: neutral, HIDDEN: neutral,
};
/** `status` may be a server code (CHECKED_IN) or an already-readable word (Active). */
export const StatusBadge = ({ status, label }) => {
    const code = String(status ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    return <span className={`inline-flex items-center rounded-full border whitespace-nowrap px-2.5 py-0.5 text-[11px] font-medium ${tones[code] ?? neutral}`}>{label ?? labelOf(status)}</span>;
};
export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-lg bg-wash/[0.06] ${className}`}/>;
export function SmartImage({ src, alt, className = '', pos }) {
    return <img src={src} alt={alt} loading="lazy" decoding="async" style={pos ? { objectPosition: pos } : undefined} className={`h-full w-full bg-ink-3 object-cover ${className}`}/>;
}
