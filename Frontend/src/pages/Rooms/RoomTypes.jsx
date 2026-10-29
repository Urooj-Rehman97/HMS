import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Alert from '../../components/common/Alert';
import { Input, Textarea } from '../../components/Field';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { publicApi, roomApi } from '../../services';
import { formatCurrency } from '../../utils/formatCurrency';
import { ADMIN_MGR, can } from '../../utils/permissions';
import { RX, intRange, maxLen, moneyRule } from '../../utils/validators';
const lines = (s) => s.split(/[\n,]/).map(x => x.trim()).filter(Boolean);
const validate = (v) => {
    return { name: !v.name.trim() ? 'Name is required' : v.name.trim().length > 60 ? 'Name must be 60 characters or fewer' : '', description: maxLen(v.description, 1000, 'Description'), capacity: intRange(v.capacity, 1, 20, 'Capacity'), basePrice: moneyRule(v.basePrice, 'Base price', 0), amenities: lines(v.amenities).length > 30 ? 'Maximum 30 amenities' : '' };
};
/** Room types define capacity, price and amenities. Upload photos on individual room forms. */
export default function RoomTypes() {
    const { user } = useAuth();
    const toast = useToast();
    const manage = can(user?.role, ...ADMIN_MGR);
    const { data, loading, error, reload } = useFetch(() => roomApi.types.list(), []);
    const [edit, setEdit] = useState(undefined);
    const [del, setDel] = useState(null);
    const toggle = async (t) => { try {
        await roomApi.types.setActive(t._id, !t.isActive);
        publicApi.reset();
        toast.success(t.isActive ? 'Type deactivated' : 'Type activated');
        reload();
    }
    catch (e) {
        toast.error(e.message);
    } };
    return (<>
      <PageHeader back="/portal/rooms" title="Room types" sub="Types define capacity, base rate and what the public website shows." actions={manage && <Button onClick={() => setEdit(null)}><Plus size={16}/> Add type</Button>}/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-72"/>)}</div> : !data?.length ? <div className="glass rounded-2xl"><EmptyState title="No room types" text="Create a room type before adding rooms."/></div> : (<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.map((t, i) => (<article key={t._id} className={`glass overflow-hidden rounded-2xl ${t.isActive === false ? 'opacity-60' : ''}`}>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2"><h2 className="font-serif text-2xl">{t.name}</h2><StatusBadge status={t.isActive === false ? 'INACTIVE' : 'ACTIVE'}/></div>
              <p className="mt-1 text-sm text-gold-ink">{formatCurrency(t.basePrice)} <span className="text-xs text-muted">/ night · sleeps {t.capacity}</span></p>
              {t.description && <p className="mt-2 line-clamp-2 text-sm text-mist">{t.description}</p>}
              {!!t.amenities?.length && <p className="mt-2 text-xs text-muted">{t.amenities.slice(0, 5).join(' · ')}{t.amenities.length > 5 ? ' …' : ''}</p>}
              {manage && <div className="mt-4 flex flex-wrap gap-2"><Button variant="glass" className="!px-4 !py-1.5 text-xs" onClick={() => setEdit(t)}>Edit</Button><Button variant="glass" className="!px-4 !py-1.5 text-xs" onClick={() => toggle(t)}>{t.isActive === false ? 'Activate' : 'Deactivate'}</Button><Button variant="danger" className="!px-4 !py-1.5 text-xs" onClick={() => setDel(t)}>Delete</Button></div>}
            </div>
          </article>))}</div>)}
      <TypeForm open={edit !== undefined} type={edit} onClose={() => setEdit(undefined)} onSaved={() => { publicApi.reset(); reload(); }}/>
      <ConfirmDialog open={!!del} danger title={`Delete “${del?.name ?? ''}”?`} message="Room types that still have rooms cannot be deleted - deactivate them instead." confirmLabel="Delete type" onClose={() => setDel(null)} onConfirm={async () => { try {
        await roomApi.types.remove(del._id);
        publicApi.reset();
        toast.success('Room type deleted');
        reload();
    }
    catch (e) {
        toast.error(e.message);
        throw e;
    } }}/>
    </>);
}
function TypeForm({ open, type, onClose, onSaved }) {
    const toast = useToast();
    const init = () => ({ name: type?.name ?? '', description: type?.description ?? '', capacity: String(type?.capacity ?? 2), basePrice: type?.basePrice != null ? String(type.basePrice) : '', amenities: (type?.amenities ?? []).join('\n') });
    const f = useForm(init(), validate);
    useEffect(() => { if (open)
        f.reset(init()); }, [open, type?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const submit = (e) => {
        e.preventDefault();
        f.submit(async (v) => {
            const body = { name: v.name.trim(), description: v.description.trim(), capacity: Number(v.capacity), basePrice: Number(v.basePrice), amenities: lines(v.amenities) };
            type ? await roomApi.types.update(type._id, body) : await roomApi.types.create(body);
            toast.success(type ? 'Room type updated' : 'Room type created');
            onSaved();
            onClose();
        });
    };
    const v = f.values, e = f.errors;
    return (<Modal wide open={open} onClose={onClose} title={type ? `Edit ${type.name}` : 'Add room type'}>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        <Input label="Name" required maxLength={60} value={v.name} onChange={f.onChange('name')} onBlur={f.onBlur('name')} error={e.name}/>
        <div className="grid grid-cols-2 gap-4"><Input label="Capacity" type="number" min={1} max={20} required value={v.capacity} onChange={f.onChange('capacity')} onBlur={f.onBlur('capacity')} error={e.capacity}/><Input label="Base price" type="number" min={0} step="any" required value={v.basePrice} onChange={f.onChange('basePrice')} onBlur={f.onBlur('basePrice')} error={e.basePrice}/></div>
        <div className="sm:col-span-2"><Textarea label="Description" rows={3} maxLength={1000} value={v.description} onChange={f.onChange('description')} error={e.description}/></div>
        <Textarea label="Amenities (one per line)" rows={4} value={v.amenities} onChange={f.onChange('amenities')} error={e.amenities}/>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>{type ? 'Save changes' : 'Create type'}</Button></div>
      </form>
    </Modal>);
}
