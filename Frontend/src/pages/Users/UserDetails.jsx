import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { Detail, DetailGrid, Panel } from '../../components/common/Detail';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Input, Select } from '../../components/Field';
import { Button, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { userApi } from '../../services';
import { SERVER_ROLE, GENDERS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { nameOf } from '../../utils/entity';
import { nameRule, phoneRule } from '../../utils/validators';
/** GET /users/:id, PUT /users/:id, PATCH /users/:id/(de)activate */
export default function UserDetails() {
    const { id = '' } = useParams();
    const toast = useToast();
    const { user: me } = useAuth();
    const { data: u, loading, error, reload } = useFetch(() => userApi.get(id), [id]);
    const [edit, setEdit] = useState(false);
    const [confirm, setConfirm] = useState(false);
    if (error)
        return <><PageHeader back="/portal/users" title="User"/><ErrorState onRetry={reload} message={error}/></>;
    if (loading || !u)
        return <><PageHeader back="/portal/users" title="User"/><Skeleton className="h-64"/></>;
    const self = u._id === me?._id, active = u.isActive !== false, s = u.staffInfo ?? {}, ec = u.emergencyContact ?? {};
    return (<>
      <PageHeader back="/portal/users" title={nameOf(u)} sub={u.email} actions={<><StatusBadge status={active ? 'ACTIVE' : 'INACTIVE'}/><Button variant="outline" onClick={() => setEdit(true)}>Edit</Button>{!self && <Button variant={active ? 'danger' : 'gold'} onClick={() => setConfirm(true)}>{active ? 'Deactivate' : 'Activate'}</Button>}</>}/>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Account"><DetailGrid><Detail label="Role">{u.role}</Detail><Detail label="Phone">{u.phone}</Detail><Detail label="Gender">{u.gender}</Detail><Detail label="Date of birth">{u.dateOfBirth ? formatDate(u.dateOfBirth) : ''}</Detail><Detail label="Address">{[u.address, u.city, u.country].filter(Boolean).join(', ')}</Detail><Detail label="Joined">{formatDateTime(u.createdAt)}</Detail><Detail label="Last login">{u.lastLogin ? formatDateTime(u.lastLogin) : ''}</Detail></DetailGrid></Panel>
        {(s.employeeId || ec.name) && <Panel title="Staff information"><DetailGrid><Detail label="Employee ID">{s.employeeId}</Detail><Detail label="Department">{s.department}</Detail><Detail label="Designation">{s.designation}</Detail><Detail label="Joining date">{s.joiningDate ? formatDate(s.joiningDate) : ''}</Detail><Detail label="Emergency contact">{ec.name}</Detail><Detail label="Emergency phone">{ec.phone}</Detail></DetailGrid></Panel>}
      </div>
      <EditUser open={edit} u={u} self={self} onClose={() => setEdit(false)} onSaved={() => { toast.success('User updated'); reload(); }}/>
      <ConfirmDialog open={confirm} danger={active} title={active ? 'Deactivate account?' : 'Activate account?'} message={active ? `${nameOf(u)} will no longer be able to sign in.` : `${nameOf(u)} will be able to sign in again.`} confirmLabel={active ? 'Deactivate' : 'Activate'} onClose={() => setConfirm(false)} onConfirm={async () => { try {
        await userApi.setActive(u._id, !active);
        toast.success(active ? 'Account deactivated' : 'Account activated');
        reload();
    }
    catch (e) {
        toast.error(e.message);
        throw e;
    } }}/>
    </>);
}
function EditUser({ open, u, self, onClose, onSaved }) {
    const init = () => ({ firstName: u.firstName ?? '', lastName: u.lastName ?? '', phone: u.phone ?? '', gender: u.gender ?? '', role: u.role ?? 'Guest' });
    const f = useForm(init(), v => ({ firstName: nameRule(v.firstName, 'First name'), lastName: nameRule(v.lastName, 'Last name'), phone: phoneRule(v.phone, false) }));
    useEffect(() => { if (open)
        f.reset(init()); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { await userApi.update(u._id, { firstName: v.firstName.trim(), lastName: v.lastName.trim(), phone: v.phone.trim(), gender: v.gender, ...(self ? {} : { role: v.role }) }); onSaved(); onClose(); }); };
    return (<Modal open={open} onClose={onClose} title="Edit user">
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        <Input label="First name" required value={f.values.firstName} onChange={f.onChange('firstName')} onBlur={f.onBlur('firstName')} error={f.errors.firstName}/>
        <Input label="Last name" required value={f.values.lastName} onChange={f.onChange('lastName')} onBlur={f.onBlur('lastName')} error={f.errors.lastName}/>
        <Input label="Phone" type="tel" value={f.values.phone} onChange={f.onChange('phone')} onBlur={f.onBlur('phone')} error={f.errors.phone}/>
        <Select label="Gender" value={f.values.gender} onChange={f.onChange('gender')}><option value="">Not specified</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</Select>
        <Select label="Role" disabled={self} value={f.values.role} onChange={f.onChange('role')} hint={self ? 'You cannot change your own role.' : undefined}>{Object.values(SERVER_ROLE).map(r => <option key={r}>{r}</option>)}</Select>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Save changes</Button></div>
      </form>
    </Modal>);
}
