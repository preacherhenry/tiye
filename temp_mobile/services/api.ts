import axios from 'axios';

// For Android Emulator, use 10.0.2.2 to access host localhost
// For iOS Simulator, use localhost
// For Physical Device, use your machine's LAN IP (e.g., http://192.168.x.x:5000)
const API_URL = 'http://10.0.2.2:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
