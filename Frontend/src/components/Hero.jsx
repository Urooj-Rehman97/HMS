import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BookingWidget from './BookingWidget';
const slides = [
    { img: '/images/deluxe.webp', eyebrow: 'LuxuryStay Hospitality', a: 'A More Beautiful', b: 'Way to Stay.', sub: 'Discover a new standard of luxury hospitality.', cta: 'Explore Rooms', to: '/rooms' },
    { img: '/images/dark.webp', eyebrow: 'Personal service', a: 'Hospitality Designed', b: 'Around You', sub: 'Concierge, dining and rest — shaped to how you travel.', cta: 'See experiences', to: '/#experiences' },
    { img: '/images/suite.webp', eyebrow: 'Beyond the room', a: 'More Than', b: 'Just a Stay', sub: 'A place you return to, and remember.', cta: 'Discover LuxuryStay', to: '/about' },
];
/** Home hero. Slides cross-fade with CSS only (no animation library), pause on hover/hidden tab, and support swipe + arrow keys. */
export default function Hero() {
    const [i, setI] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hidden, setHidden] = useState(false);
    const touch = useRef(0);
    const go = (n) => setI((n + slides.length) % slides.length);
    useEffect(() => { const f = () => setHidden(document.hidden); document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f); }, []);
    useEffect(() => { if (paused || hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        return; const t = setInterval(() => setI(x => (x + 1) % slides.length), 6000); return () => clearInterval(t); }, [paused, hidden]);
    const s = slides[i];
    return (<section className="dark-scope relative min-h-[100svh] overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onKeyDown={e => { if (e.key === 'ArrowRight')
        go(i + 1); if (e.key === 'ArrowLeft')
        go(i - 1); }} tabIndex={0} aria-roledescription="carousel" aria-label="Featured stays" onTouchStart={e => (touch.current = e.touches[0].clientX)} onTouchEnd={e => { const d = e.changedTouches[0].clientX - touch.current; if (Math.abs(d) > 50)
        go(i + (d < 0 ? 1 : -1)); }}>
      {slides.map((sl, n) => <img key={sl.img} src={sl.img} alt="" width={1600} height={1041} fetchPriority={n === 0 ? 'high' : 'low'} loading={n === 0 ? 'eager' : 'lazy'} decoding="async" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out ${n === i ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true"/>)}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40"/>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,7,7,.55)_100%)]"/>
      <div className="relative mx-auto flex min-h-[100svh] max-w-shell flex-col justify-end px-5 pb-10 pt-32 md:px-8 md:pb-14">
        <div key={i} aria-live="polite" className="hero-in">
          <p className="eyebrow">{s.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl"><span className="block">{s.a}</span><span className="block italic text-gold-ink">{s.b}</span></h1>
          <p className="mt-5 max-w-lg text-lg text-cream/80">{s.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to={s.to} className="btn-gold">{s.cta}</Link><Link to="/reserve" className="btn-glass">Reserve Your Stay</Link></div>
        </div>
        <div className="mt-8 flex gap-2" role="tablist" aria-label="Slides">
          {slides.map((_, n) => <button key={n} role="tab" aria-selected={n === i} aria-label={`Slide ${n + 1}`} onClick={() => setI(n)} className={`h-[3px] rounded-full transition-all duration-500 ${n === i ? 'w-12 bg-gold' : 'w-6 bg-wash/30 hover:bg-wash/60'}`}/>)}
        </div>
        <div className="hero-in mt-8" style={{ animationDelay: '.25s' }}><BookingWidget /></div>
      </div>
    </section>);
}
