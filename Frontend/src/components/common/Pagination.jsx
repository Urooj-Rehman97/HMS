import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function Pagination({ page, pages, onPage, total }) {
    if (pages <= 1)
        return null;
    const btn = 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-wash/10 text-mist transition hover:border-gold hover:text-gold-ink disabled:pointer-events-none disabled:opacity-40';
    return (<nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-wash/[0.06] px-4 py-3 text-xs text-muted">
      <span>{total} records · page {page} of {pages}</span>
      <div className="flex gap-2">
        <button className={btn} aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={16}/></button>
        <button className={btn} aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight size={16}/></button>
      </div>
    </nav>);
}
