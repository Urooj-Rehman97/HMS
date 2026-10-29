import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { EmptyState, ErrorState, Reveal, SectionHeading } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { galleryApi } from '../../services';
import { imageUrl } from '../../utils/entity';
/** Public gallery - GET /gallery/active (no login). Category filter + keyboard-friendly lightbox. */
export default function PublicGallery() {
    useEffect(() => { document.title = 'Gallery — LuxuryStay'; }, []);
    const { data, loading, error, reload } = useFetch(() => galleryApi.active(), []);
    const [cat, setCat] = useState('All');
    const [open, setOpen] = useState(null);
    const cats = useMemo(() => ['All', ...Array.from(new Set((data ?? []).map(g => g.category).filter(Boolean)))], [data]);
    const rows = useMemo(() => (data ?? []).filter(g => cat === 'All' || g.category === cat), [data, cat]);
    useEffect(() => {
        if (open === null)
            return;
        const key = (e) => { if (e.key === 'Escape')
            setOpen(null); if (e.key === 'ArrowRight')
            setOpen(i => (i === null ? i : (i + 1) % rows.length)); if (e.key === 'ArrowLeft')
            setOpen(i => (i === null ? i : (i - 1 + rows.length) % rows.length)); };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', key);
        return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', key); };
    }, [open, rows.length]);
    const cur = open !== null ? rows[open] : null;
    return (<section className="mx-auto max-w-shell px-5 pb-24 pt-32 md:px-8 md:pt-40">
      <Reveal><SectionHeading eyebrow="Gallery" title={<>A look <span className="italic text-gold-ink">inside.</span></>} sub="Rooms, dining and moments from LuxuryStay."/></Reveal>
      {cats.length > 2 && <div className="mt-8 flex flex-wrap gap-2">{cats.map(c => <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-1.5 text-xs transition ${cat === c ? 'border-gold bg-gold/10 text-gold-ink' : 'border-wash/10 text-mist hover:border-gold/50'}`}>{c}</button>)}</div>}
      {error ? <div className="mt-10"><ErrorState onRetry={reload} message="We could not load the gallery."/></div> : loading ? <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="glass aspect-[4/3] animate-pulse rounded-2xl"/>)}</div> : !rows.length ? <div className="mt-10"><EmptyState title="No photos yet" text="Our gallery is being updated. Please check back soon."/></div> : (<div className="mt-10 columns-2 gap-4 md:columns-3">{rows.map((g, n) => (<button key={g._id} type="button" onClick={() => setOpen(n)} className="group relative mb-4 block w-full overflow-hidden rounded-2xl text-left" aria-label={`Open ${g.title}`}>
            <img src={imageUrl(g.image)} alt={g.title} loading="lazy" decoding="async" className="w-full transition duration-500 group-hover:scale-105"/>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm text-white opacity-0 transition group-hover:opacity-100">{g.title}</span>
          </button>))}</div>)}
      {cur && (<div role="dialog" aria-modal="true" aria-label={cur.title} className="dark-scope fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10" onClick={() => setOpen(null)}><X size={24}/></button>
          {rows.length > 1 && <button aria-label="Previous" className="absolute left-2 rounded-full p-2 text-white hover:bg-white/10 md:left-6" onClick={e => { e.stopPropagation(); setOpen((open - 1 + rows.length) % rows.length); }}><ChevronLeft size={32}/></button>}
          <figure className="max-h-full max-w-5xl" onClick={e => e.stopPropagation()}><img src={imageUrl(cur.image)} alt={cur.title} className="max-h-[80vh] w-auto rounded-xl object-contain"/><figcaption className="mt-3 text-center text-sm text-white/80">{cur.title}{cur.description ? ` — ${cur.description}` : ''}</figcaption></figure>
          {rows.length > 1 && <button aria-label="Next" className="absolute right-2 rounded-full p-2 text-white hover:bg-white/10 md:right-6" onClick={e => { e.stopPropagation(); setOpen((open + 1) % rows.length); }}><ChevronRight size={32}/></button>}
        </div>)}
    </section>);
}
