import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from '../../components/Hero';
import RoomCard from '../../components/RoomCard';
import { EmptyState, ErrorState, Reveal, SectionHeading, SmartImage } from '../../components/ui';
import { experiences, testimonials } from '../../data/content';
import { useFetch } from '../../hooks/useFetch';
import { roomApi } from '../../services';
import TeamCarousel from '../../components/TeamCarousel';
const Shell = ({ id, children, className = '' }) => (<section id={id} className={`mx-auto max-w-shell px-5 py-24 md:px-8 md:py-32 ${className}`}>{children}</section>);
function Immersive() {
    return (<div className="dark-scope relative flex h-[70vh] min-h-[440px] items-center justify-center overflow-hidden">
      <img src="/images/suite.webp" alt="Sunset over the city from a LuxuryStay suite" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async"/>
      <div className="absolute inset-0 bg-ink/50"/>
      <Reveal className="relative px-6 text-center">
        <p className="eyebrow">The LuxuryStay feeling</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-4xl italic leading-tight md:text-6xl">Wake to the city. Return to calm.</h2>
        <div className="mt-8"><Link to="/reserve" className="btn-gold">Reserve Your Stay</Link></div>
      </Reveal>
    </div>);
}
/** Homepage showcase uses real available room inventory from GET /rooms/available. */
function RoomsShowcase() {
    const { data, loading, error, reload } = useFetch(() => roomApi.available(), []);
    if (error)
        return <ErrorState onRetry={reload} message="We could not load our rooms right now."/>;
    if (loading)
        return <div className="mt-14 grid gap-6 md:grid-cols-2">{[0, 1].map(i => <div key={i} className="glass h-96 animate-pulse rounded-2xl"/>)}</div>;
    if (!data?.length)
        return <div className="mt-14"><EmptyState title="Rooms coming soon" text="Our room collection is being prepared."/></div>;
    return (<>
    <div className="mt-14 grid gap-6 md:grid-cols-2">{data.slice(0, 4).map((room, n) => <Reveal key={room._id} delay={(n % 2) * 0.1}><RoomCard room={room}/></Reveal>)}</div>
    {data.length > 4 && <div className="mt-10 text-center"><Link to="/rooms" className="btn-outline">View all rooms <ArrowRight size={16}/></Link></div>}
  </>);
}
function Testimonials() {
    const [i, setI] = useState(0);
    useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % testimonials.length), 7000); return () => clearInterval(t); }, []);
    const t = testimonials[i];
    return (<div className="mx-auto max-w-3xl text-center">
      <p className="eyebrow">Guest stories</p>
      <div className="relative mt-8 min-h-[260px]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.figure key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 flex justify-center gap-1 text-gold-ink">{Array.from({ length: t.rating }).map((_, n) => <Star key={n} size={16} fill="currentColor"/>)}</div>
            <blockquote className="font-serif text-2xl italic leading-snug md:text-3xl">“{t.quote}”</blockquote>
            <figcaption className="mt-6 text-sm text-mist"><span className="text-cream">{t.name}</span> · {t.from}</figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-2">{testimonials.map((_, n) => <button key={n} aria-label={`Testimonial ${n + 1}`} onClick={() => setI(n)} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-8 bg-gold' : 'w-1.5 bg-wash/25'}`}/>)}</div>
    </div>);
}
export default function Home() {
    useEffect(() => { document.title = 'LuxuryStay Hospitality — A More Beautiful Way to Stay'; }, []);
    return (<>
      <Hero />
      <Shell>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal><SectionHeading eyebrow="Welcome" title={<>Where luxury feels <span className="italic text-gold-ink">effortless.</span></>}/></Reveal>
          <Reveal delay={0.15}>
            <span className="gold-line"/>
            <p className="mt-6 leading-relaxed text-mist">LuxuryStay is built on quiet confidence: generous rooms, unhurried service and details you notice only when they are missing. From arrival to farewell, everything is prepared before you ask.</p>
            <Link to="/rooms" className="btn-outline mt-8">Discover the rooms <ArrowRight size={16}/></Link>
          </Reveal>
        </div>
        <Reveal className="mt-14"><div className="aspect-[16/8] overflow-hidden rounded-2xl"><SmartImage src="/images/deluxe.webp" alt="Deluxe King room with skyline view" pos="50% 40%"/></div></Reveal>
      </Shell>
      <Shell id="rooms" className="!pt-0">
        <Reveal><SectionHeading eyebrow="Rooms & Suites" title="Rest, refined." sub="Explore rooms currently marked available in our hotel inventory."/></Reveal>
        <RoomsShowcase />
      </Shell>
      <Shell id="experiences" className="!pt-0">
        <Reveal><SectionHeading eyebrow="Experiences" title="Beyond the room."/></Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {experiences.map((e, n) => (<Reveal key={e.title} delay={n * 0.08}>
              <article className="dark-scope group relative aspect-[3/4] overflow-hidden rounded-2xl">
                <SmartImage src={e.img} pos={e.pos} alt={e.title} className="scale-125 transition duration-[1400ms] group-hover:scale-[1.35]"/>
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"/>
                <div className="absolute inset-x-0 bottom-0 p-6"><p className="eyebrow">{e.tag}</p><h3 className="mt-2 text-2xl">{e.title}</h3></div>
              </article>
            </Reveal>))}
        </div>
      </Shell>
      <Shell id="dining" className="!pt-0">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal><div className="aspect-[4/3] overflow-hidden rounded-2xl"><SmartImage src="/images/dark.webp" pos="30% 80%" alt="Warmly lit dining setting" className="scale-125"/></div></Reveal>
          <Reveal delay={0.15}>
            <SectionHeading eyebrow="Dining" title={<>An evening in <span className="italic text-gold-ink">gold light.</span></>} sub="Seasonal tasting menus, a private chef’s table and a rooftop lounge for after dark."/>
            <ul className="mt-8 space-y-2 text-sm text-mist"><li>Saffron-glazed sea bass · Aged wagyu · Pistachio soufflé</li><li className="flex items-center gap-2"><Clock size={14} className="text-gold-ink"/>Dinner 6:30 pm – 11:30 pm daily</li></ul>
            <Link to="/contact" className="btn-gold mt-8">Ask the concierge</Link>
          </Reveal>
        </div>
      </Shell>
      <Immersive />
      <Shell className="!pt-0">
        <div className="flex flex-col gap-10 md:gap-14">
          <Reveal className="flex flex-wrap items-end justify-between gap-6"><SectionHeading eyebrow="Our people" title={<>The faces behind <span className="italic text-gold-ink">the stay.</span></>} sub="Meet the hospitality team bringing the LuxuryStay standard to life."/><Link to="/about" className="btn-outline">Meet the full team <ArrowRight size={16}/></Link></Reveal>
          <Reveal delay={.12}><TeamCarousel /></Reveal>
        </div>
      </Shell>
      <Shell><Testimonials /></Shell>
    </>);
}
