import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
export default function BackToTop() {
    const [visible, setVisible] = useState(false);
    useEffect(() => { const onScroll = () => setVisible(window.scrollY > 500); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
    if (!visible)
        return null;
    return <button type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-5 right-5 z-40 rounded-full border border-gold/40 bg-ink/90 p-3 text-gold-ink shadow-lg shadow-black/10 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-gold hover:text-black sm:bottom-7 sm:right-7"><ArrowUp size={18}/></button>;
}
