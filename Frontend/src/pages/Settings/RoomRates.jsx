import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Input } from '../../components/Field';
import { Button, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../components/common/Toast';
import { publicApi, roomApi } from '../../services';
import { formatCurrency } from '../../utils/formatCurrency';
import { moneyRule } from '../../utils/validators';
/** Edit each room type's base nightly rate (PUT /room-types/:id). Individual rooms can still override this on the Rooms page. */
export default function RoomRates() {
    const toast = useToast();
    const { data, loading, error, reload } = useFetch(() => roomApi.types.list(), []);
    const [edit, setEdit] = useState({});
    const [busy, setBusy] = useState('');
    const save = async (t) => {
        const v = edit[t._id];
        const err = moneyRule(v, 'Rate', 0);
        if (err)
            return toast.error(err);
        setBusy(t._id);
        try {
            await roomApi.types.update(t._id, { name: t.name, description: t.description ?? '', capacity: t.capacity, basePrice: Number(v), amenities: t.amenities ?? [], images: t.images ?? [] });
            publicApi.reset();
            toast.success(`${t.name} rate updated`);
            setEdit(e => { const n = { ...e }; delete n[t._id]; return n; });
            reload();
        }
        catch (e) {
            toast.error(e.message);
        }
        finally {
            setBusy('');
        }
    };
    return (<>
      <PageHeader back="/portal/settings" title="Room rates" sub="Base price per night for each room type."/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <Skeleton className="h-56"/> : !data?.length ? <div className="glass rounded-2xl"><EmptyState title="No room types" text="Create room types first."/></div> : (<div className="glass divide-y divide-wash/10 rounded-2xl">{data.map(t => {
                const v = edit[t._id];
                const dirty = v !== undefined && v !== String(t.basePrice);
                const err = v !== undefined ? moneyRule(v, 'Rate', 0) : '';
                return (<div key={t._id} className="flex flex-wrap items-end justify-between gap-4 p-5"><div><p className="font-serif text-xl">{t.name}</p><p className="text-xs text-muted">Current: {formatCurrency(t.basePrice)} · sleeps {t.capacity}</p></div>
            <div className="flex items-end gap-3"><div className="w-40"><Input label="Rate / night" type="number" min={0} step="any" value={v ?? String(t.basePrice)} onChange={e => setEdit({ ...edit, [t._id]: e.target.value })} error={err}/></div><Button disabled={!dirty || !!err} loading={busy === t._id} onClick={() => save(t)}>Save</Button></div></div>);
            })}</div>)}
    </>);
}
