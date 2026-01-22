import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { isLocationInServiceArea } from '../config/serviceArea';

const fixPhotoUrl = (url: string | null, req: Request) => {
    if (!url) return null;
    const host = req.get('host') || 'localhost:5000';
    return url.replace(/(http:\/\/|https:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/g, `${req.protocol}://${host}`);
};

export const getRideDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const rideDoc = await db.collection('rides').doc(id).get();

        if (!rideDoc.exists) {
            res.json({ success: false, message: 'Ride not found' });
            return;
        }

        const ride = rideDoc.data()!;

        // Fetch driver info if driver is assigned
        if (ride.driver_id) {
            const userDoc = await db.collection('users').doc(ride.driver_id).get();
            const driverDoc = await db.collection('drivers').doc(ride.driver_id).get();

            if (userDoc.exists) {
                const userData = userDoc.data()!;
                ride.driver_name = userData.name;
                ride.driver_phone = userData.phone;
                ride.driver_photo = userData.profile_photo;
                ride.current_lat = userData.current_lat;
                ride.current_lng = userData.current_lng;
                ride.heading = userData.heading;
            }

            if (driverDoc.exists) {
                const driverData = driverDoc.data()!;
                ride.car_model = driverData.car_model;
                ride.car_color = driverData.car_color;
                ride.plate_number = driverData.plate_number;
                ride.driver_rating = driverData.rating;
            }
        }

        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;

        // Security Check: Only allow Passenger or Driver involved in the ride (or Admin)
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
    const {
        passenger_id, pickup, destination, fare, distance,
        pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        promoId
    } = req.body;

    console.log('📬 New Ride Request Received:');
    console.log('   Passenger ID:', passenger_id);

    if (!passenger_id || !pickup || !destination) {
        console.log('❌ Request missing required fields');
        res.json({ success: false, message: 'All fields are required' });
        return;
    }

    // Validate Service Area
    if (pickup_lat && pickup_lng) {
        const inServiceArea = await isLocationInServiceArea(Number(pickup_lat), Number(pickup_lng));
        if (!inServiceArea) {
            console.log(`❌ Pickup outside service area: ${pickup_lat}, ${pickup_lng}`);
            res.status(400).json({ success: false, message: "Sorry, Tiye currently operates only within the Chirundu service area." });
            return;
        }
    }

    if (dropoff_lat && dropoff_lng) {
        const inServiceArea = await isLocationInServiceArea(Number(dropoff_lat), Number(dropoff_lng));
        if (!inServiceArea) {
            console.log(`❌ Destination outside service area: ${dropoff_lat}, ${dropoff_lng}`);
            res.status(400).json({ success: false, message: "Sorry, the destination is outside the Tiye service area." });
            return;
        }
    }

    try {
        const batch = db.batch();
        const rideRef = db.collection('rides').doc();
        const rideId = rideRef.id;

        const rideData = {
            id: rideId,
            passenger_id,
            pickup_location: pickup,
            destination,
            fare: fare || 0,
            distance: distance || 0,
            pickup_lat: pickup_lat || 0,
            pickup_lng: pickup_lng || 0,
            dest_lat: dropoff_lat || 0,
            dest_lng: dropoff_lng || 0,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        batch.set(rideRef, rideData);

        // 2. If promo used, record usage
        if (promoId) {
            const usageRef = db.collection('promotion_usage').doc();
            batch.set(usageRef, {
                promotion_id: promoId,
                user_id: passenger_id,
                ride_id: rideId,
                used_at: new Date().toISOString()
            });
        }

        await batch.commit();
        res.json({ success: true, message: 'Ride request submitted successfully', rideId });
    } catch (error: any) {
        console.error('Request Ride Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPendingRides = async (req: Request, res: Response) => {
    try {
        console.log('🔍 [GET PENDING RIDES] Fetching pending rides...');

        const querySnapshot = await db.collection('rides')
            .where('status', '==', 'pending')
            .get();

        const rides = querySnapshot.docs.map(doc => doc.data());

        console.log(`✅ [GET PENDING RIDES] Found ${rides.length} pending ride(s)`);
        if (rides.length > 0) {
            console.log('First ride:', JSON.stringify(rides[0], null, 2));
        }

        res.json({ success: true, rides });
    } catch (error: any) {
        console.error('❌ [GET PENDING RIDES] Error:', error.message);
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
        const result = await db.runTransaction(async (transaction) => {
            const driverRef = db.collection('drivers').doc(String(driver_id));
            const rideRef = db.collection('rides').doc(String(ride_id));

            const driverDoc = await transaction.get(driverRef);
            const rideDoc = await transaction.get(rideRef);

            if (!driverDoc.exists) {
                return { success: false, message: 'Driver does not exist or has no vehicle profile' };
            }

            const driver = driverDoc.data()!;
            if (driver.subscription_status !== 'active') {
                return { success: false, message: 'You must have an active subscription to accept rides.' };
            }

            if (!rideDoc.exists) {
                return { success: false, message: 'Ride does not exist' };
            }

            const ride = rideDoc.data()!;
            if (ride.status === 'accepted') {
                return { success: false, message: 'Ride has already been accepted' };
            }

            if (ride.status === 'cancelled') {
                return { success: false, message: 'This ride has been cancelled by the passenger' };
            }

            // Update ride status and driver online_status atomically
            transaction.update(rideRef, {
                status: 'accepted',
                driver_id: driver_id,
                accepted_at: new Date().toISOString()
            });

            transaction.update(driverRef, {
                online_status: 'on_trip',
                last_seen_at: new Date().toISOString()
            });

            return { success: true, ride: { ...ride, status: 'accepted', driver_id } };
        });

        if (result.success) {
            res.json({ success: true, message: 'Ride accepted successfully', ride: result.ride });
        } else {
            res.json(result);
        }
    } catch (error: any) {
        console.error('Accept Ride Error:', error);
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
        await db.runTransaction(async (transaction) => {
            const rideRef = db.collection('rides').doc(String(ride_id));
            const rideDoc = await transaction.get(rideRef);

            if (!rideDoc.exists) {
                throw new Error('Ride not found');
            }

            const ride = rideDoc.data()!;

            transaction.update(rideRef, {
                status,
                updated_at: new Date().toISOString()
            });

            // If trip ended, set driver back to online
            if ((status === 'completed' || status === 'cancelled') && ride.driver_id) {
                const driverRef = db.collection('drivers').doc(String(ride.driver_id));
                transaction.update(driverRef, {
                    online_status: 'online',
                    last_seen_at: new Date().toISOString()
                });
            }
        });

        res.json({ success: true, message: `Ride updated to ${status}` });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getPassengerRides = async (req: Request, res: Response) => {
    const passengerId = req.params.id;
    const status = req.query.status as string;

    try {
        let query = db.collection('rides').where('passenger_id', '==', passengerId);
        if (status) {
            query = query.where('status', '==', status);
        }

        const querySnapshot = await query.get(); // Removed orderBy
        const rides = querySnapshot.docs.map(doc => doc.data());

        // Sort in memory
        rides.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json({ success: true, rides });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getDriverRides = async (req: Request, res: Response) => {
    const driverId = req.params.id;
    const status = req.query.status as string;

    try {
        let query = db.collection('rides').where('driver_id', '==', driverId);
        if (status) {
            query = query.where('status', '==', status);
        }

        const querySnapshot = await query.get(); // Removed orderBy
        const rides = querySnapshot.docs.map(doc => doc.data());

        // Sort in memory
        rides.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json({ success: true, rides });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getTotalBalance = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    try {
        const querySnapshot = await db.collection('rides')
            .where('passenger_id', '==', String(userId))
            .where('status', '==', 'completed')
            .get();

        const total = querySnapshot.docs.reduce((sum, doc) => sum + (parseFloat(doc.data().fare) || 0), 0);
        res.json({ success: true, balance: total.toFixed(2) });
    } catch (error: any) {
        res.json({ success: false, message: error.message });
    }
};

export const getDriverEarnings = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const ridesQuerySnapshot = await db.collection('rides')
            .where('driver_id', '==', String(userId))
            .where('status', '==', 'completed')
            .get();

        const allRides = ridesQuerySnapshot.docs.map(doc => doc.data());

        let totalEarnings = 0;
        let todayEarnings = 0;
        let weekEarnings = 0;
        let monthEarnings = 0;
        const tripCount = allRides.length;

        allRides.forEach(ride => {
            const fare = parseFloat(ride.fare) || 0;
            totalEarnings += fare;

            if (ride.created_at >= startOfToday) {
                todayEarnings += fare;
            }
            if (ride.created_at >= last7Days) {
                weekEarnings += fare;
            }
            if (ride.created_at >= last30Days) {
                monthEarnings += fare;
            }
        });

        // Chart Data (Last 7 days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const dailyTotal = allRides
                .filter(ride => ride.created_at.startsWith(dateStr))
                .reduce((sum, ride) => sum + (parseFloat(ride.fare) || 0), 0);

            chartData.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                amount: dailyTotal
            });
        }

        res.json({
            success: true,
            earnings: totalEarnings.toFixed(2),
            trips: tripCount,
            todayEarnings: todayEarnings.toFixed(2),
            weekEarnings: weekEarnings.toFixed(2),
            monthEarnings: monthEarnings.toFixed(2),
            chartData
        });
    } catch (error: any) {
        console.error('Driver Earnings Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
