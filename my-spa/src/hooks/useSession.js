import { useCallback } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useSession() {
    const { setSession } = useAuth();

    const loadSession = useCallback(async () => {
        try {
            const s = await apiFetch('/session/', { method: 'GET' });
            setSession({
                isAdmin: Boolean(s.is_admin),
                isAuthenticated: Boolean(s.is_authenticated),
                hasClientSession: Boolean(s.has_client_session),
                loaded: true,
            });
        } catch {
            setSession({
                isAdmin: false,
                isAuthenticated: false,
                hasClientSession: false,
                loaded: true,
            });
        }
    }, [setSession]);

    return { loadSession };
}
