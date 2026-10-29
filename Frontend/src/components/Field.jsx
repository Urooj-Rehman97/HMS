import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
const key = (id, label) => id ?? label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
const Err = ({ id, error }) => error ? <p id={`${id}-e`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p> : null;
const Hint = ({ hint, error }) => hint && !error ? <p className="mt-1 text-xs text-muted">{hint}</p> : null;
const lbl = (label, required) => <>{label}{required && <span className="text-gold-ink"> *</span>}</>;
export function Input({ label, error, hint, id, ...p }) {
    const k = key(id, label);
    return (<div><label htmlFor={k} className="label">{lbl(label, p.required)}</label>
    <input id={k} aria-invalid={!!error} aria-describedby={error ? `${k}-e` : undefined} className={`field ${error ? '!border-red-400/70' : ''}`} {...p}/>
    <Err id={k} error={error}/><Hint hint={hint} error={error}/></div>);
}
export function PasswordInput({ label, error, hint, id, ...p }) {
    const k = key(id, label);
    const [show, setShow] = useState(false);
    return (<div><label htmlFor={k} className="label">{lbl(label, p.required)}</label>
    <div className="relative"><input id={k} type={show ? 'text' : 'password'} aria-invalid={!!error} aria-describedby={error ? `${k}-e` : undefined} className={`field !pr-11 ${error ? '!border-red-400/70' : ''}`} {...p}/>
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold-ink">{show ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
    <Err id={k} error={error}/><Hint hint={hint} error={error}/></div>);
}
export function Select({ label, error, hint, children, id, ...p }) {
    const k = key(id, label);
    return (<div><label htmlFor={k} className="label">{lbl(label, p.required)}</label>
    <select id={k} aria-invalid={!!error} className={`field ${error ? '!border-red-400/70' : ''}`} {...p}>{children}</select><Err id={k} error={error}/><Hint hint={hint} error={error}/></div>);
}
export function Textarea({ label, error, hint, id, ...p }) {
    const k = key(id, label);
    return (<div><label htmlFor={k} className="label">{lbl(label, p.required)}</label>
    <textarea id={k} rows={4} aria-invalid={!!error} className={`field ${error ? '!border-red-400/70' : ''}`} {...p}/><Err id={k} error={error}/><Hint hint={hint} error={error}/></div>);
}
