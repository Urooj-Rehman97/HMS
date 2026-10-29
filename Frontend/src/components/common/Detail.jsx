/** Label / value rows for detail pages. */
export const DetailGrid = ({ children, cols = 2 }) => <dl className={`grid gap-x-8 gap-y-4 sm:grid-cols-2 ${cols === 3 ? 'lg:grid-cols-3' : ''}`}>{children}</dl>;
export const Detail = ({ label, children }) => (<div className="min-w-0"><dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt><dd className="mt-1 break-words text-sm text-cream">{children || '—'}</dd></div>);
export const Panel = ({ title, children, actions }) => (<section className="glass rounded-2xl p-5 md:p-6">
    {(title || actions) && <div className="mb-4 flex flex-wrap items-center justify-between gap-3">{title && <h2 className="font-serif text-xl">{title}</h2>}{actions}</div>}
    {children}
  </section>);
