import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Linkedin, Mail } from 'lucide-react';
import { team } from '../data/content';
const GAP = 16; // px between cards
const AUTOPLAY_MS = 4500;
/** Cards visible at once: 4 desktop, 2 tablet, 1 mobile (based on the carousel's own width). */
function perViewFor(width) { return width >= 960 ? 4 : width >= 560 ? 2 : 1; }
export default function TeamCarousel() {
    const n = team.length;
    const viewport = useRef(null);
    const touchX = useRef(null);
    const [perView, setPerView] = useState(1);
    const [index, setIndex] = useState(0); // position within [0, n]; index === n is the looped clone of item 0
    const [animate, setAnimate] = useState(true);
    const [paused, setPaused] = useState(false);
    const [hidden, setHidden] = useState(false);
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Responsive card count
    useEffect(() => {
        const el = viewport.current;
        if (!el)
            return;
        const update = () => setPerView(perViewFor(el.clientWidth));
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    useEffect(() => { const f = () => setHidden(document.hidden); document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f); }, []);
    const next = useCallback(() => setIndex(i => (i >= n ? i : i + 1)), [n]);
    const prev = useCallback(() => {
        // Going back from the first card: jump (invisibly) to the clone of it, then slide back one step.
        setIndex(i => {
            if (i > 0)
                return i - 1;
            setAnimate(false);
            requestAnimationFrame(() => requestAnimationFrame(() => { setAnimate(true); setIndex(n - 1); }));
            return n;
        });
    }, [n]);
    useEffect(() => {
        if (paused || hidden || reduced)
            return;
        const t = window.setInterval(next, AUTOPLAY_MS);
        return () => window.clearInterval(t);
    }, [paused, hidden, reduced, next]);
    // After sliding onto the clone of card 1, snap back to the real card 1 without animating: seamless loop.
    const onTransitionEnd = (e) => {
        if (e.target !== e.currentTarget || index < n)
            return;
        setAnimate(false);
        setIndex(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    };
    const items = [...team, ...team.slice(0, 4)]; // clones so the last cards are always followed by the first ones
    const active = index % n;
    const cardW = `calc((100% - ${(perView - 1) * GAP}px) / ${perView})`;
    const shift = `calc(${index} * (${cardW} + ${GAP}px) * -1)`;
    return (<section aria-roledescription="carousel" aria-label="Meet the team" className="min-w-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onKeyDown={e => { if (e.key === 'ArrowRight')
        next(); if (e.key === 'ArrowLeft')
        prev(); }} onTouchStart={e => { touchX.current = e.touches[0].clientX; setPaused(true); }} onTouchEnd={e => { if (touchX.current !== null) {
        const d = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(d) > 45)
            (d < 0 ? next : prev)();
    } touchX.current = null; setPaused(false); }}>
      <div ref={viewport} className="-mx-1 -my-4 overflow-hidden px-1 py-4">
        <ul className="flex will-change-transform" style={{ gap: GAP, transform: `translate3d(${shift}, 0, 0)`, transition: animate ? 'transform 800ms cubic-bezier(.22,1,.36,1)' : 'none' }} onTransitionEnd={onTransitionEnd}>
          {items.map((p, i) => {
            const clone = i >= n;
            return (<li key={`${p.name}-${i}`} style={{ flex: `0 0 ${cardW}` }} aria-hidden={clone || undefined} aria-roledescription="slide" aria-label={`${(i % n) + 1} of ${n}`}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-wash/10 bg-ink text-cream shadow-[0_1px_2px_rgb(0_0_0/.04),0_8px_24px_rgb(0_0_0/.05)] transition duration-500 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_14px_36px_rgb(0_0_0/.10)]">
                  <div className="relative aspect-[4/5] overflow-hidden bg-ink-3">
                    <img src={p.image} alt={clone ? '' : `Portrait of ${p.name}`} loading="lazy" decoding="async" style={{ objectPosition: p.pos }} className="h-full w-full object-cover transition duration-[900ms] ease-out group-hover:scale-105"/>
                    <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gold transition-transform duration-700 group-hover:scale-x-100"/>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-serif text-xl leading-tight">{p.name}</h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-gold-ink">{p.role}</p>
                    <span className="mt-3 block h-px w-8 bg-gold/60"/>
                    <p className="mt-3 flex-1 text-sm leading-6 text-mist">{p.bio}</p>
                    <div className="mt-4 flex gap-2">
                      <a href="#" tabIndex={clone ? -1 : undefined} aria-label={`${p.name} on LinkedIn`} className="rounded-full border border-wash/10 p-2 text-mist transition hover:border-gold hover:text-cream"><Linkedin size={15}/></a>
                      <a href="#" tabIndex={clone ? -1 : undefined} aria-label={`Email ${p.name}`} className="rounded-full border border-wash/10 p-2 text-mist transition hover:border-gold hover:text-cream"><Mail size={15}/></a>
                    </div>
                  </div>
                </article>
              </li>);
        })}
        </ul>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose team member">
          {team.map((p, i) => (<button key={p.name} type="button" aria-label={`Show ${p.name}`} aria-current={i === active} onClick={() => setIndex(i)} className="flex h-6 items-center">
              <span className={`block h-1.5 rounded-full transition-all duration-500 ${i === active ? 'w-8 bg-gold' : 'w-2 bg-wash/20 hover:bg-wash/40'}`}/>
            </button>))}
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" aria-label="Previous team member" onClick={prev} className="glass rounded-full p-2.5 text-mist transition hover:-translate-y-0.5 hover:text-cream"><ArrowLeft size={16}/></button>
          <button type="button" aria-label="Next team member" onClick={next} className="glass rounded-full p-2.5 text-mist transition hover:-translate-y-0.5 hover:text-cream"><ArrowRight size={16}/></button>
        </div>
      </div>
    </section>);
}
