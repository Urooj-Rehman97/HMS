import { Search } from 'lucide-react';
import { labelOf } from '../../utils/constants';
export const Toolbar = ({ children }) => <div className="mb-5 flex flex-wrap items-center gap-3">{children}</div>;
export const SearchBox = ({ value, onChange, placeholder = 'Search…' }) => (<div className="relative min-w-[200px] flex-1 sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input className="field !pl-9" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} aria-label="Search"/></div>);
export const FilterSelect = ({ value, onChange, options, label }) => (<select className="field !w-auto" value={value} onChange={e => onChange(e.target.value)} aria-label={label}>{['All', ...options].map(o => <option key={o} value={o}>{o === 'All' ? `All ${label.toLowerCase()}` : labelOf(o)}</option>)}</select>);
export const Chips = ({ value, onChange, options }) => (<>{['All', ...options].map(s => <button key={s} onClick={() => onChange(s)} className={`rounded-full border px-4 py-1.5 text-xs ${value === s ? 'border-gold bg-gold/10 text-gold-ink' : 'border-wash/10 text-mist'}`}>{s === 'All' ? 'All' : labelOf(s)}</button>)}</>);
