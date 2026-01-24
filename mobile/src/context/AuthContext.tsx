import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setUnauthorizedHandler } from '../services/api';

interface User {
    id: string;
    username: string;
    name: string;
    email: string | null;
    phone: string;
    role: 'passenger' | 'driver';
    profile_photo?: string;
    car_model?: string;
    car_color?: string;
    plate_number?: string;
    subscription_status?: 'none' | 'pending' | 'active' | 'expired' | 'paused';
    subscription_expiry?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
    register: (username: string, name: string, phone: string, email: string | null, password: string, role: string, carModel?: string, carColor?: string, plateNumber?: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: any) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync('token');
            const storedUser = await SecureStore.getItemAsync('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (identifier: string, password: string) => {
        try {
            const response = await api.post('/login', { identifier, password });
            if (response.data.success) {
                const { token, user } = response.data;
                console.log('🔐 Login successful!');
                console.log('   User data:', JSON.stringify(user, null, 2));
                console.log('   Profile photo:', user.profile_photo);
                setToken(token);
                setUser(user);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                await SecureStore.setItemAsync('token', token);
                await SecureStore.setItemAsync('user', JSON.stringify(user));
                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || error.message };
        }
    };

    const register = async (username: string, name: string, phone: string, email: string | null, password: string, role: string, carModel?: string, carColor?: string, plateNumber?: string) => {
        try {
            const response = await api.post('/register', {
                username,
                name,
                phone,
                email,
                password,
                role,
                car_model: carModel,
                car_color: carColor,
                plate_number: plateNumber
            });

            if (response.data.success) {
                return { success: true, userId: response.data.userId };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || error.message };
        }
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/profile');
            if (res.data.success) {
                const updatedUser = { ...user, ...res.data.user };
                setUser(updatedUser);
                await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
            }
        } catch (error: any) {
            console.error('Failed to refresh user:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                logout();
            }
        }
    };

    useEffect(() => {
        setUnauthorizedHandler(logout);
    }, []);

    // Global Heartbeat to detect suspension/token issues immediately
    useEffect(() => {
        let interval: any;
        if (token && user) {
            interval = setInterval(() => {
                refreshUser().catch((err) => {
                    console.log('💓 Heartbeat refresh failed:', err.message);
                });
            }, 5000); // 5 seconds for "immediate" status updates
        }
        return () => clearInterval(interval);
    }, [token, !!user]);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
