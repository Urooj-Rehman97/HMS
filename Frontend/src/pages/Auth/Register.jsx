import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/layout/AuthShell';
import { Input, PasswordInput } from '../../components/Field';
import { Button } from '../../components/ui';
import Alert from '../../components/common/Alert';
import PasswordStrength from '../../components/auth/PasswordStrength';
import { useForm } from '../../hooks/useForm';
import { authApi, ApiError } from '../../services';
import { validateRegister } from '../../utils/validators';
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', address: '', city: '', country: '', agree: false };
export default function Register() {
    const nav = useNavigate();
    const f = useForm(EMPTY, validateRegister);
    const { values: v, errors: e } = f;
    const onSubmit = async (ev) => { ev.preventDefault(); await f.submit(async (val) => { try { await authApi.register({ firstName: val.firstName.trim(), lastName: val.lastName.trim(), email: val.email.trim().toLowerCase(), phone: val.phone.trim(), password: val.password, confirmPassword: val.confirmPassword, address: val.address.trim() || undefined, city: val.city.trim() || undefined, country: val.country.trim() || undefined }); } catch (err) { const a = err; if (a.status === 409 && !a.fields.email)  throw new ApiError(a.message, 409, { email: 'An account with this email already exists. Try signing in instead.' }); throw err; }
            nav('/login', { replace: true, state: { registered: true, email: val.email.trim().toLowerCase() } }); }); };
    return (<AuthShell wide title="Create your account" subtitle="Register as a guest to book rooms and request services." footer={<>Already registered? <Link to="/login" className="text-gold-ink hover:underline">Sign in</Link></>}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        <Input label="First name" autoComplete="given-name" required maxLength={50} value={v.firstName} onChange={f.onChange('firstName')} onBlur={f.onBlur('firstName')} error={e.firstName}/>
        <Input label="Last name" autoComplete="family-name" required maxLength={50} value={v.lastName} onChange={f.onChange('lastName')} onBlur={f.onBlur('lastName')} error={e.lastName}/>
        <Input label="Email" type="email" autoComplete="email" inputMode="email" required value={v.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} error={e.email} placeholder="you@example.com"/>
        <Input label="Phone" type="tel" autoComplete="tel" inputMode="tel" required value={v.phone} onChange={f.onChange('phone')} onBlur={f.onBlur('phone')} error={e.phone} placeholder="+92 300 1234567"/>
        <div><PasswordInput label="Password" autoComplete="new-password" required maxLength={64} value={v.password} onChange={f.onChange('password')} onBlur={f.onBlur('password')} error={e.password} hint="8+ characters with upper-case, lower-case and a number."/><PasswordStrength value={v.password}/></div>
        <PasswordInput label="Confirm password" autoComplete="new-password" required maxLength={64} value={v.confirmPassword} onChange={f.onChange('confirmPassword')} onBlur={f.onBlur('confirmPassword')} error={e.confirmPassword}/>
        <div className="sm:col-span-2"><Input label="Address (optional)" autoComplete="street-address" maxLength={200} value={v.address} onChange={f.onChange('address')} onBlur={f.onBlur('address')} error={e.address}/></div>
        <Input label="City (optional)" autoComplete="address-level2" value={v.city} onChange={f.onChange('city')} onBlur={f.onBlur('city')} error={e.city}/>
        <Input label="Country (optional)" autoComplete="country-name" value={v.country} onChange={f.onChange('country')} onBlur={f.onBlur('country')} error={e.country}/>
        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-sm text-mist"><input type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--gold))]" checked={v.agree} onChange={f.onChange('agree')} onBlur={f.onBlur('agree')}/>
            <span>I agree to the booking terms and privacy policy.</span></label>
          {e.agree && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-300">{e.agree}</p>}
        </div>
        <div className="sm:col-span-2"><Button type="submit" loading={f.submitting} className="w-full">{f.submitting ? 'Creating account…' : 'Create account'}</Button></div>
      </form>
    </AuthShell>);
}
