import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { MapPin, User, Navigation, AlertTriangle, Phone, Hash, Car } from 'lucide-react';
import { getAuth } from 'firebase/auth';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    // Center roughly around Chirundu, Zambia
    lat: -16.033,
    lng: 28.850
};

// We will fetch these from our API
interface ActiveTrip {
    id: string;
    passenger_id: string;
    passenger_name?: string;
    passenger_phone?: string;
    passenger_lat?: number;
    passenger_lng?: number;
    
    driver_id: string;
    driver_name?: string;
    driver_phone?: string;
    car_model?: string;
    plate_number?: string;
    vehicle_class?: string;
    
    pickup_lat: number;
    pickup_lng: number;
    pickup_location: string;
    
    dest_lat: number;
    dest_lng: number;
    destination: string;
    
    current_lat?: number;
    current_lng?: number;
    heading?: number;
    
    status: string; // 'accepted' or 'in_progress'
    last_seen_at?: string; // Driver's last ping
}

export default function ActiveTripsMap() {
    const [trips, setTrips] = useState<ActiveTrip[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<ActiveTrip | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Using a public API key for development. In production this should be restricted.
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const mapRef = useRef<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(function callback() {
        mapRef.current = null;
    }, []);

    // Polling interval for live updates via the backend API instead of direct Firebase connection
    useEffect(() => {
        const fetchActiveTrips = async () => {
            try {
                // We assume there's an API route /api/admin/live-trips (we will create this)
                const token = await getAuth().currentUser?.getIdToken();
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/live-trips`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch live trips');
                }
                
                const data = await response.json();
                if (data.success) {
                    setTrips(data.trips);
                    
                    // Update selected trip if it's still active
                    if (selectedTrip) {
                        const updatedSelected = data.trips.find((t: ActiveTrip) => t.id === selectedTrip.id);
                        if (updatedSelected) {
                            setSelectedTrip(updatedSelected);
                        } else {
                            // Trip ended or was cancelled
                            setSelectedTrip(null);
                        }
                    }
                }
            } catch (err: any) {
                console.error("Live map error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveTrips();
        const interval = setInterval(fetchActiveTrips, 5000); // 5 second polling

        return () => clearInterval(interval);
    }, [selectedTrip]);

    // Fallback logic
    const getActiveLocation = (trip: ActiveTrip) => {
        // Driver Location takes priority
        const hasDriverLoc = trip.current_lat && trip.current_lng;
        
        // Define "lost connection" as > 30 seconds ago
        let driverLostConnection = false;
        if (trip.last_seen_at) {
            const timeDiff = Date.now() - new Date(trip.last_seen_at).getTime();
            driverLostConnection = timeDiff > 30000;
        }

        if (hasDriverLoc && !driverLostConnection) {
            return {
                lat: trip.current_lat!,
                lng: trip.current_lng!,
                isFallback: false
            };
        }

        // Fallback to Passenger Location
        if (trip.passenger_lat && trip.passenger_lng) {
            return {
                lat: trip.passenger_lat!,
                lng: trip.passenger_lng!,
                isFallback: true
            };
        }
        
        // Final fallback: Pickup Location
        return {
            lat: trip.pickup_lat,
            lng: trip.pickup_lng,
            isFallback: false // Technically a fallback, but we don't treat it as "passenger tracking"
        };
    };

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] relative flex">
            {/* Map Area */}
            <div className="flex-1 rounded-2xl overflow-hidden shadow-sm border border-gray-200 m-6 relative">
                {isLoading && !isLoaded && (
                    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}
                
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={defaultCenter}
                        zoom={13}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                        }}
                    >
                        {trips.map(trip => {
                            const loc = getActiveLocation(trip);
                            const isSelected = selectedTrip?.id === trip.id;
                            
                            return (
                                <React.Fragment key={trip.id}>
                                    {/* Active Tracking Marker (Driver or Passenger Fallback) */}
                                    <Marker
                                        position={loc}
                                        onClick={() => setSelectedTrip(trip)}
                                        icon={{
                                            path: loc.isFallback ? google.maps.SymbolPath.CIRCLE : google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                            scale: loc.isFallback ? 6 : 5,
                                            fillColor: loc.isFallback ? '#EF4444' : '#10B981', // Red for fallback, Green for normal
                                            fillOpacity: 1,
                                            strokeColor: '#FFFFFF',
                                            strokeWeight: 2,
                                            rotation: trip.heading || 0
                                        }}
                                        zIndex={isSelected ? 10 : 1}
                                    />

                                    {/* Pickup & Destination (Only show for selected trip to avoid clutter) */}
                                    {isSelected && (
                                        <>
                                            <Marker
                                                position={{ lat: trip.pickup_lat, lng: trip.pickup_lng }}
                                                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }}
                                            />
                                            {trip.dest_lat && trip.dest_lng && (
                                                <Marker
                                                    position={{ lat: trip.dest_lat, lng: trip.dest_lng }}
                                                    icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                                                />
                                            )}
                                            
                                            {/* Route Polyline */}
                                            {trip.dest_lat && trip.dest_lng && (
                                                <Polyline
                                                    path={[
                                                        { lat: trip.pickup_lat, lng: trip.pickup_lng },
                                                        { lat: trip.dest_lat, lng: trip.dest_lng }
                                                    ]}
                                                    options={{
                                                        strokeColor: '#6366F1',
                                                        strokeOpacity: 0.8,
                                                        strokeWeight: 4,
                                                        geodesic: true
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </GoogleMap>
                ) : (
                    <div className="p-4 text-gray-500">Loading Map...</div>
                )}
            </div>

            {/* Sidebar Details Area */}
            <div className={`w-96 bg-white border-l border-gray-200 overflow-y-auto transition-all ${selectedTrip ? 'translate-x-0' : 'translate-x-full hidden'}`}>
                {selectedTrip && (
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold font-display text-gray-900">Trip Details</h2>
                            <button 
                                onClick={() => setSelectedTrip(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Status Alert */}
                        {getActiveLocation(selectedTrip).isFallback && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start mb-6 border border-red-100">
                                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-semibold">Driver Location Offline</p>
                                    <p className="mt-1">System has automatically fallen back to tracking the passenger's phone GPS.</p>
                                </div>
                            </div>
                        )}

                        {/* Route Info */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-start">
                                <div className="mt-1 bg-green-100 p-1 rounded-full">
                                    <MapPin className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-xs text-gray-500 font-medium uppercase">Pickup</p>
                                    <p className="text-sm text-gray-900 font-medium">{selectedTrip.pickup_location}</p>
                                </div>
                            </div>
                            <div className="ml-3 border-l-2 border-dashed border-gray-200 h-6"></div>
                            <div className="flex items-start">
                                <div className="mt-1 bg-red-100 p-1 rounded-full">
                                    <Navigation className="h-4 w-4 text-red-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-xs text-gray-500 font-medium uppercase">Destination</p>
                                    <p className="text-sm text-gray-900 font-medium">{selectedTrip.destination}</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver Info */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Driver Info</h3>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <div className="bg-indigo-100 p-2 rounded-lg">
                                        <Car className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-bold text-gray-900">{selectedTrip.driver_name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{selectedTrip.car_model || 'Unknown Vehicle'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center text-sm">
                                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                    <span>{selectedTrip.driver_phone || 'No phone provided'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                                        {selectedTrip.plate_number || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Passenger Info */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Passenger Info</h3>
                            <div className="flex items-center mb-4">
                                <div className="bg-emerald-100 p-2 rounded-lg">
                                    <User className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-bold text-gray-900">{selectedTrip.passenger_name || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center text-sm">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                <span>{selectedTrip.passenger_phone || 'No phone provided'}</span>
                            </div>
                        </div>
                        
                        {/* ID Debugging */}
                        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400 font-mono">Trip ID: {selectedTrip.id}</p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Overlay Trip Counter */}
            <div className="absolute top-10 left-10 bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 flex items-center z-10 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                <span className="font-bold text-gray-900">{trips.length}</span>
                <span className="text-sm text-gray-500 ml-1">Active Trips</span>
            </div>
        </div>
    );
}
