import ScrollToTop from './components/ScrollToTop';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/common/Toast';

export default function App() {
    return (<ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <ScrollToTop />
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>);
}
