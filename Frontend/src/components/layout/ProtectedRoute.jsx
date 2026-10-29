import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
/** Guards a route: requires a session and (optionally) one of `roles`. The session is read synchronously from sessionStorage, so there is no loading flash. */
export default function ProtectedRoute({ roles, children }) {
    const { user } = useAuth();
    const loc = useLocation();
    if (!user)
        return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }}/>;
    if (roles && !roles.includes(user.role))
        return (<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center">
      <ShieldAlert className="text-gold-ink" size={36}/><h1 className="text-3xl">Access restricted</h1>
      <p className="max-w-sm text-sm text-mist">Your role doesn’t have permission to view this page.</p>
      <Link to="/portal" className="btn-outline mt-2">Back to dashboard</Link>
    </div>);
    return <>{children}</>;
}
/** Login / Register are pointless when already signed in - send those users to their dashboard. */
export function GuestOnly({ children }) {
    const { user } = useAuth();
    const loc = useLocation();
    if (user)
        return <Navigate to={loc.state?.from || '/portal'} replace/>;
    return <>{children}</>;
}
