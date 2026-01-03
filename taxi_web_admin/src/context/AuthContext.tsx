import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    profile_photo?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
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

    const login = async (email: string, password: string) => {
        try {
            const res = await api.post('/login', { email, password });
            if (res.data.success && (res.data.user.role === 'admin' || res.data.user.role === 'super_admin')) {
                setUser(res.data.user);
                localStorage.setItem('admin_token', res.data.token);
                localStorage.setItem('admin_user', JSON.stringify(res.data.user));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
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
