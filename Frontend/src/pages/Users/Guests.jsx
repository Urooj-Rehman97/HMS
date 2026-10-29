import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { FilterSelect, SearchBox, Toolbar } from '../../components/common/Toolbar';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Detail, DetailGrid } from '../../components/common/Detail';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useFetch, useList } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { guestApi, reservationApi } from '../../services';
import { FLOOR_PREFERENCES, GENDERS, ROOM_PREFERENCES, SMOKING_PREFERENCES } from '../../utils/constants';
import { formatDate, toInputDate, todayISO } from '../../utils/formatDate';
import { nameOf } from '../../utils/entity';
import { ADMIN_MGR, can } from '../../utils/permissions';
import { validateGuest } from '../../utils/validators';
/** Guest profiles (SRS "Guest Profiles"): contact details + preferences. GET/POST/PUT/PATCH/DELETE /guests. */
export default function Guests() {
    const { user } = useAuth();
    const toast = useToast();
    const manage = can(user?.role, ...ADMIN_MGR);
    const [search, setSearch] = useState('');
    const q = useDebounce(search.trim(), 350);
    const [active, setActive] = useState('All');
    const list = useList(page => guestApi.list({ page, limit: 10, search: q, isActive: active === 'All' ? undefined : active === 'Active' ? 'true' : 'false' }), [q, active]);
    const [view, setView] = useState(null);
    const [edit, setEdit] = useState(undefined);
    const [del, setDel] = useState(null);
    const cols = [
        { key: 'n', head: 'Guest', render: g => <span className="font-medium">{nameOf(g)}</span> },
        { key: 'e', head: 'Email', render: g => <span className="break-all">{g.email}</span> }, { key: 'p', head: 'Phone', render: g => g.phone },
        { key: 'c', head: 'City', hideMobile: true, render: g => g.city || '—' }, { key: 's', head: 'Status', render: g => <StatusBadge status={g.isActive === false ? 'INACTIVE' : 'ACTIVE'}/> },
    ];
    return (<>
      <PageHeader title="Guest profiles" sub="Contact details and preferences for every guest." actions={<Button onClick={() => setEdit(null)}><Plus size={16}/> Add guest</Button>}/>
      <Toolbar><SearchBox value={search} onChange={setSearch} placeholder="Name, email or phone…"/><FilterSelect label="Status" value={active} onChange={setActive} options={['Active', 'Inactive']}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl"><Table cols={cols} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} onRow={setView} pager={{ page: list.page, pages: list.pages, total: list.total, onPage: list.setPage }} emptyTitle="No guests found" emptyText="Add a guest profile to start taking bookings."/></div>

      <GuestView guest={view} manage={manage} onClose={() => setView(null)} onEdit={g => { setView(null); setEdit(g); }} onToggle={async (g) => { try {
        await guestApi.setActive(g._id, g.isActive === false);
        toast.success(g.isActive === false ? 'Guest activated' : 'Guest deactivated');
        setView(null);
        list.reload();
    }
    catch (e) {
        toast.error(e.message);
    } }} onDelete={g => { setView(null); setDel(g); }}/>
      <GuestFormModal open={edit !== undefined} guest={edit} onClose={() => setEdit(undefined)} onSaved={list.reload}/>
      <ConfirmDialog open={!!del} danger title={`Delete ${nameOf(del)}?`} message="This removes the guest profile permanently. Guests with reservations cannot be deleted - deactivate them instead." confirmLabel="Delete guest" onClose={() => setDel(null)} onConfirm={async () => { try {
        await guestApi.remove(del._id);
        toast.success('Guest deleted');
        list.reload();
    }
    catch (e) {
        toast.error(e.message);
        throw e;
    } }}/>
    </>);
}
function GuestView({ guest: g, manage, onClose, onEdit, onToggle, onDelete }) {
    const stays = useFetch(() => reservationApi.byGuest(g._id), [g?._id], !!g);
    const p = g?.preferences ?? {};
    return (<Modal wide open={!!g} onClose={onClose} title={g ? nameOf(g) : 'Guest'}>
      {g && <div className="space-y-6">
        <DetailGrid><Detail label="Email">{g.email}</Detail><Detail label="Phone">{g.phone}</Detail><Detail label="Date of birth">{g.dateOfBirth ? formatDate(g.dateOfBirth) : ''}</Detail><Detail label="Gender">{g.gender}</Detail><Detail label="Address">{[g.address, g.city, g.country].filter(Boolean).join(', ')}</Detail><Detail label="Status"><StatusBadge status={g.isActive === false ? 'INACTIVE' : 'ACTIVE'}/></Detail></DetailGrid>
        <div><p className="eyebrow mb-3">Preferences</p><DetailGrid cols={3}><Detail label="Bed">{p.roomPreference}</Detail><Detail label="Smoking">{p.smokingPreference}</Detail><Detail label="Floor">{p.floorPreference}</Detail><Detail label="Special requests">{p.specialRequests}</Detail><Detail label="Dietary">{p.dietaryRequirements}</Detail><Detail label="Staff notes">{g.notes}</Detail></DetailGrid></div>
        <div><p className="eyebrow mb-3">Reservations</p>
          {stays.loading ? <Skeleton className="h-16"/> : !stays.data?.length ? <p className="text-sm text-mist">No reservations yet.</p> : <ul className="divide-y divide-wash/10">{stays.data.slice(0, 5).map(r => <li key={r._id}><Link to={`/portal/reservations/${r._id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-gold-ink"><span>{r.bookingId} · {formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)}</span><StatusBadge status={r.status}/></Link></li>)}</ul>}</div>
        <div className="flex flex-wrap justify-end gap-2"><Link to="/portal/reservations/new" className="btn-glass">New reservation</Link><Button variant="outline" onClick={() => onEdit(g)}>Edit</Button>{manage && <><Button variant="glass" onClick={() => onToggle(g)}>{g.isActive === false ? 'Activate' : 'Deactivate'}</Button><Button variant="danger" onClick={() => onDelete(g)}>Delete</Button></>}</div>
      </div>}
    </Modal>);
}
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '', address: '', city: '', country: '', roomPreference: '', smokingPreference: 'Non-Smoking', floorPreference: 'No Preference', specialRequests: '', dietaryRequirements: '', notes: '' };
function GuestFormModal({ open, guest, onClose, onSaved }) {
    const toast = useToast();
    const init = () => guest ? { firstName: guest.firstName ?? '', lastName: guest.lastName ?? '', email: guest.email ?? '', phone: guest.phone ?? '', dateOfBirth: toInputDate(guest.dateOfBirth), gender: guest.gender ?? '', address: guest.address ?? '', city: guest.city ?? '', country: guest.country ?? '', roomPreference: guest.preferences?.roomPreference ?? '', smokingPreference: guest.preferences?.smokingPreference || 'Non-Smoking', floorPreference: guest.preferences?.floorPreference || 'No Preference', specialRequests: guest.preferences?.specialRequests ?? '', dietaryRequirements: guest.preferences?.dietaryRequirements ?? '', notes: guest.notes ?? '' } : EMPTY;
    const f = useForm(init(), validateGuest);
    const v = f.values, e = f.errors;
    useEffect(() => { if (open)
        f.reset(init()); }, [open, guest?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (ev) => {
        ev.preventDefault();
        f.submit(async (x) => {
            const preferences = { smokingPreference: x.smokingPreference, floorPreference: x.floorPreference, specialRequests: x.specialRequests.trim(), dietaryRequirements: x.dietaryRequirements.trim() };
            if (x.roomPreference)
                preferences.roomPreference = x.roomPreference; // the server rejects an empty bed preference
            const body = { firstName: x.firstName.trim(), lastName: x.lastName.trim(), email: x.email.trim().toLowerCase(), phone: x.phone.trim(), dateOfBirth: x.dateOfBirth || undefined, gender: x.gender, address: x.address.trim(), city: x.city.trim(), country: x.country.trim(), preferences, notes: x.notes.trim() };
            guest ? await guestApi.update(guest._id, body) : await guestApi.create(body);
            toast.success(guest ? 'Guest updated' : 'Guest created');
            onSaved();
            onClose();
        });
    };
    const I = (k, label, extra = {}) => <Input label={label} value={v[k]} onChange={f.onChange(k)} onBlur={f.onBlur(k)} error={e[k]} {...extra}/>;
    return (<Modal wide open={open} onClose={onClose} title={guest ? `Edit ${nameOf(guest)}` : 'Add guest'}>
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        {I('firstName', 'First name', { required: true })}{I('lastName', 'Last name', { required: true })}{I('email', 'Email', { type: 'email', required: true })}{I('phone', 'Phone', { type: 'tel', required: true })}
        {I('dateOfBirth', 'Date of birth', { type: 'date', max: todayISO() })}
        <Select label="Gender" value={v.gender} onChange={f.onChange('gender')}><option value="">Not specified</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</Select>
        <div className="sm:col-span-2">{I('address', 'Address')}</div>{I('city', 'City')}{I('country', 'Country')}
        <div className="border-t border-wash/10 pt-4 sm:col-span-2"><p className="eyebrow">Preferences</p></div>
        <Select label="Bed" value={v.roomPreference} onChange={f.onChange('roomPreference')}><option value="">No preference</option>{ROOM_PREFERENCES.map(x => <option key={x}>{x}</option>)}</Select>
        <Select label="Smoking" value={v.smokingPreference} onChange={f.onChange('smokingPreference')}>{SMOKING_PREFERENCES.map(x => <option key={x}>{x}</option>)}</Select>
        <Select label="Floor" value={v.floorPreference} onChange={f.onChange('floorPreference')}>{FLOOR_PREFERENCES.map(x => <option key={x}>{x}</option>)}</Select>
        {I('dietaryRequirements', 'Dietary requirements')}
        <div className="sm:col-span-2"><Textarea label="Special requests" rows={2} maxLength={500} value={v.specialRequests} onChange={f.onChange('specialRequests')} error={e.specialRequests}/></div>
        <div className="sm:col-span-2"><Textarea label="Staff notes" rows={2} maxLength={500} value={v.notes} onChange={f.onChange('notes')} error={e.notes}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>{guest ? 'Save changes' : 'Create guest'}</Button></div>
      </form>
    </Modal>);
}
