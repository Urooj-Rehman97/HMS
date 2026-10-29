import { passwordStrength } from '../../utils/validators';
const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
export default function PasswordStrength({ value }) {
    if (!value)
        return null;
    const s = passwordStrength(value);
    const color = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-500'][s];
    return (<div className="mt-2" aria-live="polite">
      <div className="flex gap-1">{[1, 2, 3, 4].map(n => <span key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= s ? color : 'bg-wash/10'}`}/>)}</div>
      <p className="mt-1 text-xs text-muted">Password strength: {LABELS[s]}</p>
    </div>);
}
