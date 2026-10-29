import { lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PageFallback } from '../../components/common/EmptyState';
const Admin = lazy(() => import('./AdminDashboard'));
const Receptionist = lazy(() => import('./ReceptionistDashboard'));
const Housekeeping = lazy(() => import('./HousekeepingDashboard'));
const Guest = lazy(() => import('./GuestDashboard'));
/** /portal - shows the dashboard that fits the logged-in role. (Admin and Manager share one: the data they may see is identical.) */
export default function Dashboard() {
    const { user } = useAuth();
    if (!user)
        return null;
    const Page = user.role === 'admin' || user.role === 'manager' ? Admin : user.role === 'receptionist' ? Receptionist : user.role === 'housekeeping' ? Housekeeping : Guest;
    return <Suspense fallback={<PageFallback />}><Page /></Suspense>;
}
