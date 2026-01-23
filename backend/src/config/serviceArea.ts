import { db } from './firebase';

export interface ServiceZone {
    name: string;
    lat: number;
    lng: number;
    radiusKm: number;
}

export const SERVICE_ZONES: ServiceZone[] = [
    {
        name: "Mwenyi Safari Lodge",
        lat: -16.01001,
        lng: 28.89368,
        radiusKm: 5
    },
    {
        name: "Siavonga Junction",
        lat: -16.05435,
        lng: 28.83000,
        radiusKm: 5
    },
    {
        name: "Machembere",
        lat: -16.04334,
        lng: 28.86293,
        radiusKm: 5
    },
    {
        name: "Shamil Academy School",
        lat: -16.03538,
        lng: 28.85633,
        radiusKm: 3
    },
    {
        name: "Kandende",
        lat: -16.0347,
        lng: 28.8475,
        radiusKm: 3
    },
    {
        name: "Turnpike Junction",
        lat: -15.795,
        lng: 28.188,
        radiusKm: 10 // Larger radius for a junction area
    }
];

export const isLocationInServiceArea = async (lat: number, lng: number): Promise<boolean> => {
    // Earth radius in km
    const R = 6371;

    try {
        // 1. Try to get zones from Firestore
        const snapshot = await db.collection('zones').where('status', '==', 'active').get();
        const zones: ServiceZone[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                lat: data.lat,
                lng: data.lng,
                radiusKm: data.radius_km
            };
        });

        let zonesToCheck = zones.length > 0 ? zones : SERVICE_ZONES;

        for (const zone of zonesToCheck) {
            const dLat = deg2rad(lat - zone.lat);
            const dLng = deg2rad(lng - zone.lng);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(zone.lat)) * Math.cos(deg2rad(lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // Distance in km

            if (distance <= zone.radiusKm) {
                return true;
            }
        }
    } catch (error) {
        console.error('Service area check DB error, falling back to static zones:', error);
        for (const zone of SERVICE_ZONES) {
            const dLat = deg2rad(lat - zone.lat);
            const dLng = deg2rad(lng - zone.lng);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(zone.lat)) * Math.cos(deg2rad(lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // Distance in km

            if (distance <= zone.radiusKm) {
                return true;
            }
        }
    }

    return false;
};

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
