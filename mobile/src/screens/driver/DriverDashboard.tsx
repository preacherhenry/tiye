import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, Alert, Image, ActivityIndicator, Vibration } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useAudioPlayer, setAudioModeAsync, createAudioPlayer, AudioPlayer } from 'expo-audio';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';

const { width, height } = Dimensions.get('window');

// Sidebar Component
const Sidebar = ({ isOpen, onClose, user, onUploadPhoto, onLogout, navigation }: any) => {
    const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isOpen ? 0 : -width * 0.75,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isOpen]);

    return (
        <>
            {isOpen && (
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                    <BlurView intensity={20} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} tint="dark" />
                </TouchableOpacity>
            )}
            {/* @ts-ignore */}
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.sidebarHeader}>
                    <TouchableOpacity onPress={onUploadPhoto}>
                        {user?.profile_photo ? (
                            <Image source={{ uri: user.profile_photo }} style={styles.profileImage} />
                        ) : (
                            <View style={[styles.profileImage, styles.placeholderImage]}>
                                <Text style={styles.placeholderText}>{user?.name?.[0] || 'D'}</Text>
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Text style={{ fontSize: 12 }}>📷</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.sidebarName}>{user?.name || 'Driver'}</Text>
                    <Text style={styles.sidebarRole}>Taxicab Driver</Text>
                    <Text style={styles.sidebarRating}>⭐ 4.9</Text>
                </View>

                <ScrollView style={styles.menuItems}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('DriverRides'); onClose(); }}><Text style={styles.menuText}>🚖 My Rides</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('DriverEarnings'); onClose(); }}><Text style={styles.menuText}>💰 Earnings</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('Subscription'); onClose(); }}><Text style={styles.menuText}>💳 Subscription</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('DriverSettings'); onClose(); }}><Text style={styles.menuText}>⚙️ Settings</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { navigation.navigate('DriverSupport'); onClose(); }}><Text style={styles.menuText}>❓ Support</Text></TouchableOpacity>
                </ScrollView>

                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </Animated.View>
        </>
    );
};

export const DriverDashboard = ({ navigation }: any) => {
    const { user, login, logout } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [location, setLocation] = useState<any>(null);
    const [pendingRides, setPendingRides] = useState<any[]>([]);
    const [activeRide, setActiveRide] = useState<any>(null);
    // isOnline will now reflect if a driver has an active subscription.
    // If not active, polling for rides will stop and they will appear offline to others.
    const [isOnline, setIsOnline] = useState(user?.subscription_status === 'active');

    useEffect(() => {
        setIsOnline(user?.subscription_status === 'active');
    }, [user?.subscription_status]);

    const [isLoading, setIsLoading] = useState(false);
    const [localPhoto, setLocalPhoto] = useState(user?.profile_photo);
    const mapRef = useRef<any>(null);

    // Update local photo if user context updates
    useEffect(() => {
        if (user?.profile_photo) {
            setLocalPhoto(user.profile_photo);
        }
    }, [user]);

    // Initial check for photo
    useEffect(() => {
        if (!localPhoto) {
            Alert.alert(
                "Profile Photo Missing",
                "Please upload a profile photo to verify your account.",
                [
                    { text: "Later", style: "cancel" },
                    { text: "Upload Now", onPress: handlePickImage }
                ]
            );
        }
    }, []);

    const [routeCoords, setRouteCoords] = useState<any[]>([]);

    const locationSubscription = useRef<any>(null);
    const audioUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    const localAudioPath = FileSystem.documentDirectory + 'notification.mp3';

    // Manually manage player to avoid "released object" crashes from hook re-renders
    const playerRef = useRef<AudioPlayer | null>(null);
    const previousRideCount = useRef(0);

    // Initial Setup: Download sound & Create Player
    useEffect(() => {
        const prepareSound = async () => {
            try {
                const fileInfo = await FileSystem.getInfoAsync(localAudioPath);
                if (!fileInfo.exists) {
                    console.log('⬇️ Downloading notification sound...');
                    await FileSystem.downloadAsync(audioUrl, localAudioPath);
                    console.log('✅ Sound downloaded to:', localAudioPath);
                } else {
                    console.log('✅ Sound already exists at:', localAudioPath);
                }

                // Create player persistence instance
                if (!playerRef.current) {
                    playerRef.current = createAudioPlayer(localAudioPath);
                    console.log('🎹 Audio Player Created Manually');
                }
            } catch (e) {
                console.error('Failed to prepare audio:', e);
            }
        };
        prepareSound();
    }, []);

    const startLocationTracking = async () => {
        if (locationSubscription.current) return;

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        let currentLoc = await Location.getCurrentPositionAsync({});
        setLocation(currentLoc);

        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 10
            },
            (newLoc: Location.LocationObject) => {
                setLocation(newLoc);
                if (user?.id) {
                    api.post('/update-location', {
                        userId: user.id,
                        lat: newLoc.coords.latitude,
                        lng: newLoc.coords.longitude,
                        heading: newLoc.coords.heading
                    }).catch((err: any) => console.log('Loc update failed', err));
                }
                if (mapRef.current) {
                    mapRef.current.animateCamera({ center: newLoc.coords, zoom: 15 }, { duration: 1000 });
                }
            }
        );
    };

    const stopLocationTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
    };

    useEffect(() => {
        startLocationTracking();

        // Configure Audio Session for Background Playback
        const configureAudio = async () => {
            try {
                await setAudioModeAsync({
                    shouldPlayInBackground: true,
                    playsInSilentMode: true,
                    interruptionMode: 'duckOthers',
                    shouldRouteThroughEarpiece: false
                });
                console.log('✅ Background Audio Mode Configured');
            } catch (e) {
                console.error('❌ Failed to configure background audio', e);
            }
        };
        configureAudio();

        // Return cleanup
        return () => {
            stopLocationTracking();
        };
    }, [user]);

    // Also poll for pending rides if online
    useEffect(() => {
        let interval: any;
        if (isOnline && !activeRide) {
            fetchPendingRides();
            interval = setInterval(fetchPendingRides, 5000);
        }
        return () => clearInterval(interval);
    }, [isOnline, activeRide]);

    // Poll for active ride status updates (e.g. cancellations)
    useEffect(() => {
        let interval: any;
        if (activeRide) {
            console.log('[DRIVER APP] ⏰ Starting poll for active ride:', activeRide.id);
            interval = setInterval(checkActiveRide, 5000);
        }
        return () => {
            if (interval) {
                console.log('[DRIVER APP] 🛑 Clearing poll interval');
                clearInterval(interval);
            }
        };
    }, [activeRide?.id, activeRide?.status]);

    const checkActiveRide = async () => {
        if (!user?.id) return;
        try {
            console.log('[DRIVER APP] 🔍 Polling for ride updates...');
            const res = await api.get(`/driver-rides/${user.id}`);

            if (res.data.success) {
                if (activeRide) {
                    const updatedRide = res.data.rides.find((r: any) => r.id === activeRide.id);
                    console.log('[DRIVER APP] 📦 Polled Ride Status:', updatedRide ? updatedRide.status : 'Not Found');

                    if (updatedRide) {
                        if (updatedRide.status === 'cancelled') {
                            console.log('[DRIVER APP] 🚨 Ride detected as CANCELLED. Clearing state.');
                            setActiveRide(null);
                            setRouteCoords([]);
                            Alert.alert("Ride Cancelled", "The passenger has cancelled this ride.");
                        } else if (updatedRide.status !== activeRide.status) {
                            console.log('[DRIVER APP] 🔄 Status changed from', activeRide.status, 'to', updatedRide.status);
                            setActiveRide(updatedRide);
                        }
                    }
                } else {
                    const currentActive = res.data.rides.find((r: any) =>
                        ['accepted', 'arrived', 'in_progress'].includes(r.status)
                    );
                    if (currentActive) {
                        setActiveRide(currentActive);
                    }
                }
            }
        } catch (error) {
            console.log("[DRIVER APP] Error checking active ride:", error);
        }
    };

    const playNotificationSound = async () => {
        try {
            console.log('🔔 New ride notification triggered!');
            // Vibrate with a distinctive pattern
            Vibration.vibrate([0, 500, 200, 500, 200, 500]);

            if (playerRef.current) {
                console.log('🔊 Player State:', playerRef.current.currentStatus ? (playerRef.current.currentStatus.isLoaded ? 'Loaded' : 'Loading') : 'Unknown');

                playerRef.current.seekTo(0);
                playerRef.current.play();

                // Play again after a delay
                setTimeout(() => {
                    if (playerRef.current) {
                        console.log('🔊 Playing notification sound (2/2) via expo-audio');
                        playerRef.current.seekTo(0);
                        playerRef.current.play();
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('❌ Sound playback error:', error);
        }
    };

    const fetchPendingRides = async () => {
        try {
            const res = await api.get('/pending-rides');
            if (res.data.success) {
                const newRides = res.data.rides;

                console.log(`📊 Rides: Previous=${previousRideCount.current}, Current=${newRides.length}`);

                // Play sound if new rides appeared
                if (newRides.length > previousRideCount.current && previousRideCount.current >= 0) {
                    console.log('🆕 New ride detected! Playing sound...');
                    playNotificationSound();
                }

                previousRideCount.current = newRides.length;
                setPendingRides(newRides);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAcceptRide = async (rideId: number) => {
        if (!user?.id) return;
        try {
            console.log('[DRIVER APP] 🚗 Driver accepting ride ID:', rideId);
            const res = await api.post('/accept-ride', { ride_id: rideId, driver_id: user.id });
            console.log('[DRIVER APP] 📨 Accept response:', res.data);
            if (res.data.success) {
                const newActiveRide = res.data.ride || { id: rideId, ...pendingRides.find(r => r.id === rideId) };
                console.log('[DRIVER APP] ✅ Setting activeRide state:', newActiveRide);
                setActiveRide(newActiveRide);
                setPendingRides([]);
            } else {
                console.log('[DRIVER APP] ❌ Accept failed:', res.data.message);
                Alert.alert('Error', res.data.message);
            }
        } catch (error) {
            console.error('[DRIVER APP] ❌ Network error accepting ride:', error);
            Alert.alert('Error', 'Failed to accept ride');
        }
    };

    // Debug: Log whenever activeRide changes
    useEffect(() => {
        console.log('[DRIVER APP] 🔄 activeRide state changed:', activeRide ? `ID=${activeRide.id}, Status=${activeRide.status}` : 'null');
    }, [activeRide]);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0]);
        }
    };

    const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
        const formData = new FormData();
        // @ts-ignore: React Native FormData
        formData.append('photo', {
            uri: asset.uri,
            name: 'profile.jpg',
            type: 'image/jpeg'
        });
        formData.append('userId', user?.id?.toString() || '');

        try {
            const res = await api.post('/upload-photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data.success) {
                setLocalPhoto(res.data.photoUrl);
                Alert.alert("Success", "Profile photo updated!");
            } else {
                Alert.alert("Upload Failed", res.data.message);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to upload photo");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            // Navigation to LoginScreen should be handled by AuthNavigator if user is null
            // But if not, we can force it:
            // navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); 
            // Assuming AppNavigator handles unauthenticated state automatically.
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    // Navigation Logic
    const [pickupCoords, setPickupCoords] = useState<any>(null);
    const [destinationCoords, setDestinationCoords] = useState<any>(null);



    useEffect(() => {
        if (activeRide) {
            geocodeTrip();
        } else {
            setPickupCoords(null);
            setDestinationCoords(null);
            setRouteCoords([]);
        }
    }, [activeRide?.id]);

    const geocodeTrip = async () => {
        try {
            const pRes = await Location.geocodeAsync(activeRide.pickup_location + ", Chirundu, Zambia");
            const dRes = await Location.geocodeAsync(activeRide.destination + ", Chirundu, Zambia");
            if (pRes.length > 0) setPickupCoords(pRes[0]);
            if (dRes.length > 0) setDestinationCoords(dRes[0]);
        } catch (e) {
            console.log("Geocoding trip failed", e);
        }
    };

    useEffect(() => {
        if (activeRide && location && pickupCoords && destinationCoords) {
            const isToPickup = activeRide.status === 'accepted' || activeRide.status === 'arrived';
            const target = isToPickup ? pickupCoords : destinationCoords;
            calculateDriverRoute(target);

            // Auto zoom to fit trip
            const coords = [location.coords, pickupCoords, destinationCoords];
            mapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: 100, right: 100, bottom: 300, left: 100 },
                animated: true
            });
        }
    }, [activeRide?.status, location?.coords.latitude, pickupCoords, destinationCoords]);

    const calculateDriverRoute = async (target: any) => {
        if (!location) return;
        try {
            const p = location.coords;
            const url = `http://router.project-osrm.org/route/v1/driving/${p.longitude},${p.latitude};${target.longitude},${target.latitude}?overview=full&geometries=geojson`;
            const osrm = await fetch(url).then(r => r.json());

            if (osrm.routes && osrm.routes.length > 0) {
                setRouteCoords(osrm.routes[0].geometry.coordinates.map(([lng, lat]: any) => ({ latitude: lat, longitude: lng })));
            }
        } catch (e) {
            console.log("Nav route failed", e);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            const res = await api.post('/update-ride-status', { ride_id: activeRide.id, status });
            if (res.data.success) {
                if (status === 'completed') {
                    setActiveRide(null);
                    setRouteCoords([]);
                    stopLocationTracking(); // Stop tracking as requested
                    Alert.alert(
                        "✅ Trip Completed",
                        "You've successfully completed the trip!",
                        [{
                            text: "OK", onPress: () => {
                                // Optionally restart tracking if they should stay online for new rides
                                // startLocationTracking(); 
                            }
                        }]
                    );
                } else {
                    setActiveRide({ ...activeRide, status });
                }
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: location?.coords.latitude || -16.042,
                    longitude: location?.coords.longitude || 28.855,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={true}
            >
                {/* Driver Route */}
                {activeRide && routeCoords.length > 0 && (
                    <Polyline coordinates={routeCoords} strokeColor={Colors.primary} strokeWidth={4} />
                )}

                {/* Pickup Marker */}
                {pickupCoords && (
                    <Marker
                        coordinate={pickupCoords}
                        title="Pickup"
                        description={activeRide?.pickup_location}
                        pinColor="green"
                    />
                )}

                {/* Destination Marker */}
                {destinationCoords && (
                    <Marker
                        coordinate={destinationCoords}
                        title="Destination"
                        description={activeRide?.destination}
                        pinColor="red"
                    />
                )}
            </MapView>

            <TouchableOpacity style={styles.menuButton} onPress={() => setSidebarOpen(true)}>
                <Text style={{ fontSize: 24 }}>☰</Text>
            </TouchableOpacity>

            {!isOnline && (
                <View style={styles.subscriptionWarning}>
                    <Text style={styles.warningText}>
                        {user?.subscription_status === 'pending'
                            ? "⏳ Subscription verification in progress..."
                            : user?.subscription_status === 'paused'
                                ? "⏸️ Your subscription is currently PAUSED"
                                : "⚠️ Subscription expired or inactive"}
                    </Text>
                    <TouchableOpacity
                        style={styles.warningButton}
                        onPress={() => navigation.navigate('Subscription')}
                    >
                        <Text style={styles.warningButtonText}>
                            {user?.subscription_status === 'pending' ? "VIEW STATUS" : user?.subscription_status === 'paused' ? "DETAILS" : "FIX NOW"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Status Toggle Removed: Driver is always online */}

            {isOnline && !activeRide && (
                <View style={styles.requestContainer}>
                    <Text style={styles.sectionTitle}>Pending Requests</Text>
                    <ScrollView style={styles.rideList}>
                        {pendingRides.length === 0 ? (
                            <Text style={styles.noRides}>No rides available...</Text>
                        ) : (
                            pendingRides.map(ride => (
                                <View key={ride.id} style={styles.rideCard}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.pickup}>📍 {ride.pickup_location}</Text>
                                        <Text style={styles.destination}>🏁 {ride.destination}</Text>
                                        <Text style={styles.fare}>💰 K{ride.fare} • {ride.distance}km</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.acceptButton}
                                        onPress={() => handleAcceptRide(ride.id)}
                                    >
                                        <Text style={styles.acceptText}>ACCEPT</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            )}

            {activeRide && (
                <View style={styles.activeRidePanel}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.activeTitle}>Trip in Progress</Text>
                        <Text style={[styles.statusBadge, { backgroundColor: activeRide.status === 'accepted' ? Colors.primary : Colors.success }]}>
                            {activeRide.status.toUpperCase()}
                        </Text>
                    </View>

                    <Text style={styles.pickup}><Text style={{ color: 'green' }}>From:</Text> {activeRide.pickup_location}</Text>
                    <Text style={styles.destination}><Text style={{ color: 'red' }}>To:</Text> {activeRide.destination}</Text>

                    <View style={styles.divider} />

                    {activeRide.status === 'accepted' && (
                        <TouchableOpacity style={styles.navButton} onPress={() => handleUpdateStatus('arrived')}>
                            <Text style={styles.navText}>I HAVE ARRIVED</Text>
                        </TouchableOpacity>
                    )}

                    {activeRide.status === 'arrived' && (
                        <TouchableOpacity style={[styles.navButton, { backgroundColor: Colors.success }]} onPress={() => handleUpdateStatus('in_progress')}>
                            <Text style={styles.navText}>START TRIP</Text>
                        </TouchableOpacity>
                    )}

                    {activeRide.status === 'in_progress' && (
                        <TouchableOpacity style={[styles.navButton, { backgroundColor: 'red' }]} onPress={() => handleUpdateStatus('completed')}>
                            <Text style={styles.navText}>COMPLETE TRIP</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}


            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={{ ...user, profile_photo: localPhoto }}
                onUploadPhoto={handlePickImage}
                onLogout={handleLogout}
                navigation={navigation}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    menuButton: {
        position: 'absolute', top: 50, left: 20,
        backgroundColor: 'white', padding: 10, borderRadius: 25,
        elevation: 5, shadowColor: '#000', shadowOpacity: 0.2
    },
    statusToggle: {
        position: 'absolute', top: 50, right: 20,
        backgroundColor: 'white', padding: 10, borderRadius: 20,
        flexDirection: 'row', alignItems: 'center',
        elevation: 5
    },
    statusText: { fontWeight: 'bold', marginRight: 10 },
    toggleButton: { width: 40, height: 20, borderRadius: 10, justifyContent: 'center' },
    toggleOn: { backgroundColor: Colors.success },
    toggleOff: { backgroundColor: Colors.gray },
    toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'white', marginHorizontal: 2 },

    requestContainer: {
        position: 'absolute', bottom: 70, left: 12, right: 12,
        backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 20, paddingBottom: 60, maxHeight: height * 0.4
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    rideList: { width: '100%' },
    noRides: { textAlign: 'center', color: Colors.gray, marginTop: 20 },
    rideCard: {
        backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginBottom: 10,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    pickup: { fontWeight: 'bold', marginBottom: 4 },
    destination: { color: Colors.gray, marginBottom: 4 },
    fare: { color: Colors.primary, fontWeight: 'bold' },
    acceptButton: { backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
    acceptText: { color: 'white', fontWeight: 'bold' },

    activeRidePanel: {
        position: 'absolute', bottom: 20, left: 0, right: 0,
        backgroundColor: 'white', padding: 20, paddingBottom: 60, borderTopLeftRadius: 20, borderTopRightRadius: 20
    },
    activeTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: Colors.primary },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 5,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12
    },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    navButton: { backgroundColor: Colors.secondary, padding: 15, borderRadius: 10, alignItems: 'center' },
    navText: { color: Colors.primary, fontWeight: 'bold' },

    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
    sidebar: {
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: width * 0.75, backgroundColor: 'white', zIndex: 11,
        paddingTop: 50, paddingHorizontal: 20,
        shadowColor: "#000", shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.5, shadowRadius: 5, elevation: 10
    },
    sidebarHeader: { alignItems: 'center', marginBottom: 30 },
    profileImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee', marginBottom: 10 },
    placeholderImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary },
    placeholderText: { fontSize: 32, color: 'white', fontWeight: 'bold' },
    cameraIcon: { position: 'absolute', bottom: 10, right: 0, backgroundColor: '#fff', borderRadius: 12, padding: 4, elevation: 2 },
    sidebarName: { fontSize: 20, fontWeight: 'bold' },
    sidebarRole: { color: Colors.gray },
    sidebarRating: { marginTop: 5, fontWeight: 'bold', color: '#f1c40f' },
    menuItems: { flex: 1 },
    menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    menuText: { fontSize: 16 },
    logoutButton: { marginTop: 'auto', marginBottom: 30, padding: 15, backgroundColor: '#ffebee', borderRadius: 8, alignItems: 'center' },
    logoutText: { color: 'red', fontWeight: 'bold' },
    subscriptionWarning: {
        position: 'absolute', top: 110, left: 20, right: 20,
        backgroundColor: '#ff9800', padding: 15, borderRadius: 15,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5
    },
    warningText: {
        color: 'black', fontWeight: 'bold', fontSize: 13, flex: 1, marginRight: 10
    },
    warningButton: {
        backgroundColor: 'black', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10
    },
    warningButtonText: {
        color: 'white', fontWeight: '900', fontSize: 11
    }
});
