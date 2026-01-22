import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get API URL from app.json extra config (production) or fallback to dev
const ENV_API_URL = Constants.expoConfig?.extra?.apiUrl;

// Fallback for local development
// Use the computer's local IP address for physical device testing
const LOCAL_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
// Replace with your actual machine IP if testing on real device
const DEV_API_URL = 'https://tiye-backend.onrender.com';

const BASE_URL = ENV_API_URL || DEV_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
    onUnauthorized = handler;
};

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log(`🚫 ${error.response?.status === 401 ? 'Unauthorized' : 'Forbidden'}! Logging out...`);
            if (onUnauthorized) onUnauthorized();
        }
        return Promise.reject(error);
    }
);

export default api;
