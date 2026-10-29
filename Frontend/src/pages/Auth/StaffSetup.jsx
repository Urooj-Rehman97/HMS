import AuthShell from '../../components/layout/AuthShell';
import SetPasswordForm from '../../components/auth/SetPasswordForm';
import { useSearchParams } from 'react-router-dom';
import { authApi } from '../../services';
/** Staff invitation: an admin creates the account, the server e-mails /staff/setup?token=... and the new staff member sets a password here (POST /auth/staff/setup). */
export default function StaffSetup() {
    const [q] = useSearchParams();
    return (<AuthShell title="Activate your staff account" subtitle="Welcome to the team. Choose a password to finish setting up your account.">
      <SetPasswordForm token={q.get('token') || ''} submitLabel="Activate account" onSubmit={authApi.staffSetup} doneState={{ reset: true }}/>
    </AuthShell>);
}
