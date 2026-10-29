import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/layout/AuthShell';
import { Input, PasswordInput } from '../../components/Field';
import { Button } from '../../components/ui';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { validateLogin } from '../../utils/validators';
export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const toast = useToast();
    const state = (useLocation().state ?? {});
    const f = useForm({ email: state.email ?? '', password: '' }, validateLogin);
    const onSubmit = async (e) => { e.preventDefault(); await f.submit(async (v) => { const u = await login(v.email, v.password); toast.success(`Welcome back, ${u.firstName || u.fullName}!`); nav(state.from && state.from !== '/login' ? state.from : '/portal', { replace: true }); });};
    return (<AuthShell title="Welcome back" subtitle="Sign in to manage your stays and requests." footer={<>New to LuxuryStay? <Link to="/register" className="text-gold-ink hover:underline">Create an account</Link></>}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {state.registered && <Alert kind="success">Account created. Please sign in to continue.</Alert>}
        {state.reset && <Alert kind="success">Password updated. You can sign in now.</Alert>}
        {f.formError && <Alert kind="error">{f.formError}</Alert>}
        <Input label="Email" type="email" autoComplete="email" inputMode="email" required value={f.values.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} error={f.errors.email} placeholder="you@example.com"/>
        <PasswordInput label="Password" autoComplete="current-password" required value={f.values.password} onChange={f.onChange('password')} onBlur={f.onBlur('password')} error={f.errors.password}/>
        <div className="text-right text-xs"><Link to="/forgot-password" className="text-mist hover:text-gold-ink">Forgot password?</Link></div>
        <Button type="submit" loading={f.submitting} className="w-full">{f.submitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </AuthShell>);
}
