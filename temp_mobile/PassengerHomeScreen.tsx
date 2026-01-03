import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator, Animated, Image, KeyboardAvoidingView, ScrollView, Vibration, Linking } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const decodePolyline = (t: string) => {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;
    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        points.push({ latitude: (lat / 1e5), longitude: (lng / 1e5) });
    }
    return points;
};

// Reusable Menu Item Component
const MenuItem = ({ icon, label, onPress, danger = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Ionicons name={icon} size={24} color={danger ? 'red' : Colors.primary} />
        <Text style={[styles.menuLabel, danger && { color: 'red' }]}>{label}</Text>
    </TouchableOpacity>
);

export const PassengerHomeScreen = ({ navigation }: any) => {
    const { user, logout } = useAuth();
    const mapRef = useRef<any>(null);
    const [location, setLocation] = useState<any>(null);
    const [isLoadingLoc, setIsLoadingLoc] = useState(true);

    // Ride State
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    // Added 'cancelled' to state type
    const [rideStatus, setRideStatus] = useState<any>('idle');
    const [rideInfo, setRideInfo] = useState<any>(null);
    const [fare, setFare] = useState(0);
    const [distance, setDistance] = useState(0);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [driverLoc, setDriverLoc] = useState<any>(null);
    const [pickupCoords, setPickupCoords] = useState<any>(null);
    const [destCoords, setDestCoords] = useState<any>(null);

    // Drawer State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-width * 0.7)).current; // Start hidden (left)

    // Zoom Level (x3)
    const ZOOM_LEVEL = 0.002;

    // 1. Init: Get Location & Center Map
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setIsLoadingLoc(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            // Reverse Geocode
            try {
                let address = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude
                });

                if (address.length > 0) {
                    const addr = address[0];
                    const fullAddr = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}`.trim().replace(/^,/, '').trim();
                    setPickup(fullAddr || "My Current Location");
                }
            } catch (e) {
                console.log("Reverse Geocode Failed", e);
            }

            setIsLoadingLoc(false);

            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: ZOOM_LEVEL,
                    longitudeDelta: ZOOM_LEVEL,
                }, 1000);
            }
        })();
    }, []);

    // 2. RESTORE ACTIVE RIDE
    useEffect(() => {
        const restoreRide = async () => {
            if (!user?.id) return;
            try {
                const res = await api.get(`/passenger-rides/${user.id}`);
                if (res.data.success) {
                    // Find active ride
                    const activeRide = res.data.rides.find((r: any) =>
                        ['pending', 'accepted', 'arrived', 'in_progress'].includes(r.status)
                    );

                    if (activeRide) {
                        console.log("Restored Ride Status:", activeRide.status);
                        setRideInfo(activeRide);
                        setPickup(activeRide.pickup_location);
                        setDestination(activeRide.destination);
                        setFare(activeRide.fare);
                        setDistance(activeRide.distance);
                        const mapped = activeRide.status === 'pending' ? 'searching' : activeRide.status;
                        setRideStatus(mapped);

                        // Geocode restored locations
                        geocodeLocations(activeRide.pickup_location, activeRide.destination);
                    }
                }
            } catch (e) {
                console.log("Failed to restore ride", e);
            }
        };
        restoreRide();
    }, [user]);

    const geocodeLocations = async (p: string, d: string) => {
        try {
            const pRes = await Location.geocodeAsync(p + ", Chirundu, Zambia");
            const dRes = await Location.geocodeAsync(d + ", Chirundu, Zambia");
            if (pRes.length > 0) setPickupCoords(pRes[0]);
            if (dRes.length > 0) setDestCoords(dRes[0]);
        } catch (e) { console.log("Geocode failed", e); }
    };


    // Use refs for polling to avoid stale closures without resetting interval
    const rideInfoRef = useRef(rideInfo);
    const rideStatusRef = useRef(rideStatus);

    useEffect(() => {
        rideInfoRef.current = rideInfo;
        rideStatusRef.current = rideStatus;
    }, [rideInfo, rideStatus]);

    // 3. Poll for Ride Status (Robust)
    useEffect(() => {
        let interval: any;

        const poll = async () => {
            const currentStatus = rideStatusRef.current;
            const currentRide = rideInfoRef.current;
            const id = currentRide?.id;

            // Ensure we only poll if we have an ID and are in an active state
            const activeStatuses = ['searching', 'accepted', 'arrived', 'in_progress'];
            if (!id || !activeStatuses.includes(currentStatus)) {
                return;
            }

            try {
                // console.log(`📡 Polling status for ride ${id}...`);
                const res = await api.get(`/ride/${id}`);
                if (res.data.success) {
                    const updatedRide = res.data.ride;

                    // Handle Status Change
                    const mappedStatus = updatedRide.status === 'pending' ? 'searching' : updatedRide.status;
                    if (mappedStatus !== currentStatus) {
                        console.log('✅ Status changed:', currentStatus, '->', mappedStatus);

                        if (mappedStatus === 'accepted' && currentStatus === 'searching') {
                            Vibration.vibrate(1000);
                            Alert.alert("🎉 Ride Accepted", "A driver is on their way!");
                        }

                        if (mappedStatus === 'arrived' && currentStatus === 'accepted') {
                            Vibration.vibrate([0, 500, 200, 500]);
                            Alert.alert("👋 Driver Arrived", "Your driver has arrived at the pickup location!");
                        }

                        if (mappedStatus === 'completed') {
                            Vibration.vibrate(500);
                            Alert.alert(
                                "✅ Trip Completed",
                                `Hope you enjoyed your ride with ${updatedRide.driver_name || 'Tiye'}!\n\nTotal Fare: K${updatedRide.fare}`,
                                [{ text: "Book Another", onPress: resetToIdle }]
                            );
                            return; // Stop processing this poll
                        }

                        setRideStatus(mappedStatus);
                        setRideInfo(updatedRide);
                    }

                    // Handle Location/Driver Update even if status is same (e.g. driver moving or info populated)
                    if (JSON.stringify(updatedRide) !== JSON.stringify(currentRide)) {
                        setRideInfo(updatedRide);
                    }

                    if (updatedRide.current_lat && updatedRide.current_lng) {
                        setDriverLoc({
                            latitude: parseFloat(updatedRide.current_lat),
                            longitude: parseFloat(updatedRide.current_lng)
                        });
                    }
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        };

        // Run poll immediately then interval
        if (['searching', 'accepted', 'arrived', 'in_progress'].includes(rideStatus)) {
            poll();
            interval = setInterval(poll, 3000);
        }

        return () => clearInterval(interval);
    }, [rideStatus]);

    // Reset App to Idle State
    const resetToIdle = () => {
        // Correcting: removed setRideId(null) as it doesn't exist
        setRideStatus('idle');
        setRideInfo(null);
        setRouteCoords([]);
        setDriverLoc(null);
        setPickup('');
        setDestination('');
        setDistance(0);
        setFare(0);
        setPickupCoords(null);
        setDestCoords(null);
        // Reset camera to user
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };


    // Drawer Animation Logic
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isMenuOpen ? 0 : -width * 0.7,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isMenuOpen]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleRequestPreview = async () => {
        if (!pickup || !destination) {
            Alert.alert("Error", "Please enter pickup and destination");
            return;
        }
        calculateRoute(pickup, destination);
    };

    const calculateRoute = async (pText: string, dText: string) => {
        try {
            const pRes = await Location.geocodeAsync(pText + ", Chirundu, Zambia");
            const dRes = await Location.geocodeAsync(dText + ", Chirundu, Zambia");

            if (pRes.length > 0 && dRes.length > 0) {
                const p = pRes[0];
                const d = dRes[0];

                const url = `http://router.project-osrm.org/route/v1/driving/${p.longitude},${p.latitude};${d.longitude},${d.latitude}?overview=full&geometries=polyline`;
                const osrm = await fetch(url).then(r => r.json());

                if (osrm.routes && osrm.routes.length > 0) {
                    const route = osrm.routes[0];
                    setRouteCoords(decodePolyline(route.geometry));
                    setDistance((route.distance / 1000).toFixed(1) as any);

                    const calcFare = 20 + ((route.distance / 1000) * 10);
                    setFare(Math.ceil(calcFare));

                    if (rideStatus === 'idle' || rideStatus === 'searching') {
                        setRideStatus('preview');
                        setPickupCoords(p);
                        setDestCoords(d);
                        mapRef.current?.fitToCoordinates([
                            { latitude: p.latitude, longitude: p.longitude },
                            { latitude: d.latitude, longitude: d.longitude }
                        ], { edgePadding: { top: 50, right: 50, bottom: 300, left: 50 } });
                    }
                }
            } else {
                Alert.alert("Error", "Could not find locations.");
            }
        } catch (e) {
            console.log("Routing failed", e); // Silent fail preferred
        }
    };

    // Real-time Driver Route (Driver -> Pickup)
    useEffect(() => {
        const fetchDriverRoute = async () => {
            if (rideStatus === 'accepted' && driverLoc && pickup) {
                try {
                    const pRes = await Location.geocodeAsync(pickup + ", Chirundu, Zambia");
                    if (pRes.length > 0) {
                        const p = pRes[0]; // Pickup
                        const d = driverLoc; // Driver

                        const url = `http://router.project-osrm.org/route/v1/driving/${d.longitude},${d.latitude};${p.longitude},${p.latitude}?overview=full&geometries=polyline`;
                        const osrm = await fetch(url).then(r => r.json());

                        if (osrm.routes && osrm.routes.length > 0) {
                            setRouteCoords(decodePolyline(osrm.routes[0].geometry));
                        }
                    }
                } catch (e) { console.log('Driver route failed', e); }
            }
        };

        // Fetch every 10s or when status changes
        fetchDriverRoute();
        const interval = setInterval(fetchDriverRoute, 10000);
        return () => clearInterval(interval);
    }, [rideStatus, driverLoc, pickup]);

    const confirmRequest = async () => {
        try {
            const res = await api.post('/request-ride', {
                passenger_id: user?.id,
                pickup,
                destination,
                fare,
                distance
            });
            if (res.data.success) {
                setRideStatus('searching');
                setRideInfo({ id: res.data.rideId });
                // Geocode for visualization if not already done
                if (!pickupCoords) geocodeLocations(pickup, destination);
            }
        } catch (e) {
            Alert.alert("Error", "Failed to request ride.");
        }
    };

    const handleCancelRide = () => {
        Alert.alert(
            "Cancel Ride",
            "Are you sure you want to cancel this ride?",
            [
                { text: "No", style: "cancel" },
                { text: "Yes, Cancel", style: "destructive", onPress: confirmCancel }
            ]
        );
    };

    const confirmCancel = async () => {
        if (!rideInfo?.id) return;
        try {
            const res = await api.post('/update-ride-status', {
                ride_id: rideInfo.id,
                status: 'cancelled'
            });
            if (res.data.success) {
                setRideStatus('cancelled');
                // Cleanup will happen in render or reset
            } else {
                Alert.alert("Error", "Could not cancel ride.");
            }
        } catch (e) {
            Alert.alert("Error", "Network error cancelling ride.");
        }
    };

    const resetRide = () => {
        setRideStatus('idle');
        setRideInfo(null);
        setRouteCoords([]);
        setDriverLoc(null);
        setPickup('');
        setDestination('');
        setFare(0);
        setDistance(0);
        setPickupCoords(null);
        setDestCoords(null);

        // Center back to user
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: ZOOM_LEVEL,
                longitudeDelta: ZOOM_LEVEL,
            }, 1000);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Map Layer */}
            <View style={StyleSheet.absoluteFillObject}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation={true}
                    initialRegion={{
                        latitude: -16.0415,
                        longitude: 28.8510,
                        latitudeDelta: ZOOM_LEVEL,
                        longitudeDelta: ZOOM_LEVEL,
                    }}
                >
                    {routeCoords.length > 0 && (
                        <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={Colors.primary} />
                    )}
                    {driverLoc && ['accepted', 'arrived', 'in_progress'].includes(rideStatus) && (
                        <Marker coordinate={driverLoc} title="Driver" pinColor={Colors.primary} />
                    )}
                    {pickupCoords && (
                        <Marker coordinate={pickupCoords} title="Pickup" pinColor="green" />
                    )}
                    {destCoords && (
                        <Marker coordinate={destCoords} title="Destination" pinColor="red" />
                    )}
                </MapView>
            </View>

            {/* Header (Hamburger) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={toggleMenu} style={styles.menuBtn}>
                    <Ionicons name="menu" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Taxi App</Text>
            </View>

            {/* Main Content Area */}
            <View style={styles.contentContainer}>

                {/* 1. INPUT FORM */}
                {(rideStatus === 'idle' || rideStatus === 'cancelled') && (
                    <View style={styles.searchBox}>
                        <Text style={styles.greeting}>Hi, {user?.name} 👋</Text>
                        <TextInput
                            placeholder="Pickup Location"
                            style={styles.input}
                            value={pickup}
                            onChangeText={setPickup}
                            placeholderTextColor={Colors.gray}
                        />
                        <TextInput
                            placeholder="Destination"
                            style={styles.input}
                            value={destination}
                            onChangeText={setDestination}
                            placeholderTextColor={Colors.gray}
                        />
                        <Button title="Find Ride" onPress={handleRequestPreview} />
                    </View>
                )}

                {/* 2. PREVIEW */}
                {rideStatus === 'preview' && (
                    <View style={styles.previewBox}>
                        <Text style={styles.fareTitle}>Estimated Fare: K{fare}</Text>
                        <Text style={styles.distText}>{distance} km • ~{Math.ceil(distance * 3)} mins</Text>
                        <Button title="Confirm Request" onPress={confirmRequest} />
                        <Button title="Cancel" variant="outline" onPress={() => setRideStatus('idle')} />
                    </View>
                )}

                {/* 3. ACTIVE RIDE STATUS PANEL */}
                {!['idle', 'preview', 'completed', 'cancelled'].includes(rideStatus) && (
                    <View style={styles.rideIsland}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <View>
                                <Text style={styles.tripLabel}>Trip Details:</Text>
                                <View style={styles.tripRow}><Ionicons name="location-outline" size={16} color={Colors.primary} /><Text style={styles.tripText} numberOfLines={1}>{pickup || rideInfo?.pickup_location || 'Trip in Progress'}</Text></View>
                                <View style={styles.tripRow}><Ionicons name="flag-outline" size={16} color="red" /><Text style={styles.tripText} numberOfLines={1}>{destination || rideInfo?.destination || '...'}</Text></View>
                            </View>

                            {/* Cancel Button - Only if not completed */}
                            {rideStatus !== 'completed' && (
                                <TouchableOpacity onPress={handleCancelRide} style={styles.cancelLink}>
                                    <Text style={{ color: 'red', fontWeight: 'bold' }}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {(rideInfo?.fare) && (
                            <View style={styles.fareRow}>
                                <Text style={{ fontWeight: 'bold' }}>K{rideInfo.fare}</Text>
                                <Text style={{ color: Colors.gray }}>{rideInfo.distance} km</Text>
                            </View>
                        )}
                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />

                        {rideStatus === 'searching' ? (
                            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.islandTitle}>Searching for a driver...</Text>
                            </View>
                        ) : (
                            <View>
                                <View style={styles.statusRow}>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusBadgeText}>{(rideStatus || 'ACTIVE').toUpperCase().replace('_', ' ')}</Text>
                                    </View>
                                    <Text style={styles.timeText}>
                                        {rideStatus === 'in_progress' ? 'Trip in Progress' :
                                            rideStatus === 'arrived' ? 'Driver Arrived' : 'Arriving Soon'}
                                    </Text>
                                </View>

                                <View style={styles.driverRow}>
                                    {/* Driver Photo & Rating */}
                                    <View>
                                        {rideInfo?.driver_photo ? (
                                            <Image source={{ uri: rideInfo.driver_photo }} style={styles.driverAvatar} />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}><Text style={{ fontSize: 20 }}>👤</Text></View>
                                        )}
                                        <Text style={styles.rating}>⭐ {rideInfo?.driver_rating || '4.9'}</Text>
                                    </View>

                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.driverName}>{rideInfo?.driver_name || "Unknown Driver"}</Text>
                                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                                            {rideInfo?.driver_phone || "No Phone Number"}
                                        </Text>
                                        <Text style={styles.carInfo}>
                                            {rideInfo?.car_color} {rideInfo?.car_model}
                                        </Text>
                                        <View style={styles.plateBadge}>
                                            <Text style={styles.plateText}>{rideInfo?.plate_number || 'TR 123'}</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.callBtn} onPress={() => {
                                        if (rideInfo?.driver_phone) Linking.openURL(`tel:${rideInfo.driver_phone}`);
                                        else Alert.alert("No Phone", "Driver phone number not available.");
                                    }}>
                                        <Ionicons name="call" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* 4. COMPLETED STATE */}
                {rideStatus === 'completed' && (
                    <View style={styles.completedBox}>
                        <Ionicons name="checkmark-circle" size={60} color="green" />
                        <Text style={styles.completedTitle}>Ride Completed!</Text>
                        <Text style={{ color: Colors.gray, marginBottom: 20 }}>Paid: K{rideInfo?.fare || fare}</Text>
                        <Button title="Book Another Ride" onPress={resetRide} />
                    </View>
                )}
            </View>

            {isLoadingLoc && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 10 }}>Locating you...</Text>
                </View>
            )}

            {isMenuOpen && (
                <TouchableOpacity style={styles.blurOverlay} onPress={toggleMenu} activeOpacity={1}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                </TouchableOpacity>
            )}

            {/* @ts-ignore */}
            <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                {/* ... Drawer Content ... */}
                <View style={styles.drawerHeader}>
                    <View style={styles.profileAvatar}>
                        <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                    </View>
                    <Text style={styles.drawerName}>{user?.name}</Text>
                    <Text style={styles.drawerPhone}>{user?.phone}</Text>
                </View>

                <View style={styles.drawerItems}>
                    <MenuItem icon="time" label="My Rides" onPress={() => { navigation.navigate('MyRides'); setIsMenuOpen(false); }} />
                    <MenuItem icon="wallet" label="Payment" onPress={() => { navigation.navigate('Payments'); setIsMenuOpen(false); }} />
                    <MenuItem icon="pricetag" label="Promotions" onPress={() => { navigation.navigate('Promotions'); setIsMenuOpen(false); }} />
                    <MenuItem icon="settings" label="Settings" onPress={() => { navigation.navigate('Settings'); setIsMenuOpen(false); }} />
                    <View style={styles.divider} />
                    <MenuItem icon="help-circle" label="Support" onPress={() => { navigation.navigate('HelpSupport'); setIsMenuOpen(false); }} />
                    <MenuItem icon="log-out" label="Logout" danger onPress={logout} />
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: width, height: height },
    header: {
        position: 'absolute', top: 50, left: 20, right: 20,
        flexDirection: 'row', alignItems: 'center',
        zIndex: 10
    },
    menuBtn: { backgroundColor: 'white', padding: 10, borderRadius: 20, elevation: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: Colors.background, backgroundColor: Colors.primary, padding: 5, borderRadius: 5 },
    contentContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 20 },
    searchBox: {
        backgroundColor: Colors.surface, padding: 20, borderRadius: 15, elevation: 10,
        marginHorizontal: 20, marginBottom: 10
    },
    greeting: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: Colors.primary },
    input: { backgroundColor: Colors.background, padding: 15, borderRadius: 10, marginBottom: 10, color: Colors.text },
    previewBox: {
        backgroundColor: Colors.surface, padding: 20, borderRadius: 15, elevation: 10, alignItems: 'center',
        marginHorizontal: 20, marginBottom: 10
    },
    fareTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 5 },
    distText: { fontSize: 16, color: Colors.gray, marginBottom: 15 },

    rideIsland: {
        backgroundColor: Colors.surface, padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20,
        marginBottom: -20
    },
    tripLabel: { fontWeight: 'bold', color: Colors.gray, fontSize: 12, marginBottom: 5 },
    tripRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    tripText: { marginLeft: 10, fontSize: 14, fontWeight: '500', color: Colors.text },
    fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5 },
    cancelLink: { padding: 5 },

    islandTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    statusBadge: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
    statusBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    timeText: { fontWeight: 'bold', color: Colors.gray },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
    driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
    driverName: { fontWeight: 'bold', fontSize: 16 },
    carInfo: { color: Colors.gray, fontSize: 14 },
    plateBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, marginTop: 2, alignSelf: 'flex-start' },
    plateText: { fontSize: 12, fontWeight: 'bold' },
    rating: { color: Colors.secondary, fontSize: 12, marginTop: 2, textAlign: 'center' },
    callBtn: { backgroundColor: 'green', padding: 10, borderRadius: 25 },

    completedBox: {
        backgroundColor: Colors.surface, padding: 30, borderRadius: 15, elevation: 10, alignItems: 'center',
        marginHorizontal: 20, marginBottom: 100
    },
    completedTitle: { fontSize: 24, fontWeight: 'bold', color: 'green', marginTop: 10 },

    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    blurOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.3)' },
    drawer: {
        position: 'absolute', top: 0, bottom: 0, left: 0, width: width * 0.7, backgroundColor: Colors.surface, zIndex: 60, elevation: 10, paddingTop: 50,
        shadowColor: "#000", shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 3.84,
    },
    drawerHeader: { padding: 20, backgroundColor: Colors.primary, marginBottom: 10 },
    profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
    drawerName: { color: 'black', fontSize: 20, fontWeight: 'bold' },
    drawerPhone: { color: '#333', fontSize: 14 },
    drawerItems: { padding: 10 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10 },
    menuLabel: { marginLeft: 20, fontSize: 16, fontWeight: '500', color: Colors.text },
    divider: { height: 1, backgroundColor: Colors.lightGray, marginVertical: 10, marginHorizontal: 15 }
});
