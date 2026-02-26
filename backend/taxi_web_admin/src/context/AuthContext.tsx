import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { ROLE_PERMISSIONS } from '../utils/rbac';

interface User {
    id: string;
    username: string;
    name: string;
    email: string | null;
    phone?: string;
    role: string;
    profile_photo?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('admin_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (identifier: string, password: string) => {
        try {
            console.log('Attempting login for:', identifier);
            const res = await api.post('/login', { identifier, password });
            console.log('Login API Response:', res.data);

            const userRole = res.data.user?.role;
            const isStaff = userRole && ROLE_PERMISSIONS[userRole] && userRole !== 'driver' && userRole !== 'passenger';
            console.log('Is Staff Role?', isStaff, 'Role:', userRole);

            if (res.data.success && isStaff) {
                setUser(res.data.user);
                localStorage.setItem('admin_token', res.data.token);
                localStorage.setItem('admin_user', JSON.stringify(res.data.user));
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Login error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config?.url
            });
            return false;
        }
    };

    const logout = async () => {
        try {
            // Call backend to update is_online status
            await api.post('/logout');
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear local state
            setUser(null);
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
