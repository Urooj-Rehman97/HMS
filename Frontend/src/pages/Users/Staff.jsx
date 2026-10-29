import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { Chips, SearchBox, Toolbar } from '../../components/common/Toolbar';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { Input, Select } from '../../components/Field';
import { Button, StatusBadge } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { userApi } from '../../services';
import { DEPARTMENTS, GENDERS, RELATIONSHIPS, STAFF_ROLES } from '../../utils/constants';
import { todayISO } from '../../utils/formatDate';
import { nameOf } from '../../utils/entity';
import { validateStaff } from '../../utils/validators';
/** Staff = every non-guest account. POST /users/staff creates the user and e-mails an activation link (/staff/setup?token=…). */
export default function Staff() {
    const nav = useNavigate();
    const { data, loading, error, reload } = useFetch(async () => { const all = (await Promise.all(STAFF_ROLES.map(role => userApi.list({ role, limit: 100 })))).flatMap(p => p.items); return [...new Map(all.map(u => [u._id, u])).values()]; }, []);
    const [role, setRole] = useState('All');
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const rows = useMemo(() => (data ?? []).filter(u => (role === 'All' || u.role === role) && (!q.trim() || `${nameOf(u)} ${u.email} ${u.staffInfo?.employeeId ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))).sort((a, b) => nameOf(a).localeCompare(nameOf(b))), [data, role, q]);
    const toast = useToast();
    const [resending, setResending] = useState('');
    const resend = async (event, u) => { event.stopPropagation(); setResending(u._id); try { await userApi.resendInvitation(u._id); toast.success(`Invitation resent to ${u.email}`); } catch (e) { toast.error(e.message); } finally { setResending(''); } };
    const cols = [
        { key: 'n', head: 'Name', render: u => <span className="font-medium">{nameOf(u)}</span> },
        { key: 'id', head: 'Employee ID', hideMobile: true, render: u => u.staffInfo?.employeeId ?? '—' },
        { key: 'r', head: 'Role', render: u => u.role }, { key: 'd', head: 'Department', hideMobile: true, render: u => u.staffInfo?.department ?? '—' },
        { key: 'e', head: 'Email', render: u => <span className="break-all">{u.email}</span> },
        { key: 's', head: 'Status', render: u => <StatusBadge status={u.isActive === false ? 'INACTIVE' : 'ACTIVE'}/> },
        { key: 'invite', head: 'Invitation', render: u => u.mustSetPassword ? <Button variant="glass" className="!px-3 !py-1.5 text-xs" disabled={resending === u._id || u.isActive === false} onClick={e => resend(e, u)}><Mail size={13}/>{resending === u._id ? 'Sending…' : 'Resend'}</Button> : <span className="text-xs text-muted">Accepted</span> },
    ];
    return (<>
      <PageHeader title="Staff" sub="Invite team members and manage their access." actions={<Button onClick={() => setOpen(true)}><UserPlus size={16}/> Invite staff</Button>}/>
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Name, email, employee ID…"/><Chips value={role} onChange={setRole} options={[...STAFF_ROLES]}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl"><Table cols={cols} rows={rows} loading={loading} error={error} onRetry={reload} onRow={u => nav(`/portal/users/${u._id}`)} emptyTitle="No staff found" emptyText="Invite your first team member."/></div>
      <InviteStaff open={open} onClose={() => setOpen(false)} onDone={reload}/>
    </>);
}
const EMPTY = { firstName: '', lastName: '', dateOfBirth: '', gender: '', email: '', phone: '', address: '', city: '', country: '', emergencyName: '', emergencyPhone: '', emergencyRelationship: '', employeeId: '', department: '', designation: '', joiningDate: todayISO(), role: 'Receptionist' };
function InviteStaff({ open, onClose, onDone }) {
    const toast = useToast();
    const f = useForm(EMPTY, validateStaff);
    const v = f.values, e = f.errors;
    useEffect(() => { if (open)
        f.reset({ ...EMPTY, joiningDate: todayISO() }); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (ev) => {
        ev.preventDefault();
        f.submit(async (x) => {
            await userApi.inviteStaff({ firstName: x.firstName.trim(), lastName: x.lastName.trim(), email: x.email.trim().toLowerCase(), phone: x.phone.trim(), role: x.role, gender: x.gender, dateOfBirth: x.dateOfBirth || undefined, address: x.address.trim() || undefined, city: x.city.trim() || undefined, country: x.country.trim() || undefined, employeeId: x.employeeId.trim(), department: x.department, designation: x.designation.trim(), joiningDate: x.joiningDate, emergencyContact: { name: x.emergencyName.trim(), phone: x.emergencyPhone.trim(), relationship: x.emergencyRelationship } });
            toast.success(`Invitation sent to ${x.email.trim()}`);
            onDone();
            onClose();
        });
    };
    const I = (k, label, extra = {}) => <Input label={label} value={v[k]} onChange={f.onChange(k)} onBlur={f.onBlur(k)} error={e[k]} {...extra}/>;
    return (<Modal wide open={open} onClose={onClose} title="Invite a staff member">
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Alert kind="info">We e-mail a secure link so the new staff member can choose their own password. Nobody else ever sees it.</Alert></div>
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        {I('firstName', 'First name', { required: true })}{I('lastName', 'Last name', { required: true })}
        {I('email', 'Work email', { type: 'email', required: true })}{I('phone', 'Phone', { type: 'tel', required: true })}
        {I('dateOfBirth', 'Date of birth', { type: 'date', max: todayISO() })}
        <Select label="Gender" value={v.gender} onChange={f.onChange('gender')}><option value="">Not specified</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</Select>
        {I('employeeId', 'Employee ID', { required: true, placeholder: 'LS-0042', maxLength: 20 })}
        <Select label="Role" required value={v.role} onChange={f.onChange('role')} error={e.role}>{STAFF_ROLES.map(r => <option key={r}>{r}</option>)}</Select>
        <Select label="Department" required value={v.department} onChange={f.onChange('department')} onBlur={f.onBlur('department')} error={e.department}><option value="">Select…</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</Select>
        {I('designation', 'Designation', { required: true, maxLength: 80, placeholder: 'Front Desk Agent' })}
        {I('joiningDate', 'Joining date', { type: 'date', required: true })}
        <div className="sm:col-span-2 border-t border-wash/10 pt-4"><p className="eyebrow">Emergency contact</p></div>
        {I('emergencyName', 'Contact name', { required: true })}{I('emergencyPhone', 'Contact phone', { type: 'tel', required: true })}
        <Select label="Relationship" required value={v.emergencyRelationship} onChange={f.onChange('emergencyRelationship')} onBlur={f.onBlur('emergencyRelationship')} error={e.emergencyRelationship}><option value="">Select…</option>{RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}</Select>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Send invitation</Button></div>
      </form>
    </Modal>);
}
