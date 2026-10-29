/** Tiny toast system: `const toast = useToast(); toast.success('Saved')`. Mounted once in App.jsx. */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
const Ctx = createContext({ success: () => { }, error: () => { } });
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const n = useRef(0);
    const dismiss = useCallback((id) => setItems(s => s.filter(i => i.id !== id)), []);
    const push = useCallback((kind, text) => { const id = ++n.current; setItems(s => [...s.slice(-3), { id, kind, text }]); window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500); }, [dismiss]);
    const api = useMemo(() => ({ success: t => push('success', t), error: t => push('error', t) }), [push]);
    return (<Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end">
        {items.map(i => (<div key={i.id} role={i.kind === 'error' ? 'alert' : 'status'} className={`toast-in pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-xl ${i.kind === 'error' ? 'border-red-500/40 bg-red-950/90 text-red-100' : 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100'}`}>
            {i.kind === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0"/> : <CheckCircle2 size={16} className="mt-0.5 shrink-0"/>}
            <span className="min-w-0 break-words">{i.text}</span>
            <button type="button" onClick={() => dismiss(i.id)} aria-label="Dismiss" className="-mr-1 ml-1 shrink-0 opacity-70 hover:opacity-100"><X size={14}/></button>
          </div>))}
      </div>
    </Ctx.Provider>);
}
