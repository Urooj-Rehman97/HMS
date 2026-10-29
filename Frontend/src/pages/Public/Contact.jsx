import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Mail, MapPin, Phone, Send } from 'lucide-react';
import { Reveal, SectionHeading, Button } from '../../components/ui';
import { Input, Textarea } from '../../components/Field';
import Alert from '../../components/common/Alert';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { publicApi } from '../../services';
import { validateContact } from '../../utils/validators';
/**
 * The backend has no "contact form" endpoint, so this form validates the message and opens the visitor's own
 * e-mail app addressed to the hotel (mailto:). Contact details come from the hotel settings (GET /public/hotel).
 */
export default function Contact() {
    useEffect(() => { document.title = 'Contact — LuxuryStay'; }, []);
    const { user } = useAuth();
    const { data: h, loading } = useFetch(() => publicApi.hotel(), []);
    const f = useForm({ name: user?.fullName ?? '', email: user?.email ?? '', subject: '', message: '' }, validateContact);
    const [opened, setOpened] = useState(false);
    const to = h?.email;
    const go = (ev) => { ev.preventDefault(); f.submit(async (v) => { if (!to)
        throw new Error('The hotel has not published a contact e-mail yet. Please call us instead.'); window.location.href = `mailto:${to}?subject=${encodeURIComponent(v.subject.trim())}&body=${encodeURIComponent(`${v.message.trim()}\n\n— ${v.name.trim()} (${v.email.trim()})`)}`; setOpened(true); }); };
    const address = [h?.address, h?.city, h?.country].filter(Boolean).join(', ');
    const info = [
        { i: MapPin, l: 'Address', v: address }, { i: Phone, l: 'Phone', v: h?.phone, href: h?.phone && `tel:${String(h.phone).replace(/\s/g, '')}` },
        { i: Mail, l: 'Email', v: h?.email, href: h?.email && `mailto:${h.email}` }, { i: Clock3, l: 'Check-in / out', v: h?.checkInTime ? `${h.checkInTime} / ${h.checkOutTime}` : '' },
    ].filter(x => x.v);
    return (<div className="overflow-hidden">
      <section className="mx-auto max-w-shell px-5 pb-12 pt-32 md:px-8 md:pb-16 md:pt-40">
        <Reveal><p className="eyebrow">Contact & concierge</p><h1 className="mt-4 max-w-4xl text-5xl leading-[.98] sm:text-6xl md:text-7xl">Let us make your stay <span className="italic text-gold-ink">effortless.</span></h1><p className="mt-7 max-w-2xl text-base leading-8 text-mist md:text-lg">Questions about a room, a transfer or a special occasion? Write to our concierge. To book a room, <Link to="/reserve" className="text-gold-ink underline-offset-4 hover:underline">reserve online</Link>.</p></Reveal>
      </section>
      <section className="mx-auto grid max-w-shell gap-12 px-5 pb-24 md:px-8 md:pb-32 lg:grid-cols-[.8fr_1.2fr]">
        <Reveal>
          <SectionHeading eyebrow="Reach us" title={<>A direct line to <span className="italic text-gold-ink">our team.</span></>}/>
          <ul className="mt-8 space-y-5 text-sm">{loading ? <li className="text-mist">Loading…</li> : info.length ? info.map(x => <li key={x.l} className="flex gap-3"><x.i size={18} className="mt-0.5 shrink-0 text-gold-ink"/><div><p className="text-xs uppercase tracking-wider text-muted">{x.l}</p>{x.href ? <a href={x.href} className="break-words text-cream hover:text-gold-ink">{x.v}</a> : <p className="break-words text-cream">{x.v}</p>}</div></li>) : <li className="text-mist">Contact details will appear here once the hotel adds them.</li>}</ul>
        </Reveal>
        <Reveal delay={0.1}>
          <form onSubmit={go} noValidate className="glass space-y-5 rounded-[28px] p-5 sm:p-7">
            {opened && <Alert kind="success">Your e-mail app should now be open with your message ready. Press send there to deliver it.</Alert>}
            {f.formError && <Alert kind="error">{f.formError}</Alert>}
            <div className="grid gap-5 sm:grid-cols-2"><Input label="Full name" required maxLength={50} value={f.values.name} onChange={f.onChange('name')} onBlur={f.onBlur('name')} error={f.errors.name}/><Input label="Email" type="email" required value={f.values.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} error={f.errors.email}/></div>
            <Input label="Subject" required maxLength={120} value={f.values.subject} onChange={f.onChange('subject')} onBlur={f.onBlur('subject')} error={f.errors.subject}/>
            <Textarea label="Message" required rows={5} maxLength={1500} value={f.values.message} onChange={f.onChange('message')} onBlur={f.onBlur('message')} error={f.errors.message} hint={`${f.values.message.length}/1500`}/>
            <Button type="submit" loading={f.submitting} className="w-full sm:w-auto"><Send size={16}/> Send message</Button>
          </form>
        </Reveal>
      </section>
    </div>);
}
