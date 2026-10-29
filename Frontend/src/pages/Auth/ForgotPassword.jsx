import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/layout/AuthShell';
import { Input } from '../../components/Field';
import { Button } from '../../components/ui';
import Alert from '../../components/common/Alert';
import { useForm } from '../../hooks/useForm';
import { authApi } from '../../services';
import { emailRule } from '../../utils/validators';
/** POST /auth/forgot-password - the server e-mails a link to /reset-password?token=... */
export default function ForgotPassword() {
    const [sent, setSent] = useState(false);
    const f = useForm({ email: '' }, v => ({ email: emailRule(v.email) }));
    const onSubmit = async (e) => { e.preventDefault(); if (await f.submit(v => authApi.forgotPassword(v.email.trim().toLowerCase())))
        setSent(true); };
    return (<AuthShell title="Reset your password" subtitle="Enter your email and we will send you a reset link." footer={<Link to="/login" className="text-gold-ink hover:underline">Back to sign in</Link>}>
      {sent ? <Alert kind="success">If an account exists for <strong>{f.values.email}</strong>, a reset link is on its way. Please check your inbox (and spam folder). The link expires after a short time.</Alert> : (<form onSubmit={onSubmit} noValidate className="space-y-4">
          {f.formError && <Alert kind="error">{f.formError}</Alert>}
          <Input label="Email" type="email" autoComplete="email" required value={f.values.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} error={f.errors.email}/>
          <Button type="submit" loading={f.submitting} className="w-full">{f.submitting ? 'Sending…' : 'Send reset link'}</Button>
        </form>)}
    </AuthShell>);
}
