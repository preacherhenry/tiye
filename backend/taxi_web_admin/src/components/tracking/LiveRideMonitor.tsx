import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { MapPin, Navigation, AlertTriangle, Battery, Wifi, Maximize2, Minimize2 } from 'lucide-react';
import api from '../../services/api';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '1.5rem'
};

const defaultCenter = {
    lat: -15.3875, // Lusaka default
    lng: 28.3228
};

interface LiveRideMonitorProps {
    driverId: string;
    activeTrip?: any;
}

export default function LiveRideMonitor({ driverId, activeTrip }: LiveRideMonitorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const mapRef = useRef<google.maps.Map | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [driverLocation, setDriverLocation] = useState(defaultCenter);
    const [gpsTrail, setGpsTrail] = useState<{lat: number, lng: number}[]>([]);
    const tripIdRef = useRef<string | null>(null);
    const [telemetry, setTelemetry] = useState({
        speed: 0,
        battery: null as number | null,
        signal: null as number | null
    });
    
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        mapRef.current = map;
        // If we have active trip coordinates, fit bounds
        if (activeTrip?.pickup_lat && activeTrip?.dest_lat) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lng });
            bounds.extend({ lat: activeTrip.dest_lat, lng: activeTrip.dest_lng });
            map.fitBounds(bounds);
        }
    }, [activeTrip]);

    const onUnmount = useCallback(function callback() {
        mapRef.current = null;
    }, []);

    // Mock live movement for demonstration
    useEffect(() => {
        if (!activeTrip) return;

        const start = { 
            lat: activeTrip.pickup_lat || defaultCenter.lat, 
            lng: activeTrip.pickup_lng || defaultCenter.lng 
        };

        // Only initialize position if it's a NEW trip
        if (tripIdRef.current !== activeTrip.id) {
            setDriverLocation(start);
            setGpsTrail([start]);
            tripIdRef.current = activeTrip.id;
        }

        // Calculate Route
        if (isLoaded && window.google) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: start,
                    destination: { 
                        lat: activeTrip.dest_lat || activeTrip.dropoff_lat || -15.4, 
                        lng: activeTrip.dest_lng || activeTrip.dropoff_lng || 28.35 
                    },
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirections(result);
                    }
                }
            );
        }

        // Fetch real live location every 5 seconds
        const fetchLiveLocation = async () => {
            try {
                const res = await api.get('/admin/live-trips');
                if (res.data.success) {
                    const trip = res.data.trips.find((t: any) => t.driver_id === driverId || t.passenger_id === activeTrip?.passenger_id);
                    
                    if (trip) {
                        let targetLat = trip.current_lat;
                        let targetLng = trip.current_lng;
                        
                        // Fallback logic: if driver's location is missing or stale (>30s), use passenger's location
                        let driverLostConnection = false;
                        if (trip.last_seen_at) {
                            const timeDiff = Date.now() - new Date(trip.last_seen_at).getTime();
                            driverLostConnection = timeDiff > 30000;
                        }

                        if ((!targetLat || driverLostConnection) && trip.passenger_lat && trip.passenger_lng) {
                            targetLat = trip.passenger_lat;
                            targetLng = trip.passenger_lng;
                        }

                        if (targetLat && targetLng) {
                            const newLoc = { lat: targetLat, lng: targetLng };
                            setDriverLocation(newLoc);
                            setGpsTrail(prev => {
                                const last = prev[prev.length - 1];
                                if (!last || Math.abs(last.lat - newLoc.lat) > 0.00001 || Math.abs(last.lng - newLoc.lng) > 0.00001) {
                                    return [...prev, newLoc];
                                }
                                return prev;
                            });
                            setTelemetry({
                                speed: trip.speed || 0,
                                battery: trip.battery_level,
                                signal: trip.signal_strength
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch live location", e);
            }
        };

        fetchLiveLocation();
        const interval = setInterval(fetchLiveLocation, 5000);

        return () => clearInterval(interval);
    }, [activeTrip, isLoaded, driverId]);

    if (!activeTrip) {
        return (
            <div className="glass p-8 rounded-[2rem] border border-white/5 h-[400px] flex flex-col items-center justify-center text-center">
                <MapPin className="w-12 h-12 text-gray-500 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-gray-300">No Active Ride</h3>
                <p className="text-sm text-gray-500 mt-2">The chauffeur is currently offline or idle.</p>
            </div>
        );
    }

    return (
        <div className={`glass rounded-[2rem] border-2 border-primary/20 overflow-hidden relative transition-all duration-500 ease-in-out ${isExpanded ? 'fixed inset-4 z-50 bg-black/90 backdrop-blur-xl' : 'h-[500px]'}`}>
            
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 pointer-events-auto">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Tracking</span>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">{activeTrip.passenger_name}</h4>
                    <p className="text-xs text-gray-400 max-w-[200px] truncate">{activeTrip.pickup_location} → {activeTrip.destination}</p>
                </div>

                <div className="flex flex-col items-end space-y-2 pointer-events-auto">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl text-white hover:bg-primary/20 hover:text-primary transition-all"
                    >
                        {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                    
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col space-y-3">
                        <div className="flex items-center text-green-500" title="GPS Signal Strength">
                            <Wifi className="w-4 h-4 mr-2" />
                            <span className="text-[10px] font-black">{telemetry.signal !== null ? `${telemetry.signal}%` : '---'}</span>
                        </div>
                        <div className="flex items-center text-white" title="Battery Level">
                            <Battery className="w-4 h-4 mr-2" />
                            <span className="text-[10px] font-black">{telemetry.battery !== null ? `${telemetry.battery}%` : '---'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 pointer-events-auto flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Current Speed</p>
                            <p className="text-xl font-bold text-white">{telemetry.speed} <span className="text-sm text-gray-400">km/h</span></p>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Est. Arrival</p>
                            <p className="text-xl font-bold text-primary">12 <span className="text-sm text-gray-400">mins</span></p>
                        </div>
                        <div className="w-px h-8 bg-white/10"></div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Distance Left</p>
                            <p className="text-xl font-bold text-white">4.2 <span className="text-sm text-gray-400">km</span></p>
                        </div>
                    </div>
                    
                    <button className="px-6 py-3 bg-red-500/20 text-red-500 font-bold rounded-xl text-sm border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" /> SOS Alert
                    </button>
                </div>
            </div>

            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-10">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Initializing Secure Uplink...</span>
                </div>
            )}
            
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={driverLocation}
                    zoom={15}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        styles: [
                            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                            {
                                featureType: "administrative.locality",
                                elementType: "labels.text.fill",
                                stylers: [{ color: "#d59563" }],
                            },
                            {
                                featureType: "road",
                                elementType: "geometry",
                                stylers: [{ color: "#38414e" }],
                            },
                            {
                                featureType: "road",
                                elementType: "geometry.stroke",
                                stylers: [{ color: "#212a37" }],
                            },
                            {
                                featureType: "road",
                                elementType: "labels.text.fill",
                                stylers: [{ color: "#9ca5b3" }],
                            },
                            {
                                featureType: "road.highway",
                                elementType: "geometry",
                                stylers: [{ color: "#746855" }],
                            },
                            {
                                featureType: "road.highway",
                                elementType: "geometry.stroke",
                                stylers: [{ color: "#1f2835" }],
                            },
                            {
                                featureType: "road.highway",
                                elementType: "labels.text.fill",
                                stylers: [{ color: "#f3d19c" }],
                            },
                            {
                                featureType: "water",
                                elementType: "geometry",
                                stylers: [{ color: "#17263c" }],
                            },
                            {
                                featureType: "water",
                                elementType: "labels.text.fill",
                                stylers: [{ color: "#515c6d" }],
                            },
                            {
                                featureType: "water",
                                elementType: "labels.text.stroke",
                                stylers: [{ color: "#17263c" }],
                            }
                        ]
                    }}
                >
                    {/* Recommended Route (Blue) */}
                    {directions && (
                        <Polyline
                            path={directions.routes[0].overview_path}
                            options={{
                                strokeColor: '#3b82f6', // Blue
                                strokeOpacity: 0.5,
                                strokeWeight: 4,
                                geodesic: true
                            }}
                        />
                    )}

                    {/* Actual GPS Trail (Green) */}
                    {gpsTrail.length > 1 && (
                        <Polyline
                            path={gpsTrail}
                            options={{
                                strokeColor: '#10b981', // Emerald green
                                strokeOpacity: 1,
                                strokeWeight: 4,
                                geodesic: true
                            }}
                        />
                    )}

                    {/* Pickup Marker */}
                    {activeTrip?.pickup_lat && (
                        <Marker
                            position={{ lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lng }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 6,
                                fillColor: '#10b981',
                                fillOpacity: 1,
                                strokeColor: '#FFFFFF',
                                strokeWeight: 2,
                            }}
                        />
                    )}

                    {/* Destination Marker */}
                    {activeTrip?.dest_lat && (
                        <Marker
                            position={{ lat: activeTrip.dest_lat, lng: activeTrip.dest_lng }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 6,
                                fillColor: '#ef4444',
                                fillOpacity: 1,
                                strokeColor: '#FFFFFF',
                                strokeWeight: 2,
                            }}
                        />
                    )}

                    {/* Driver Current Position */}
                    <Marker
                        position={driverLocation}
                        icon={{
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: 5,
                            fillColor: '#a855f7', // Primary purple
                            fillOpacity: 1,
                            strokeColor: '#FFFFFF',
                            strokeWeight: 2,
                            rotation: 0 // In a real scenario, calculate heading
                        }}
                        zIndex={10}
                    />

                </GoogleMap>
            ) : (
                <div className="p-4 text-gray-500">Loading Map...</div>
            )}
        </div>
    );
}
