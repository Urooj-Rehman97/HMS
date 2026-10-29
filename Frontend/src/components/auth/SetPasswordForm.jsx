import { useNavigate } from 'react-router-dom';
import { PasswordInput } from '../Field';
import { Button } from '../ui';
import Alert from '../common/Alert';
import PasswordStrength from './PasswordStrength';
import { useForm } from '../../hooks/useForm';
import { validateReset } from '../../utils/validators';
/** Shared by ResetPassword and StaffSetup: choose a new password for a token received by e-mail. */
export default function SetPasswordForm({ token, submitLabel, onSubmit, doneState }) {
    const nav = useNavigate();
    const f = useForm({ password: '', confirmPassword: '' }, validateReset);
    const go = async (e) => { e.preventDefault(); await f.submit(async (v) => { await onSubmit(token, v.password, v.confirmPassword); nav('/login', { replace: true, state: doneState }); }); };
    if (!token)
        return <Alert kind="error">This link is missing its security token. Please open the link from your e-mail again, or request a new one.</Alert>;
    return (<form onSubmit={go} noValidate className="space-y-4">
      {f.formError && <Alert kind="error">{f.formError}</Alert>}
      <div><PasswordInput label="New password" autoComplete="new-password" required maxLength={64} value={f.values.password} onChange={f.onChange('password')} onBlur={f.onBlur('password')} error={f.errors.password} hint="8+ characters with upper-case, lower-case and a number."/><PasswordStrength value={f.values.password}/></div>
      <PasswordInput label="Confirm password" autoComplete="new-password" required maxLength={64} value={f.values.confirmPassword} onChange={f.onChange('confirmPassword')} onBlur={f.onBlur('confirmPassword')} error={f.errors.confirmPassword}/>
      <Button type="submit" loading={f.submitting} className="w-full">{f.submitting ? 'Saving…' : submitLabel}</Button>
    </form>);
}
