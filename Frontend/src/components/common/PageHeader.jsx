import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
/** Title row used at the top of every portal page. `back` adds a "← Back" link. */
export default function PageHeader({ title, sub, actions, back }) {
    return (<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && <Link to={back} className="mb-2 inline-flex items-center gap-1.5 text-xs text-mist hover:text-gold-ink"><ArrowLeft size={14}/> Back</Link>}
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-sm text-mist">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>);
}
