export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'passenger' | 'driver';
}

export interface Ride {
    id: number;
    passenger_id: number;
    driver_id?: number;
    pickup_location: string;
    destination: string;
    status: 'pending' | 'accepted' | 'completed' | 'cancelled';
    created_at: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: User;
}

export interface RideResponse {
    success: boolean;
    message?: string;
    rides?: Ride[];
}
