'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, RegistrationResponse } from '@/types';
import { getCurrentUser, login as apiLogin, logoutSession, register as apiRegister,
    switchToOrganization as apiSwitchToOrganization, stopActingAsOrganization as apiStopActing } from '@/lib/api';

interface AuthState {
    user: Omit<User, 'password'> | null;
    token: string | null;
    isLoading: boolean;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, role: 'talent' | 'provider') => Promise<RegistrationResponse>;
    logout: () => Promise<void>;
    switchToOrganization: (organizationId: string) => Promise<void>;
    stopActingAsOrganization: () => Promise<void>;
    isTalent: boolean;
    isProvider: boolean;
    isOrganizer: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isLoading: true,
    });

    useEffect(() => {
        getCurrentUser()
            .then((user) => {
                localStorage.setItem('usher_user', JSON.stringify(user));
                setState({ user, token: null, isLoading: false });
            })
            .catch(() => {
                localStorage.removeItem('usher_user');
                setState({ user: null, token: null, isLoading: false });
            });
    }, []);

    const persist = (user: Omit<User, 'password'>) => {
        localStorage.setItem('usher_user', JSON.stringify(user));
        setState({ user, token: null, isLoading: false });
    };

    const login = useCallback(async (email: string, password: string) => {
        const res = await apiLogin(email, password);
        persist(res.user);
    }, []);

    const register = useCallback(async (email: string, password: string, role: 'talent' | 'provider') => {
        return apiRegister(email, password, role);
    }, []);

    const logout = useCallback(async () => {
        await logoutSession().catch(() => undefined);
        localStorage.removeItem('usher_user');
        localStorage.removeItem('usher_auth');
        setState({ user: null, token: null, isLoading: false });
    }, []);

    const switchToOrganization = useCallback(async (organizationId: string) => {
        await apiSwitchToOrganization(organizationId);
        persist(await getCurrentUser());
    }, []);

    const stopActingAsOrganization = useCallback(async () => {
        await apiStopActing();
        persist(await getCurrentUser());
    }, []);

    useEffect(() => {
        window.addEventListener('usher:unauthorized', logout);
        return () => window.removeEventListener('usher:unauthorized', logout);
    }, [logout]);

    const value: AuthContextType = {
        ...state,
        login,
        register,
        logout,
        switchToOrganization,
        stopActingAsOrganization,
        isTalent: state.user?.role === UserRole.TALENT,
        isProvider: state.user?.role === UserRole.PROVIDER || state.user?.role === UserRole.PROVIDER_MEMBER || state.user?.role === UserRole.PROVIDER_SUPERVISOR,
        isOrganizer: state.user?.role === UserRole.PROVIDER,
        isAdmin: state.user?.role === UserRole.ADMIN,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
