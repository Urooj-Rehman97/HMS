import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
export function useAuth() { const c = useContext(AuthContext); if (!c)
    throw new Error('useAuth must be used inside <AuthProvider>'); return c; }
