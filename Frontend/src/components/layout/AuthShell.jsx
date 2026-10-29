import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';
/** Split-screen frame shared by every auth page (photo left, form right). */
export default function AuthShell({ title, subtitle, children, footer, wide }) {
    useEffect(() => { document.title = `${title} — LuxuryStay`; }, [title]);
    return (<div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="dark-scope relative hidden lg:block"><img src="/images/deluxe.webp" alt="" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-ink/10"/>
        <p className="absolute bottom-14 left-12 max-w-sm font-serif text-4xl italic leading-tight">Exceptional stays. <span className="text-gold-ink">Beautifully remembered.</span></p></div>
      <div className="relative flex items-center justify-center px-4 py-24 sm:px-5">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <div className={`glass w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl p-6 sm:p-8`}>
          <Link to="/" className="font-serif text-lg">Luxury<span className="italic text-gold-ink">Stay</span></Link>
          <h1 className="mt-5 text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-mist">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-mist">{footer}</p>}
        </div>
      </div>
    </div>);
}
