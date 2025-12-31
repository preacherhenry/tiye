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
        radiusKm: 5 // Configurable radius
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
        radiusKm: 3 // Slightly smaller radius for in-town school? Or keep 5? User said 3-10km.
    }
];

export const isLocationInServiceArea = (lat: number, lng: number): boolean => {
    // Earth radius in km
    const R = 6371;

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
    return false;
};

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
