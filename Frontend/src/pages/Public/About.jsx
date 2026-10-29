import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal, SectionHeading, SmartImage } from '../../components/ui';
import TeamCarousel from '../../components/TeamCarousel';
const lines = [
    'LuxuryStay was created around one simple idea: luxury should feel natural, personal, and quietly memorable.',
    'Our spaces balance architectural character with the warmth of a private residence.',
    'Every arrival is prepared with care, from the first welcome to the final detail of your departure.',
    'Our rooms are designed for deep rest, focused work, and effortless time together.',
    'Our hospitality team combines local knowledge with an international standard of service.',
    'Dining is seasonal, expressive, and shaped around ingredients at their best.',
    'Our concierge helps turn a stay into an experience, with thoughtful recommendations and discreet support.',
    'We believe technology should remove friction rather than interrupt the human side of hospitality.',
    'Sustainability, considered sourcing, and responsible operations guide the choices behind the scenes.',
    'Most importantly, we listen closely and remember the details that matter to each guest.',
    'That attention is what transforms a beautiful property into a place people want to return to.',
];
export default function About() {
    useEffect(() => { document.title = 'About — LuxuryStay Hospitality'; }, []);
    return (<div className="overflow-hidden">
      <section className="relative mx-auto max-w-shell px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40">
        <div className="absolute -left-40 top-24 h-80 w-80 rounded-full bg-gold/10 blur-[120px]"/>
        <Reveal>
          <p className="eyebrow">Our story</p>
          <h1 className="mt-4 max-w-5xl text-5xl leading-[.98] sm:text-6xl md:text-7xl">Hospitality with a <span className="italic text-gold-ink">human</span> point of view.</h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-mist md:text-lg">A considered hotel experience built around calm spaces, precise service, and the feeling that everything has already been taken care of.</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-shell px-5 pb-24 md:px-8 md:pb-32">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <Reveal>
            <div className="dark-scope relative aspect-[4/5] overflow-hidden rounded-[28px]">
              <SmartImage src="/images/suite.webp" alt="LuxuryStay suite interior" pos="52% 48%" className="scale-105"/>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent"/>
              <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-5">
                <p className="eyebrow">The LuxuryStay standard</p>
                <p className="mt-2 font-serif text-xl">Quiet confidence. Thoughtful details. Lasting memories.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={.12}>
            <SectionHeading eyebrow="About us" title={<>Designed around the <span className="italic text-gold-ink">way you feel.</span></>}/>
            <div className="mt-7 space-y-4 border-l border-gold/40 pl-5">
              {lines.map((line, i) => <motion.p key={line} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * .035, duration: .65 }} className="text-sm leading-7 text-mist md:text-[15px]">{line}</motion.p>)}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-wash/[.06] bg-ink-1">
        <div className="mx-auto max-w-shell px-5 py-16 md:px-8 md:py-24 lg:py-32">
          <Reveal><SectionHeading eyebrow="People behind the stay" title={<>Meet the <span className="italic text-gold-ink">team.</span></>} sub="A rotating introduction to the people who shape every part of the LuxuryStay experience."/></Reveal>
          <Reveal delay={.12} className="mt-10 md:mt-14"><TeamCarousel /></Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-shell px-5 py-24 md:px-8 md:py-32">
        <Reveal><SectionHeading center eyebrow="What we value" title="Small principles. Consistent details."/></Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            [Sparkles, 'Thoughtful design', 'Spaces are composed to feel beautiful, useful, and calm from morning to night.'],
            [Heart, 'Human service', 'Warm, observant hospitality without unnecessary ceremony or interruption.'],
            [ShieldCheck, 'Trusted standards', 'Privacy, cleanliness, reliability, and consistency remain non-negotiable.'],
        ].map(([Icon, title, text], i) => { const I = Icon; return <Reveal key={title} delay={i * .08}><div className="glass h-full rounded-2xl p-6"><I size={20} className="text-gold-ink"/><h3 className="mt-5 text-xl">{title}</h3><p className="mt-3 text-sm leading-6 text-mist">{text}</p></div></Reveal>; })}
        </div>
        <Reveal className="mt-12 text-center"><Link to="/rooms" className="btn-outline">Explore our rooms <ArrowRight size={16}/></Link></Reveal>
      </section>
    </div>);
}
