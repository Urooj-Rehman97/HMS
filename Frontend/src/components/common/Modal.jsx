import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
export default function Modal({ open, onClose, title, children, wide }) {
    useEffect(() => {
        if (!open)
            return;
        document.body.style.overflow = 'hidden';
        const k = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', k);
        return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k); };
    }, [open]);
    // Rendered in a portal on <body>: a `position: fixed` overlay inside an ancestor that has backdrop-filter / transform
    // (our .glass panels, animated page wrappers) would be sized by that ancestor instead of the screen.
    return createPortal(<AnimatePresence>
      {open && (<motion.div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className={`glass-strong max-h-[90dvh] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl`}>
            <div className="mb-5 flex items-center justify-between"><h3 className="text-2xl">{title}</h3>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-mist hover:text-gold-ink"><X size={18}/></button></div>
            {children}
          </motion.div>
        </motion.div>)}
    </AnimatePresence>, document.body);
}
