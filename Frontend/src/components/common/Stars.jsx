import { Star } from 'lucide-react';
/** Read-only stars (value) or a clickable rating input (onChange). */
export default function Stars({ value, onChange, size = 16 }) {
    return (<span className="inline-flex gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => onChange
            ? <button type="button" key={n} role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} className="rounded p-0.5 transition hover:scale-110"><Star size={size + 6} className={n <= value ? 'fill-gold text-gold' : 'text-muted'}/></button>
            : <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-gold text-gold' : 'text-muted'}/>)}
    </span>);
}
