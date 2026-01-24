import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator, Animated, Image, KeyboardAvoidingView, ScrollView, Vibration, Linking } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { CHIRUNDU_PLACES, Place } from '../../constants/places';

const { width, height } = Dimensions.get('window');



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
    const [rideId, setRideId] = useState<any>(null);
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [promoInput, setPromoInput] = useState('');
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);
    const [showPromoInput, setShowPromoInput] = useState(false);
    const [fare, setFare] = useState(0);
    const [distance, setDistance] = useState(0);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [driverLoc, setDriverLoc] = useState<any>(null);
    const [pickupCoords, setPickupCoords] = useState<any>(null);
    const [destCoords, setDestCoords] = useState<any>(null);
    const [settings, setSettings] = useState<any>({
        base_fare: 20,
        price_per_km: 10,
        price_per_min: 0,
        min_fare: 20,
        distance_unit: 'km',
        surge_multiplier: 1.0,
        surge_enabled: 'false',
        zones: [],
        fixedRoutes: []
    });
    const [hasValidPromos, setHasValidPromos] = useState(true); // Assume true until checked

    // Autocomplete State
    const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
    const [dynamicPlaces, setDynamicPlaces] = useState<Place[]>([]);
    const [activeInput, setActiveInput] = useState<'pickup' | 'destination' | null>(null);
    const searchTimeout = useRef<any>(null);

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
                    // Create a clean address
                    const street = addr.street || addr.name || "";
                    const city = addr.city || addr.subregion || "";
                    const fullAddr = [street, city].filter(Boolean).join(", ");

                    setPickup(fullAddr || "Current Location");
                    setPickupCoords({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude
                    });
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
            if (!user?.id || user?.role !== 'passenger') return;
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

    // 1b. Fetch Settings & Fare Config
    const fetchSettings = async () => {
        try {
            const res = await api.get('/fares/config');
            if (res.data.success) {
                const s = {
                    base_fare: parseFloat(res.data.settings.base_fare) || 20,
                    price_per_km: parseFloat(res.data.settings.price_per_km) || 10,
                    price_per_min: parseFloat(res.data.settings.price_per_min) || 0,
                    min_fare: parseFloat(res.data.settings.min_fare) || 20,
                    distance_unit: res.data.settings.distance_unit || 'km',
                    surge_multiplier: parseFloat(res.data.settings.surge_multiplier) || 1.0,
                    surge_enabled: res.data.settings.surge_enabled || 'false',
                    zones: res.data.zones || [],
                    fixedRoutes: res.data.fixedRoutes || []
                };
                setSettings(s);
                return s;
            }
        } catch (e) {
            console.log("Failed to fetch fare settings", e);
        }
        return settings;
    };

    useEffect(() => {
        fetchSettings();
        fetchDynamicPlaces();
    }, []);

    const fetchDynamicPlaces = async () => {
        try {
            const res = await api.get('/places');
            if (res.data.success) {
                setDynamicPlaces(res.data.places);
            }
        } catch (e) {
            console.log("Failed to fetch dynamic places", e);
        }
    };

    // Check if user has any valid, unused promos
    useEffect(() => {
        const checkPromoAvailability = async () => {
            if (!user?.id || user?.role !== 'passenger') return;
            try {
                const res = await api.get('/promotions');
                if (res.data.success) {
                    const activePromos = res.data.promotions.filter((p: any) =>
                        p.status === 'active' && new Date(p.expiry_date) > new Date()
                    );

                    // Check if user has used any of these promos
                    let hasUnusedPromo = false;
                    for (const promo of activePromos) {
                        try {
                            const validateRes = await api.post('/promotions/validate', {
                                code: promo.code,
                                userId: user.id
                            });
                            if (validateRes.data.success) {
                                hasUnusedPromo = true;
                                break; // Found at least one valid promo
                            }
                        } catch (e) {
                            // Promo was already used or invalid for this user
                        }
                    }
                    setHasValidPromos(hasUnusedPromo);
                }
            } catch (e) {
                console.log("Failed to check promo availability", e);
                setHasValidPromos(false);
            }
        };
        checkPromoAvailability();
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
            const id = currentRide?.id || rideId;

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
        setRideStatus('idle');
        setRideInfo(null);
        setRouteCoords([]);
        setDriverLoc(null);
        // We don't clear pickup/coords here to keep the current location active
        setDestination('');
        setDistance(0);
        setFare(0);
        setDestCoords(null);
        setAppliedPromo(null);
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

    // Autocomplete Logic
    const handleSearch = (text: string, type: 'pickup' | 'destination') => {
        if (type === 'pickup') setPickup(text);
        else setDestination(text);

        if (!text.trim()) {
            setFilteredPlaces([]);
            setActiveInput(null);
            return;
        }

        setActiveInput(type);

        // Debounce search
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            const allPlaces = [...CHIRUNDU_PLACES, ...dynamicPlaces];
            const results = allPlaces.filter(place =>
                place.name.toLowerCase().includes(text.toLowerCase())
            ).sort((a, b) => {
                // Exact match first, then starts with, then contains
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const t = text.toLowerCase();
                if (aName === t) return -1;
                if (bName === t) return 1;
                if (aName.startsWith(t) && !bName.startsWith(t)) return -1;
                if (!aName.startsWith(t) && bName.startsWith(t)) return 1;
                return aName.localeCompare(bName);
            });
            setFilteredPlaces(results);
        }, 200);
    };

    const selectPlace = (place: Place) => {
        if (activeInput === 'pickup') {
            if (place.name === destination) {
                Alert.alert("Invalid Selection", "Pickup and destination cannot be the same.");
                return;
            }
            setPickup(place.name);
            if (place.latitude && place.longitude) {
                setPickupCoords({ latitude: place.latitude, longitude: place.longitude });
            } else {
                setPickupCoords(null); // Force geocode in handleRequestPreview
            }
        } else if (activeInput === 'destination') {
            if (place.name === pickup) {
                Alert.alert("Invalid Selection", "Pickup and destination cannot be the same.");
                return;
            }
            setDestination(place.name);
            if (place.latitude && place.longitude) {
                setDestCoords({ latitude: place.latitude, longitude: place.longitude });
            } else {
                setDestCoords(null); // Force geocode in handleRequestPreview
            }
        }
        setFilteredPlaces([]);
        setActiveInput(null);
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

    // Helpers for Hybrid Fare
    const getDistanceBetween = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    const findZoneForPoint = (point: { latitude: number, longitude: number }, zones: any[]) => {
        return zones.find(z => {
            const dist = getDistanceBetween(point.latitude, point.longitude, parseFloat(z.lat), parseFloat(z.lng));
            return dist <= parseFloat(z.radius_km);
        });
    };

    const handleRequestPreview = async () => {
        if (!pickup || !destination) {
            Alert.alert("Error", "Please enter pickup and destination");
            return;
        }
        setIsLoadingLoc(true);
        const freshSettings = await fetchSettings();
        await calculateRoute(pickup, destination, freshSettings);
        setIsLoadingLoc(false);
    };

    const calculateRoute = async (pText: string, dText: string, currentSettings?: any) => {
        const s = currentSettings || settings;
        try {
            const pRes = await Location.geocodeAsync(pText + ", Chirundu, Zambia");
            const dRes = await Location.geocodeAsync(dText + ", Chirundu, Zambia");

            if (pRes.length > 0 && dRes.length > 0) {
                const p = pRes[0];
                const d = dRes[0];

                const url = `http://router.project-osrm.org/route/v1/driving/${p.longitude},${p.latitude};${d.longitude},${d.latitude}?overview=full&geometries=geojson`;
                const osrm = await fetch(url).then(r => r.json());

                if (osrm.routes && osrm.routes.length > 0) {
                    const route = osrm.routes[0];
                    setRouteCoords(route.geometry.coordinates.map(([lng, lat]: any) => ({ latitude: lat, longitude: lng })));

                    const distKm = route.distance / 1000;
                    const durationMin = route.duration / 60;
                    setDistance(distKm.toFixed(1) as any);

                    // --- HYBRID FARE DECISION FLOW ---
                    const pickupZone = findZoneForPoint(p, s.zones);
                    const destZone = findZoneForPoint(d, s.zones);
                    let finalFare = 0;
                    let isFixed = false;

                    if (pickupZone && destZone) {
                        const fixedRoute = s.fixedRoutes.find((fr: any) =>
                            fr.pickup_zone_id === pickupZone.id &&
                            fr.dest_zone_id === destZone.id
                        );
                        if (fixedRoute) {
                            finalFare = parseFloat(fixedRoute.fixed_price);
                            isFixed = true;
                        }
                    }

                    if (!isFixed) {
                        // Normal Fare Calculation
                        let calcFare = s.base_fare;

                        // Distance component
                        if (s.distance_unit === 'km') {
                            calcFare += distKm * s.price_per_km;
                        } else {
                            calcFare += route.distance * s.price_per_km;
                        }

                        // Time component
                        calcFare += durationMin * s.price_per_min;

                        // Minimum Fare enforcement
                        calcFare = Math.max(calcFare, s.min_fare);

                        // Surge Pricing
                        if (s.surge_enabled === 'true') {
                            calcFare *= s.surge_multiplier;
                        }

                        finalFare = Math.ceil(calcFare);
                    }

                    setFare(finalFare);

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

                        const url = `http://router.project-osrm.org/route/v1/driving/${d.longitude},${d.latitude};${p.longitude},${p.latitude}?overview=full&geometries=geojson`;
                        const osrm = await fetch(url).then(r => r.json());

                        if (osrm.routes && osrm.routes.length > 0) {
                            setRouteCoords(osrm.routes[0].geometry.coordinates.map(([lng, lat]: any) => ({ latitude: lat, longitude: lng })));
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

    const handleApplyPromo = async () => {
        if (!promoInput.trim()) return;
        setIsApplyingPromo(true);
        try {
            const response = await api.post('/promotions/validate', {
                code: promoInput.trim(),
                userId: user?.id
            });
            if (response.data.success) {
                const promo = response.data.promotion;
                setAppliedPromo(promo);
                setShowPromoInput(false);
                setPromoInput('');
                Alert.alert('Promo Applied!', `You saved ${promo.discount_type === 'percentage' ? promo.discount_value + '%' : 'K' + promo.discount_value}!`);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid promocode');
        } finally {
            setIsApplyingPromo(false);
        }
    };

    const calculateDiscountedFare = () => {
        if (!appliedPromo) return fare;
        let discount = 0;
        if (appliedPromo.discount_type === 'percentage') {
            discount = (fare * appliedPromo.discount_value) / 100;
        } else {
            discount = appliedPromo.discount_value;
        }
        return Math.max(0, fare - discount).toFixed(2);
    };

    const confirmRequest = async () => {
        try {
            const res = await api.post('/request-ride', {
                passenger_id: user?.id,
                pickup,
                destination,
                fare: calculateDiscountedFare(),
                distance,
                pickup_lat: pickupCoords?.latitude,
                pickup_lng: pickupCoords?.longitude,
                dropoff_lat: destCoords?.latitude,
                dropoff_lng: destCoords?.longitude,
                promoId: appliedPromo?.id
            });
            if (res.data.success) {
                setRideId(res.data.rideId);
                setRideStatus('searching');
                setAppliedPromo(null); // Clear after use
            }
        } catch (e: any) {
            const msg = e.response?.data?.message || 'Failed to request ride';
            Alert.alert('Error', msg);
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
        const id = rideInfo?.id || rideId;
        if (!id) return;
        try {
            const res = await api.post('/update-ride-status', {
                ride_id: id,
                status: 'cancelled'
            });
            if (res.data.success) {
                setRideStatus('cancelled');
                resetToIdle();
            } else {
                Alert.alert("Error", "Could not cancel ride.");
            }
        } catch (e) {
            Alert.alert("Error", "Network error cancelling ride.");
        }
    };


    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            {/* Map Layer */}
            <View style={StyleSheet.absoluteFillObject}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
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
                        <Marker
                            coordinate={driverLoc}
                            title="Driver"
                            anchor={{ x: 0.5, y: 0.5 }}
                            rotation={rideInfo?.heading || 0}
                        >
                            <Image
                                source={require('../../../assets/car_marker.png')}
                                style={{ width: 40, height: 40, resizeMode: 'contain' }}
                            />
                        </Marker>
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

                        {/* Pickup Input Container */}
                        <View style={{ zIndex: activeInput === 'pickup' ? 100 : 1 }}>
                            <TextInput
                                placeholder="Pickup Location"
                                style={styles.input}
                                value={pickup}
                                onChangeText={(text) => handleSearch(text, 'pickup')}
                                placeholderTextColor={Colors.gray}
                                onFocus={() => pickup && handleSearch(pickup, 'pickup')}
                            />
                            {activeInput === 'pickup' && (
                                <ScrollView
                                    style={styles.autocompleteDropdown}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                >
                                    {filteredPlaces.length > 0 ? (
                                        filteredPlaces.map((place, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.autocompleteItem}
                                                onPress={() => selectPlace(place)}
                                            >
                                                <Ionicons name="location-sharp" size={18} color={Colors.primary} />
                                                <View style={{ marginLeft: 10 }}>
                                                    <Text style={styles.placeName}>{place.name}</Text>
                                                    <Text style={styles.placeCategory}>({place.category}){place.area ? ` • ${place.area}` : ''}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        pickup.trim().length > 0 && (
                                            <TouchableOpacity
                                                style={styles.noResultItem}
                                                onPress={() => selectPlace({ name: pickup, category: 'Manual' } as any)}
                                            >
                                                <Ionicons name="search-outline" size={20} color={Colors.gray} />
                                                <View style={{ marginLeft: 10 }}>
                                                    <Text style={styles.noResultText}>No saved location found</Text>
                                                    <Text style={[styles.placeCategory, { color: Colors.primary, marginTop: 2 }]}>Tap to search for "{pickup}" anyway</Text>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    )}
                                </ScrollView>
                            )}
                        </View>

                        {/* Destination Input Container */}
                        <View style={{ zIndex: activeInput === 'destination' ? 100 : 1 }}>
                            <TextInput
                                placeholder="Destination"
                                style={styles.input}
                                value={destination}
                                onChangeText={(text) => handleSearch(text, 'destination')}
                                placeholderTextColor={Colors.gray}
                                onFocus={() => destination && handleSearch(destination, 'destination')}
                            />
                            {activeInput === 'destination' && (
                                <ScrollView
                                    style={styles.autocompleteDropdown}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                >
                                    {filteredPlaces.length > 0 ? (
                                        filteredPlaces.map((place, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.autocompleteItem}
                                                onPress={() => selectPlace(place)}
                                            >
                                                <Ionicons name="location-sharp" size={18} color={Colors.primary} />
                                                <View style={{ marginLeft: 10 }}>
                                                    <Text style={styles.placeName}>{place.name}</Text>
                                                    <Text style={styles.placeCategory}>({place.category}){place.area ? ` • ${place.area}` : ''}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        destination.trim().length > 0 && (
                                            <TouchableOpacity
                                                style={styles.noResultItem}
                                                onPress={() => selectPlace({ name: destination, category: 'Manual' } as any)}
                                            >
                                                <Ionicons name="search-outline" size={20} color={Colors.gray} />
                                                <View style={{ marginLeft: 10 }}>
                                                    <Text style={styles.noResultText}>No saved location found</Text>
                                                    <Text style={[styles.placeCategory, { color: Colors.primary, marginTop: 2 }]}>Tap to search for "{destination}" anyway</Text>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    )}
                                </ScrollView>
                            )}
                        </View>

                        <Button title="Find Ride" onPress={handleRequestPreview} />
                    </View>
                )}

                {/* 2. PREVIEW */}
                {rideStatus === 'preview' && (
                    <View style={styles.previewBox}>
                        <Text style={styles.fareTitle}>
                            Trip Fare: <Text style={{ textDecorationLine: appliedPromo ? 'line-through' : 'none', color: appliedPromo ? Colors.gray : Colors.primary }}>K{fare}</Text>
                            {appliedPromo && <Text style={{ color: Colors.success }}> K{calculateDiscountedFare()}</Text>}
                        </Text>
                        <Text style={styles.distText}>{distance} km • ~{Math.ceil(distance * 3)} mins</Text>

                        {showPromoInput ? (
                            <View style={styles.promoInputRow}>
                                <TextInput
                                    placeholder="Enter code"
                                    style={styles.promoInput}
                                    value={promoInput}
                                    onChangeText={setPromoInput}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity style={styles.promoApplyBtn} onPress={handleApplyPromo} disabled={isApplyingPromo}>
                                    {isApplyingPromo ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.promoBtnText}>Apply</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowPromoInput(false)} style={{ marginLeft: 10 }}>
                                    <Ionicons name="close-circle" size={24} color={Colors.gray} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            !appliedPromo && hasValidPromos && (
                                <TouchableOpacity style={styles.promoTrigger} onPress={() => setShowPromoInput(true)}>
                                    <Ionicons name="pricetag" size={16} color={Colors.primary} />
                                    <Text style={styles.promoTriggerText}>Use Promocode</Text>
                                </TouchableOpacity>
                            )
                        )}

                        {appliedPromo && (
                            <View style={styles.appliedPromoTag}>
                                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                                <Text style={styles.appliedPromoText}>Promo Applied: {appliedPromo.code}</Text>
                                <TouchableOpacity onPress={() => setAppliedPromo(null)}>
                                    <Text style={{ color: 'red', marginLeft: 10, fontSize: 12 }}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <Button title="ORDER NOW" variant="success" onPress={confirmRequest} />
                        <Button title="Cancel" variant="danger" onPress={resetToIdle} />
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

                            {/* Cancel Button - Original Position */}
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
                        <Button title="Book Another Ride" onPress={resetToIdle} />
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
    fareTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 5, marginTop: 25 },
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
    divider: { height: 1, backgroundColor: Colors.lightGray, marginVertical: 10, marginHorizontal: 15 },

    // Promo Styles
    promoTrigger: { position: 'absolute', top: 15, right: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '11', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, zIndex: 10 },
    promoTriggerText: { color: Colors.primary, fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
    promoInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, width: '100%' },
    promoInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 10, padding: 10, fontSize: 14 },
    promoApplyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, marginLeft: 10 },
    promoBtnText: { color: 'white', fontWeight: 'bold' },
    appliedPromoTag: { position: 'absolute', top: 15, right: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50' + '11', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, zIndex: 10 },
    appliedPromoText: { color: '#4CAF50', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },

    // Autocomplete Styles
    autocompleteDropdown: {
        maxHeight: 160,
        borderRadius: 12,
        marginTop: 5,
        marginBottom: 10,
        backgroundColor: '#1E1E1E', // Dark background for contrast
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#333', // Darker border
        position: 'absolute',
        top: 60, // Based on input height
        left: 0,
        right: 0,
        zIndex: 1000
    },
    autocompleteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A', // Dark divider
    },
    placeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    placeCategory: {
        fontSize: 12,
        color: Colors.gray,
        textTransform: 'capitalize',
    },
    noResultItem: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    noResultText: {
        color: Colors.gray,
        fontSize: 14,
        fontStyle: 'italic',
    },
});
