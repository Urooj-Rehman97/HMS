import { useEffect, useState } from 'react';
import { Skeleton } from '../ui';
import { EmptyState, ErrorState } from './EmptyState';
import Pagination from './Pagination';
import { PAGE_SIZE } from '../../utils/constants';
export default function Table({ pager, cols, rows, loading, error, onRetry, onRow, pageSize = PAGE_SIZE, emptyTitle = 'Nothing here yet', emptyText = 'No records match your filters.' }) {
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [rows?.length]);
    const wide = cols.length > 6; // many columns: cards until lg so tablets don't need sideways scrolling
    if (error)
        return <ErrorState onRetry={onRetry ?? (() => { })} message={typeof error === 'string' ? error : undefined}/>;
    if (loading)
        return <div className="space-y-3 p-4">{[0, 1, 2, 3].map(n => <Skeleton key={n} className="h-12"/>)}</div>;
    if (!rows?.length)
        return <EmptyState title={emptyTitle} text={emptyText}/>;
    const pages = pager ? pager.pages : Math.max(1, Math.ceil(rows.length / pageSize)), shown = pager ? rows : rows.slice((page - 1) * pageSize, page * pageSize);
    return (<>
      <div className={`hidden max-w-full overflow-x-auto ${wide ? 'lg:block' : 'md:block'}`}>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-wash/[0.08] text-[11px] uppercase tracking-wider text-muted">{cols.map(c => <th key={c.key} className="whitespace-nowrap px-4 py-3 font-medium">{c.head}</th>)}</tr></thead>
          <tbody>{shown.map((r, i) => (<tr key={r?._id ?? i} onClick={() => onRow?.(r)} tabIndex={onRow ? 0 : undefined} onKeyDown={e => { if (onRow && e.key === 'Enter')
            onRow(r); }} className={`border-b border-wash/[0.05] transition hover:bg-wash/[0.03] ${onRow ? 'cursor-pointer' : ''}`}>
              {cols.map(c => <td key={c.key} className="whitespace-nowrap px-4 py-3.5 text-cream/90">{c.render(r)}</td>)}
            </tr>))}</tbody>
        </table>
      </div>
      <div className={`grid gap-3 p-3 sm:grid-cols-2 ${wide ? 'lg:hidden' : 'md:hidden'}`}>
        {shown.map((r, i) => (<div key={r?._id ?? i} onClick={() => onRow?.(r)} className="min-w-0 rounded-xl border border-wash/10 bg-wash/[0.03] p-4">
            {cols.filter(c => !c.hideMobile).map(c => <div key={c.key} className="flex items-center justify-between gap-3 py-1 text-sm"><span className="text-xs text-muted">{c.head}</span><span className="text-right">{c.render(r)}</span></div>)}
          </div>))}
      </div>
    <Pagination page={pager ? pager.page : page} pages={pages} onPage={pager ? pager.onPage : setPage} total={pager ? pager.total : rows.length}/>
    </>);
}
