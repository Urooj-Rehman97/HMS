import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import Layout from '../components/layout/Layout';
import ProtectedRoute, { GuestOnly } from '../components/layout/ProtectedRoute';
import { PageFallback } from '../components/common/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { ADMIN_MGR, HOUSE, OPS, STAFF } from '../utils/permissions';
const L = {
    Home: lazy(() => import('../pages/Public/Home')),
    Rooms: lazy(() => import('../pages/Public/Rooms')),
    Reserve: lazy(() => import('../pages/Public/Reserve')),
    About: lazy(() => import('../pages/Public/About')),
    Contact: lazy(() => import('../pages/Public/Contact')),
    PublicGallery: lazy(() => import('../pages/Public/PublicGallery')),
    NotFound: lazy(() => import('../pages/Public/NotFound')),
    Login: lazy(() => import('../pages/Auth/Login')),
    Register: lazy(() => import('../pages/Auth/Register')),
    Forgot: lazy(() => import('../pages/Auth/ForgotPassword')),
    Reset: lazy(() => import('../pages/Auth/ResetPassword')),
    StaffSetup: lazy(() => import('../pages/Auth/StaffSetup')),
    Dashboard: lazy(() => import('../pages/Dashboard/Dashboard')),
    Reservations: lazy(() => import('../pages/Reservations/Reservations')),
    NewReservation: lazy(() => import('../pages/Reservations/NewReservation')),
    Availability: lazy(() => import('../pages/Reservations/Availability')),
    ReservationDetails: lazy(() => import('../pages/Reservations/ReservationDetails')),
    Rooms_: lazy(() => import('../pages/Rooms/Rooms')),
    RoomTypes: lazy(() => import('../pages/Rooms/RoomTypes')),
    RoomStatus: lazy(() => import('../pages/Rooms/RoomStatus')),
    RoomDetails: lazy(() => import('../pages/Rooms/RoomDetails')),
    Guests: lazy(() => import('../pages/Users/Guests')),
    Users: lazy(() => import('../pages/Users/Users')),
    Staff: lazy(() => import('../pages/Users/Staff')),
    UserDetails: lazy(() => import('../pages/Users/UserDetails')),
    CheckIn: lazy(() => import('../pages/FrontDesk/CheckIn')),
    CheckOut: lazy(() => import('../pages/FrontDesk/CheckOut')),
    WalkIn: lazy(() => import('../pages/FrontDesk/WalkIn')),
    Bills: lazy(() => import('../pages/Billing/Bills')),
    Invoice: lazy(() => import('../pages/Billing/Invoice')),
    Payment: lazy(() => import('../pages/Billing/Payment')),
    Tasks: lazy(() => import('../pages/Housekeeping/Tasks')),
    CleaningSchedule: lazy(() => import('../pages/Housekeeping/CleaningSchedule')),
    TaskDetails: lazy(() => import('../pages/Housekeeping/TaskDetails')),
    Maintenance: lazy(() => import('../pages/Maintenance/Requests')),
    MaintenanceDetails: lazy(() => import('../pages/Maintenance/RequestDetails')),
    Services: lazy(() => import('../pages/Services/Services')),
    ServiceRequests: lazy(() => import('../pages/Services/ServiceRequests')),
    ServiceDetails: lazy(() => import('../pages/Services/ServiceDetails')),
    Feedback: lazy(() => import('../pages/Feedback/Feedback')),
    Reports: lazy(() => import('../pages/Reports/Reports')),
    OccupancyReport: lazy(() => import('../pages/Reports/OccupancyReport')),
    RevenueReport: lazy(() => import('../pages/Reports/RevenueReport')),
    GuestReport: lazy(() => import('../pages/Reports/GuestReport')),
    Notifications: lazy(() => import('../pages/Notifications/Notifications')),
    GalleryAdmin: lazy(() => import('../pages/Gallery/Gallery')),
    Settings: lazy(() => import('../pages/Settings/Settings')),
    RoomRates: lazy(() => import('../pages/Settings/RoomRates')),
    Taxes: lazy(() => import('../pages/Settings/Taxes')),
    Policies: lazy(() => import('../pages/Settings/Policies')),
    Profile: lazy(() => import('../pages/Profile/Profile')),
};
const guard = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;
/** Staff who open the guest booking page are sent to the staff booking form instead. */
function ReserveGate() { const { user } = useAuth(); return user && user.role !== 'guest' ? <Navigate to="/portal/reservations/new" replace/> : <ProtectedRoute><L.Reserve /></ProtectedRoute>; }
export default function AppRoutes() {
    return (<Suspense fallback={<PageFallback />}>
      <Routes>
        {/* ---------- public website ---------- */}
        <Route element={<PublicLayout />}>
          <Route index element={<L.Home />}/>
          <Route path="rooms" element={<L.Rooms />}/>
          <Route path="gallery" element={<L.PublicGallery />}/>
          <Route path="about" element={<L.About />}/>
          <Route path="contact" element={<L.Contact />}/>
          <Route path="reserve" element={<ReserveGate />}/>
        </Route>

        {/* ---------- authentication ---------- */}
        <Route path="login" element={<GuestOnly><L.Login /></GuestOnly>}/>
        <Route path="register" element={<GuestOnly><L.Register /></GuestOnly>}/>
        <Route path="forgot-password" element={<L.Forgot />}/>
        <Route path="reset-password" element={<L.Reset />}/>
        <Route path="reset-password/:token" element={<L.Reset />}/>
        <Route path="staff/setup" element={<L.StaffSetup />}/>

        {/* ---------- portal (needs login) ---------- */}
        <Route path="portal" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<L.Dashboard />}/>

          <Route path="reservations" element={guard([...OPS, 'guest'], <L.Reservations />)}/>
          <Route path="reservations/new" element={guard(OPS, <L.NewReservation />)}/>
          <Route path="reservations/availability" element={guard(OPS, <L.Availability />)}/>
          <Route path="reservations/:id" element={guard([...OPS, 'guest'], <L.ReservationDetails />)}/>

          <Route path="rooms" element={guard(STAFF, <L.Rooms_ />)}/>
          <Route path="rooms/types" element={guard(STAFF, <L.RoomTypes />)}/>
          <Route path="rooms/status" element={guard(STAFF, <L.RoomStatus />)}/>
          <Route path="rooms/:id" element={guard(STAFF, <L.RoomDetails />)}/>

          <Route path="guests" element={guard(OPS, <L.Guests />)}/>
          <Route path="users" element={guard(ADMIN_MGR, <L.Users />)}/>
          <Route path="users/:id" element={guard(ADMIN_MGR, <L.UserDetails />)}/>
          <Route path="staff" element={guard(ADMIN_MGR, <L.Staff />)}/>

          <Route path="check-in" element={guard(OPS, <L.CheckIn />)}/>
          <Route path="check-out" element={guard(OPS, <L.CheckOut />)}/>
          <Route path="walk-in" element={guard(OPS, <L.WalkIn />)}/>

          <Route path="billing" element={guard([...OPS, 'guest'], <L.Bills />)}/>
          <Route path="billing/:id" element={guard([...OPS, 'guest'], <L.Invoice />)}/>
          <Route path="billing/:id/payment" element={guard(OPS, <L.Payment />)}/>

          <Route path="housekeeping" element={guard([...HOUSE, 'receptionist'], <L.Tasks />)}/>
          <Route path="housekeeping/schedule" element={guard([...HOUSE, 'receptionist'], <L.CleaningSchedule />)}/>
          <Route path="housekeeping/:id" element={guard([...HOUSE, 'receptionist'], <L.TaskDetails />)}/>

          <Route path="maintenance" element={<L.Maintenance />}/>
          <Route path="maintenance/:id" element={guard(STAFF, <L.MaintenanceDetails />)}/>

          <Route path="services" element={<L.Services />}/>
          <Route path="services/requests" element={<L.ServiceRequests />}/>
          <Route path="services/requests/:id" element={<L.ServiceDetails />}/>

          <Route path="feedback" element={guard([...OPS, 'guest'], <L.Feedback />)}/>

          <Route path="reports" element={guard(OPS, <L.Reports />)}/>
          <Route path="reports/occupancy" element={guard(ADMIN_MGR, <L.OccupancyReport />)}/>
          <Route path="reports/revenue" element={guard(ADMIN_MGR, <L.RevenueReport />)}/>
          <Route path="reports/guests" element={guard(OPS, <L.GuestReport />)}/>

          <Route path="gallery" element={guard(ADMIN_MGR, <L.GalleryAdmin />)}/>
          <Route path="notifications" element={<L.Notifications />}/>
          <Route path="settings" element={guard(ADMIN_MGR, <L.Settings />)}/>
          <Route path="settings/rates" element={guard(ADMIN_MGR, <L.RoomRates />)}/>
          <Route path="settings/taxes" element={guard(ADMIN_MGR, <L.Taxes />)}/>
          <Route path="settings/policies" element={guard(ADMIN_MGR, <L.Policies />)}/>
          <Route path="profile" element={<L.Profile />}/>
          <Route path="*" element={<Navigate to="/portal" replace/>}/>
        </Route>

        <Route path="*" element={<L.NotFound />}/>
      </Routes>
    </Suspense>);
}
