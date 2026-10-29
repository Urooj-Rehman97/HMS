import { useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import { Panel } from '../../components/common/Detail';
import { Input, PasswordInput, Select } from '../../components/Field';
import PasswordStrength from '../../components/auth/PasswordStrength';
import { Button, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { authApi, userApi } from '../../services';
import { GENDERS, ROLE_LABEL } from '../../utils/constants';
import { toInputDate, todayISO } from '../../utils/formatDate';
import { validatePasswordChange, validateProfile } from '../../utils/validators';
/** Own account: GET /auth/me · PUT /my/profile · PATCH /auth/change-password. The navbar name updates immediately after saving. */
export default function Profile() {
    const { user, updateUser } = useAuth();
    const toast = useToast();
    const me = useFetch(async () => (await authApi.me()).raw, []);
    const p = useForm({ firstName: '', lastName: '', phone: '', dateOfBirth: '', gender: '', address: '', city: '', country: '' }, validateProfile);
    const pw = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' }, validatePasswordChange);
    useEffect(() => { const u = me.data; if (u)
        p.setValues({ firstName: u.firstName ?? '', lastName: u.lastName ?? '', phone: u.phone ?? '', dateOfBirth: toInputDate(u.dateOfBirth), gender: u.gender ?? '', address: u.address ?? '', city: u.city ?? '', country: u.country ?? '' }); }, [me.data]); // eslint-disable-line react-hooks/exhaustive-deps
    const saveProfile = (e) => {
        e.preventDefault();
        p.submit(async (v) => {
            const u = await userApi.updateMine({ firstName: v.firstName.trim(), lastName: v.lastName.trim(), phone: v.phone.trim(), dateOfBirth: v.dateOfBirth || '', gender: v.gender, address: v.address.trim(), city: v.city.trim(), country: v.country.trim() });
            updateUser({ firstName: u.firstName, lastName: u.lastName, phone: u.phone ?? '' });
            toast.success('Profile updated');
        });
    };
    const savePw = (e) => { e.preventDefault(); pw.submit(async (v) => { await authApi.changePassword(v.currentPassword, v.newPassword, v.confirmPassword); toast.success('Password changed'); pw.reset(); }); };
    const a = p.values, ea = p.errors, b = pw.values, eb = pw.errors;
    return (<>
      <PageHeader title="My profile" sub={user ? `${user.email} · ${ROLE_LABEL[user.role]}` : ''} actions={user && <StatusBadge status="ACTIVE"/>}/>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Personal details">
          {me.loading ? <Skeleton className="h-64"/> : (<form onSubmit={saveProfile} noValidate className="grid gap-4 sm:grid-cols-2">
              {p.formError && <div className="sm:col-span-2"><Alert kind="error">{p.formError}</Alert></div>}
              <Input label="First name" required value={a.firstName} onChange={p.onChange('firstName')} onBlur={p.onBlur('firstName')} error={ea.firstName}/><Input label="Last name" required value={a.lastName} onChange={p.onChange('lastName')} onBlur={p.onBlur('lastName')} error={ea.lastName}/>
              <Input label="Email" value={user?.email ?? ''} disabled hint="E-mail cannot be changed here."/><Input label="Phone" type="tel" value={a.phone} onChange={p.onChange('phone')} onBlur={p.onBlur('phone')} error={ea.phone}/>
              <Input label="Date of birth" type="date" max={todayISO()} value={a.dateOfBirth} onChange={p.onChange('dateOfBirth')} error={ea.dateOfBirth}/><Select label="Gender" value={a.gender} onChange={p.onChange('gender')}><option value="">Not specified</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</Select>
              <div className="sm:col-span-2"><Input label="Address" maxLength={200} value={a.address} onChange={p.onChange('address')} error={ea.address}/></div><Input label="City" value={a.city} onChange={p.onChange('city')}/><Input label="Country" value={a.country} onChange={p.onChange('country')}/>
              <div className="sm:col-span-2"><Button type="submit" loading={p.submitting}>Save profile</Button></div>
            </form>)}
        </Panel>
        <Panel title="Change password">
          <form onSubmit={savePw} noValidate className="space-y-4">
            {pw.formError && <Alert kind="error">{pw.formError}</Alert>}
            <PasswordInput label="Current password" autoComplete="current-password" value={b.currentPassword} onChange={pw.onChange('currentPassword')} onBlur={pw.onBlur('currentPassword')} error={eb.currentPassword}/>
            <div><PasswordInput label="New password" autoComplete="new-password" maxLength={64} value={b.newPassword} onChange={pw.onChange('newPassword')} onBlur={pw.onBlur('newPassword')} error={eb.newPassword} hint="8+ characters with upper-case, lower-case and a number."/><PasswordStrength value={b.newPassword}/></div>
            <PasswordInput label="Confirm new password" autoComplete="new-password" maxLength={64} value={b.confirmPassword} onChange={pw.onChange('confirmPassword')} onBlur={pw.onBlur('confirmPassword')} error={eb.confirmPassword}/>
            <Button type="submit" loading={pw.submitting}>Update password</Button>
          </form>
        </Panel>
      </div>
    </>);
}
