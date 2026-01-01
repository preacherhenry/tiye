import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'passenger' | 'driver';
    profile_photo?: string;
    car_model?: string;
    car_color?: string;
    plate_number?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    register: (name: string, phone: string, email: string, password: string, role: string, carModel?: string, carColor?: string, plateNumber?: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
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

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/login', { email, password });
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

    const register = async (name: string, phone: string, email: string, password: string, role: string, carModel?: string, carColor?: string, plateNumber?: string) => {
        try {
            const response = await api.post('/register', {
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

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
