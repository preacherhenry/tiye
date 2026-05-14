import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { Play, Pause, X, FastForward, Rewind } from 'lucide-react';
import api from '../../services/api';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '1rem'
};

interface RoutePlaybackModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
}

export default function RoutePlaybackModal({ isOpen, onClose, tripId }: RoutePlaybackModalProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [trail, setTrail] = useState<{lat: number, lng: number, heading?: number}[]>([]);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    
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

    useEffect(() => {
        if (isOpen && isLoaded) {
            const fetchPlayback = async () => {
                try {
                    const res = await api.get(`/admin/trips/${tripId}/playback`);
                    let fetchedTrail = res.data.trail || [];
                    
                    // Fetch the recommended route using Free OSRM Engine
                    if (res.data.tripDetails) {
                        const { pickup_lat, pickup_lng, dest_lat, dest_lng, dropoff_lat, dropoff_lng } = res.data.tripDetails;
                        const d_lat = dest_lat || dropoff_lat;
                        const d_lng = dest_lng || dropoff_lng;

                        if (pickup_lat && d_lat) {
                            try {
                                const url = `https://router.project-osrm.org/route/v1/driving/${pickup_lng},${pickup_lat};${d_lng},${d_lat}?overview=full&geometries=geojson`;
                                const osrmRes = await fetch(url);
                                const osrmData = await osrmRes.json();

                                if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
                                    const coords = osrmData.routes[0].geometry.coordinates.map((coord: any) => ({
                                        lat: coord[1],
                                        lng: coord[0]
                                    }));
                                    setDirections({ routes: [{ overview_path: coords }] } as any);
                                    
                                    // If there is no real GPS trail, use road route as mock
                                    if (fetchedTrail.length === 0) {
                                        setTrail(coords);
                                        if (mapRef.current) {
                                            const bounds = new window.google.maps.LatLngBounds();
                                            coords.forEach((point: any) => bounds.extend(point));
                                            mapRef.current.fitBounds(bounds);
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error('OSRM Playback Error:', err);
                            }
                        }
                    }

                    if (fetchedTrail.length > 0) {
                        setTrail(fetchedTrail);
                        if (mapRef.current) {
                            const bounds = new window.google.maps.LatLngBounds();
                            fetchedTrail.forEach((point: any) => bounds.extend(point));
                            mapRef.current.fitBounds(bounds);
                        }
                    }
                } catch (e) {
                    console.error("Playback fetch error", e);
                }
            };
            fetchPlayback();
            setCurrentIndex(0);
            setIsPlaying(true);
            setPlaybackSpeed(1);
        } else {
            setIsPlaying(false);
            setDirections(null);
            setTrail([]);
        }
    }, [isOpen, tripId, isLoaded]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying && trail.length > 0) {
            interval = setInterval(() => {
                setCurrentIndex((prev) => {
                    if (prev >= trail.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000 / playbackSpeed);
        }
        return () => clearInterval(interval);
    }, [isPlaying, playbackSpeed, trail.length]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a24] border border-white/10 rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Historical Route Playback</h3>
                        <p className="text-xs text-gray-400 font-mono mt-1">Trip ID: {tripId}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-colors text-gray-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Map Area */}
                <div className="p-4 relative">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={trail[0] || { lat: -15.3875, lng: 28.3228 }}
                            zoom={14}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            options={{
                                styles: [
                                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }
                                ],
                                disableDefaultUI: true
                            }}
                        >
                            {/* Full Route Polyline (Recommended Road Network Route) */}
                            {directions && (
                                <Polyline
                                    path={directions.routes[0].overview_path}
                                    options={{
                                        strokeColor: '#3b82f6', // Blue
                                        strokeOpacity: 0.3,
                                        strokeWeight: 5,
                                    }}
                                />
                            )}
                            
                            {/* Full GPS Trail Fallback (if no directions, fallback to straight lines for actual GPS) */}
                            {!directions && trail.length > 0 && (
                                <Polyline
                                    path={trail}
                                    options={{
                                        strokeColor: '#3b82f6',
                                        strokeOpacity: 0.3,
                                        strokeWeight: 4,
                                    }}
                                />
                            )}

                            {/* Driven Route (Up to current index) */}
                            {trail.length > 0 && currentIndex > 0 && (
                                <Polyline
                                    path={trail.slice(0, currentIndex + 1)}
                                    options={{
                                        strokeColor: '#10b981',
                                        strokeOpacity: 1,
                                        strokeWeight: 4,
                                    }}
                                />
                            )}

                            {/* Car Marker at current position */}
                            {trail.length > 0 && (
                                <Marker
                                    position={trail[currentIndex]}
                                    icon={{
                                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                        scale: 5,
                                        fillColor: '#a855f7',
                                        fillOpacity: 1,
                                        strokeColor: '#FFFFFF',
                                        strokeWeight: 2,
                                        rotation: trail[currentIndex].heading || 0
                                    }}
                                    zIndex={10}
                                />
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center bg-black/20 rounded-2xl">
                            Loading Map...
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-6 bg-black/20 flex items-center justify-between border-t border-white/5">
                    
                    {/* Playback Controls */}
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => {
                                setIsPlaying(false);
                                setCurrentIndex(0);
                            }}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                        >
                            <Rewind className="w-5 h-5" />
                        </button>
                        
                        <button 
                            onClick={() => {
                                if (currentIndex >= trail.length - 1) setCurrentIndex(0);
                                setIsPlaying(!isPlaying);
                            }}
                            className="p-4 bg-primary text-black hover:bg-primary/80 rounded-full transition-colors shadow-lg shadow-primary/20"
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black" />}
                        </button>

                        <div className="flex bg-white/5 rounded-xl overflow-hidden border border-white/10">
                            {[1, 2, 4].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`px-4 py-2 text-xs font-bold transition-colors ${playbackSpeed === speed ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex-1 ml-8">
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-2">
                            <span>Start</span>
                            <span>Progress: {Math.round((currentIndex / Math.max(1, trail.length - 1)) * 100)}%</span>
                            <span>End</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max={Math.max(0, trail.length - 1)} 
                            value={currentIndex}
                            onChange={(e) => {
                                setIsPlaying(false);
                                setCurrentIndex(parseInt(e.target.value));
                            }}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}
