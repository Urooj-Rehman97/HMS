import { Inbox, AlertCircle } from 'lucide-react';
import { Button } from './Button';
export const EmptyState = ({ title, text, action }) => (<div className="flex flex-col items-center gap-3 px-4 py-16 text-center"><Inbox className="text-gold-ink"/><p className="font-serif text-xl">{title}</p><p className="max-w-sm text-sm text-mist">{text}</p>{action}</div>);
export const ErrorState = ({ onRetry, message }) => (<div className="flex flex-col items-center gap-3 px-4 py-16 text-center" role="alert"><AlertCircle className="text-red-600 dark:text-red-300"/><p className="font-serif text-xl">Something went wrong</p><p className="max-w-sm text-sm text-mist">{message || 'We couldn’t load this right now.'}</p><Button variant="outline" onClick={onRetry}>Retry</Button></div>);
export default EmptyState;
/** Shown while a lazy-loaded page chunk downloads. Tiny on purpose. */
export const PageFallback = () => (<div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading"><div className="h-9 w-9 animate-spin rounded-full border-2 border-gold/30 border-t-gold"/></div>);
