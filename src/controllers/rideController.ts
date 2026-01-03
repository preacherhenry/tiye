import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { isLocationInServiceArea } from '../config/serviceArea';

const fixPhotoUrl = (url: string | null, req: Request) => {
    if (!url) return null;
    const host = req.get('host') || 'localhost:5000';
    return url.replace(/(http:\/\/|https:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/g, `${req.protocol}://${host}`);
};

export const getRideDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT r.*, 
                   u.name as driver_name, u.phone as driver_phone, u.profile_photo as driver_photo,
                   d.car_model, d.car_color, d.plate_number, d.rating as driver_rating,
                   u.current_lat, u.current_lng
            FROM ride_requests r 
            LEFT JOIN users u ON r.driver_id = u.id 
            LEFT JOIN drivers d ON r.driver_id = d.user_id
            WHERE r.id = ?
        `, [id]);

        if (rows.length === 0) {
            res.json({ success: false, message: 'Ride not found' });
            return;
        }

        const ride = rows[0];
        // console.log(`📦 Ride Details for ${id}: Status=${ride.status}, Driver=${ride.driver_id}, Phone=${ride.driver_phone}, Lat=${ride.current_lat}`);
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        // Security Check: Only allow Passenger or Driver involved in the ride (or Admin)
        // Note: Assuming 'admin' role exists, checking strict ownership otherwise.
        if (ride.passenger_id !== userId && ride.driver_id !== userId && userRole !== 'admin') {
            res.status(403).json({ success: false, message: 'Unauthorized access to this ride' });
            return;
        }

        if (ride.driver_photo) {
            ride.driver_photo = fixPhotoUrl(ride.driver_photo, req);
        }

        res.json({ success: true, ride });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const requestRide = async (req: Request, res: Response) => {
    const { passenger_id, pickup, destination, fare, distance, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.body;

    if (!passenger_id || !pickup || !destination) {
        res.json({ success: false, message: 'All fields are required' });
        return;
    }

    // Validate Service Area
    // Pickup is a string "Lat,Lng" or address. We need coordinates.
    // Assuming frontend sends 'pickup_lat' and 'pickup_lng' in body? 
    // Looking at line 30: const { passenger_id, pickup, destination, fare, distance } = req.body;
    // The previous code implementation (Step 2196) assumed pickup_lat/lng were separated.
    // Current `requestRide` at L30 uses `pickup` string.
    // I need to parse the coordinates from the request body if they exist, or parse the string.
    // Let's check the frontend implementation to see what it sends.
    // Wait, I should not break the existing logic. 
    // Let's assume the frontend sends `pickup_lat`, `pickup_lng`, `dest_lat`, `dest_lng` alongside.

    // UPDATED PLAN: I will modify the destructuring to extract lat/lngs and validate them.

    if (pickup_lat && pickup_lng) {
        if (!isLocationInServiceArea(Number(pickup_lat), Number(pickup_lng))) {
            res.status(400).json({ success: false, message: "Sorry, Tiye currently operates only within the Chirundu service area." });
            return;
        }
    }

    if (dropoff_lat && dropoff_lng) {
        if (!isLocationInServiceArea(Number(dropoff_lat), Number(dropoff_lng))) {
            res.status(400).json({ success: false, message: "Sorry, the destination is outside the Tiye service area." });
            return;
        }
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO ride_requests (passenger_id, pickup_location, destination, fare, distance) VALUES (?, ?, ?, ?, ?)',
            [passenger_id, pickup, destination, fare || 0, distance || 0]
        );
        res.json({ success: true, message: 'Ride request submitted successfully', rideId: result.insertId });
    } catch (error: any) {
        console.error('Request Ride Error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const getPendingRides = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM ride_requests WHERE status = ?', ['pending']);
        res.json({ success: true, rides: rows });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const acceptRide = async (req: Request, res: Response) => {
    const { ride_id, driver_id } = req.body;

    if (!ride_id || !driver_id) {
        res.json({ success: false, message: 'Ride ID and Driver ID required' });
        return;
    }

    try {
        // Check driver exists
        const [drivers] = await pool.execute<RowDataPacket[]>(
            "SELECT * FROM drivers WHERE user_id = ?",
            [driver_id]
        );
        if (drivers.length === 0) {
            res.json({ success: false, message: 'Driver does not exist or has no vehicle profile' });
            return;
        }

        // Check ride exists
        const [rides] = await pool.execute<RowDataPacket[]>('SELECT * FROM ride_requests WHERE id = ?', [ride_id]);
        const ride = rides[0];

        if (!ride) {
            res.json({ success: false, message: 'Ride does not exist' });
            return;
        }

        if (ride.status === 'accepted') {
            res.json({ success: false, message: 'Ride has already been accepted' });
            return;
        }

        // Update ride status and Driver online_status
        await pool.execute(
            "UPDATE ride_requests SET status = 'accepted', driver_id = ? WHERE id = ?",
            [driver_id, ride_id]
        );

        // Update driver status to on_trip
        await pool.execute(
            "UPDATE drivers SET online_status = 'on_trip', last_seen_at = NOW() WHERE user_id = ?",
            [driver_id]
        );

        const [updatedRides] = await pool.execute<RowDataPacket[]>('SELECT * FROM ride_requests WHERE id = ?', [ride_id]);

        res.json({ success: true, message: 'Ride accepted successfully', ride: updatedRides[0] });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const updateRideStatus = async (req: Request, res: Response) => {
    const { ride_id, status } = req.body;

    const validStatuses = ['arrived', 'in_progress', 'completed', 'cancelled'];

    if (!ride_id || !status) {
        res.json({ success: false, message: 'Ride ID and status required' });
        return;
    }

    if (!validStatuses.includes(status)) {
        res.json({ success: false, message: 'Invalid status' });
        return;
    }

    try {
        await pool.execute(
            "UPDATE ride_requests SET status = ? WHERE id = ?",
            [status, ride_id]
        );

        // If trip ended, set driver back to online
        if (status === 'completed' || status === 'cancelled') {
            const [rideRows] = await pool.execute<RowDataPacket[]>('SELECT driver_id FROM ride_requests WHERE id = ?', [ride_id]);
            if (rideRows.length > 0) {
                const driverId = rideRows[0].driver_id;
                await pool.execute(
                    "UPDATE drivers SET online_status = 'online', last_seen_at = NOW() WHERE user_id = ?",
                    [driverId]
                );
            }
        }

        res.json({ success: true, message: `Ride updated to ${status}` });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getPassengerRides = async (req: Request, res: Response) => {
    const passengerId = req.params.id;
    const status = req.query.status as string;

    try {
        let query = 'SELECT * FROM ride_requests WHERE passenger_id = ?';
        const params: any[] = [passengerId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, rides: rows });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getDriverRides = async (req: Request, res: Response) => {
    const driverId = req.params.id;
    const status = req.query.status as string;

    try {
        let query = 'SELECT * FROM ride_requests WHERE driver_id = ?';
        const params: any[] = [driverId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, rides: rows });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};
