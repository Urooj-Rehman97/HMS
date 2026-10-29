import { useCallback, useEffect, useRef, useState } from 'react';
export function useFetch(fn, deps = [], enabled = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');
    const [tick, setTick] = useState(0);
    const fnRef = useRef(fn);
    fnRef.current = fn;
    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        let alive = true;
        setLoading(true);
        setError('');
        fnRef.current().then(d => { if (alive)
            setData(d); }).catch(e => { if (alive)
            setError(e?.message || 'Something went wrong.'); }).finally(() => { if (alive)
            setLoading(false); });
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick, enabled]);
    const reload = useCallback(() => setTick(t => t + 1), []);
    return { data, loading, error, reload, setData };
}
/** Server-paginated list: keeps the page number and resets to page 1 when filters change. */
export function useList(loader, filterDeps = []) {
    const [page, setPage] = useState(1);
    useEffect(() => { setPage(1); }, filterDeps); // eslint-disable-line react-hooks/exhaustive-deps
    const state = useFetch(() => loader(page), [page, ...filterDeps]);
    return { ...state, page, setPage, items: state.data?.items ?? [], pages: state.data?.pages ?? 1, total: state.data?.total ?? 0 };
}
