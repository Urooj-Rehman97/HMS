import { Link, useParams, useSearchParams } from 'react-router-dom';
import AuthShell from '../../components/layout/AuthShell';
import SetPasswordForm from '../../components/auth/SetPasswordForm';
import { authApi } from '../../services';
/** POST /auth/reset-password {token,password,confirmPassword}. The server's e-mail link is /reset-password?token=...; /reset-password/:token also works. */
export default function ResetPassword() {
    const params = useParams();
    const [q] = useSearchParams();
    const token = q.get('token') || params.token || '';
    return (<AuthShell title="Choose a new password" subtitle="Pick something strong that you have not used elsewhere." footer={<Link to="/login" className="text-gold-ink hover:underline">Back to sign in</Link>}>
      <SetPasswordForm token={token} submitLabel="Update password" onSubmit={authApi.resetPassword} doneState={{ reset: true }}/>
    </AuthShell>);
}
