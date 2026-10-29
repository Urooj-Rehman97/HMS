import { Loader2 } from 'lucide-react';
export function Button({ variant = 'gold', loading, children, className = '', ...p }) {
    return (<button type="button" {...p} disabled={p.disabled || loading} className={`btn-${variant} ${className}`}>
      {loading && <Loader2 size={16} className="animate-spin"/>}{children}
    </button>);
}
export default Button;
