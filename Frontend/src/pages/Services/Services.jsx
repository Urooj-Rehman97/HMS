import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import RequestServiceModal from '../../components/services/RequestServiceModal';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { Chips, Toolbar } from '../../components/common/Toolbar';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { serviceApi } from '../../services';
import { SERVICE_CATEGORIES, labelOf } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { ADMIN_MGR, can } from '../../utils/permissions';
import { maxLen, moneyRule } from '../../utils/validators';
/** Service catalogue. Everyone: GET /services/active. Admin/Manager: GET /services + create/edit/(de)activate. Guests can request a service. */
export default function Services() {
    const { user } = useAuth();
    const toast = useToast();
    const manage = can(user?.role, ...ADMIN_MGR);
    const guest = user?.role === 'guest';
    const { data, loading, error, reload } = useFetch(() => (manage ? serviceApi.list() : serviceApi.active()), [manage]);
    const [cat, setCat] = useState('All');
    const [edit, setEdit] = useState(undefined);
    const [req, setReq] = useState(undefined);
    const rows = (data ?? []).filter(s => cat === 'All' || s.category === cat);
    const toggle = async (s) => { try {
        await serviceApi.setActive(s._id, s.isActive === false);
        toast.success(s.isActive === false ? 'Service activated' : 'Service deactivated');
        reload();
    }
    catch (e) {
        toast.error(e.message);
    } };
    return (<>
      <PageHeader title="Hotel services" sub={guest ? 'Order in-stay services to your room.' : 'The catalogue of services guests can request.'} actions={<><Link to="/portal/services/requests" className="btn-outline"><ListChecks size={16}/> {guest ? 'My requests' : 'Requests'}</Link>{guest && <Button onClick={() => setReq(null)}>Request a service</Button>}{manage && <Button onClick={() => setEdit(null)}><Plus size={16}/> Add service</Button>}</>}/>
      <Toolbar><Chips value={cat} onChange={setCat} options={SERVICE_CATEGORIES}/></Toolbar>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-36"/>)}</div> : !rows.length ? <div className="glass rounded-2xl"><EmptyState title="No services" text="Services appear here once the hotel adds them."/></div> : (<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map(s => (<article key={s._id} className={`glass flex flex-col rounded-2xl p-5 ${s.isActive === false ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-2"><h2 className="font-serif text-xl">{s.name}</h2><StatusBadge status={s.isActive === false ? 'INACTIVE' : 'ACTIVE'}/></div>
            <p className="mt-1 text-xs text-muted">{labelOf(s.category)}</p>
            {s.description && <p className="mt-2 line-clamp-3 text-sm text-mist">{s.description}</p>}
            <p className="mt-3 text-gold-ink">{formatCurrency(s.price)}{s.unit ? <span className="text-xs text-muted"> / {s.unit}</span> : null}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">{guest && <Button className="!px-4 !py-1.5 text-xs" onClick={() => setReq(s)}>Request</Button>}{manage && <><Button variant="glass" className="!px-4 !py-1.5 text-xs" onClick={() => setEdit(s)}>Edit</Button><Button variant="glass" className="!px-4 !py-1.5 text-xs" onClick={() => toggle(s)}>{s.isActive === false ? 'Activate' : 'Deactivate'}</Button></>}</div>
          </article>))}</div>)}
      <ServiceForm open={edit !== undefined} service={edit} onClose={() => setEdit(undefined)} onSaved={reload}/>
      <RequestServiceModal open={req !== undefined} service={req} onClose={() => setReq(undefined)} onDone={() => { }}/>
    </>);
}
function ServiceForm({ open, service, onClose, onSaved }) {
    const toast = useToast();
    const init = () => ({ name: service?.name ?? '', description: service?.description ?? '', category: service?.category ?? 'ROOM_SERVICE', price: service?.price != null ? String(service.price) : '', unit: service?.unit ?? '' });
    const f = useForm(init(), v => ({ name: !v.name.trim() ? 'Name is required' : v.name.length > 100 ? 'Name must be 100 characters or fewer' : '', description: maxLen(v.description, 500, 'Description'), price: moneyRule(v.price, 'Price', 0), unit: maxLen(v.unit, 100, 'Unit') }));
    useEffect(() => { if (open)
        f.reset(init()); }, [open, service?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { const b = { name: v.name.trim(), description: v.description.trim(), category: v.category, price: Number(v.price), unit: v.unit.trim() }; service ? await serviceApi.update(service._id, b) : await serviceApi.create(b); toast.success(service ? 'Service updated' : 'Service created'); onSaved(); onClose(); }); };
    return (<Modal open={open} onClose={onClose} title={service ? 'Edit service' : 'Add service'}>
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        <div className="sm:col-span-2"><Input label="Name" required maxLength={100} value={f.values.name} onChange={f.onChange('name')} onBlur={f.onBlur('name')} error={f.errors.name}/></div>
        <Select label="Category" value={f.values.category} onChange={f.onChange('category')}>{SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{labelOf(c)}</option>)}</Select>
        <Input label="Price" type="number" min={0} step="any" required value={f.values.price} onChange={f.onChange('price')} onBlur={f.onBlur('price')} error={f.errors.price}/>
        <Input label="Unit (optional)" placeholder="per item, per hour…" value={f.values.unit} onChange={f.onChange('unit')} error={f.errors.unit}/>
        <div className="sm:col-span-2"><Textarea label="Description" rows={3} maxLength={500} value={f.values.description} onChange={f.onChange('description')} error={f.errors.description}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>{service ? 'Save changes' : 'Create service'}</Button></div>
      </form>
    </Modal>);
}
