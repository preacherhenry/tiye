import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';

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
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                </TouchableOpacity>
            )}
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
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [pendingRides, setPendingRides] = useState<any[]>([]);
    const [activeRide, setActiveRide] = useState<any>(null);
    // const [isOnline, setIsOnline] = useState(false); // Removed: Always online
    const isOnline = true; // Always true
    const [isLoading, setIsLoading] = useState(false);
    const [localPhoto, setLocalPhoto] = useState(user?.profile_photo);
    const mapRef = useRef<MapView>(null);

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

    useEffect(() => {
        let subscription: Location.LocationSubscription;

        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // Get initial location
            let currentLoc = await Location.getCurrentPositionAsync({});
            setLocation(currentLoc);

            // Watch for updates
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10
                },
                (newLoc: Location.LocationObject) => {
                    setLocation(newLoc);

                    // Send update to backend
                    if (user?.id) {
                        api.post('/update-location', {
                            userId: user.id,
                            lat: newLoc.coords.latitude,
                            lng: newLoc.coords.longitude
                        }).catch((err: any) => console.log('Loc update failed', err));
                    }

                    // Animate map
                    if (mapRef.current) {
                        mapRef.current.animateCamera({ center: newLoc.coords, zoom: 15 }, { duration: 1000 });
                    }
                }
            );
        })();

        return () => {
            if (subscription) subscription.remove();
        };
    }, [user]);

    // Also poll for pending rides if online
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOnline && !activeRide) {
            fetchPendingRides();
            interval = setInterval(fetchPendingRides, 5000);
        }
        return () => clearInterval(interval);
    }, [isOnline, activeRide]);

    const checkActiveRide = async () => {
        if (!user?.id) return;
        try {
            const res = await api.get(`/driver-rides/${user.id}?status=accepted`);
            if (res.data.success && res.data.rides.length > 0) {
                setActiveRide(res.data.rides[0]);
                // setIsOnline(true); // Already true
            }
        } catch (error) {
            console.log("Error checking active ride:", error);
        }
    };

    const fetchPendingRides = async () => {
        try {
            const res = await api.get('/pending-rides');
            if (res.data.success) {
                setPendingRides(res.data.rides);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAcceptRide = async (rideId: number) => {
        if (!user?.id) return;
        try {
            const res = await api.post('/accept-ride', { ride_id: rideId, driver_id: user.id });
            if (res.data.success) {
                setActiveRide(res.data.ride || { id: rideId, ...pendingRides.find(r => r.id === rideId) });
                setPendingRides([]);
            } else {
                Alert.alert('Error', res.data.message);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to accept ride');
        }
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
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
        formData.append('userId', user.id);

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
    useEffect(() => {
        if (activeRide && location) {
            const isToPickup = activeRide.status === 'accepted';
            const destinationStr = isToPickup ? activeRide.pickup_location : activeRide.destination;

            // Allow time for location to settle before routing
            const timer = setTimeout(() => {
                calculateDriverRoute(destinationStr);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [activeRide, location]);

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

    const calculateDriverRoute = async (destText: string) => {
        if (!location) return;
        try {
            // Geocode destination
            const dRes = await Location.geocodeAsync(destText + ", Chirundu, Zambia");
            if (dRes.length > 0) {
                const d = dRes[0];
                const p = location.coords;

                const url = `http://router.project-osrm.org/route/v1/driving/${p.longitude},${p.latitude};${d.longitude},${d.latitude}?overview=full&geometries=polyline`;
                const osrm = await fetch(url).then(r => r.json());

                if (osrm.routes && osrm.routes.length > 0) {
                    setRouteCoords(decodePolyline(osrm.routes[0].geometry));
                }
            }
        } catch (e) {
            console.log("Nav route failed", e);
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
                showsUserLocation={true}
            >
                {/* Driver Route */}
                {activeRide && routeCoords.length > 0 && (
                    <Polyline coordinates={routeCoords} strokeColor={Colors.primary} strokeWidth={4} />
                )}

                {/* Destination Marker */}
                {activeRide && (
                    <Marker coordinate={{
                        latitude: routeCoords.length > 0 ? routeCoords[routeCoords.length - 1].latitude : 0,
                        longitude: routeCoords.length > 0 ? routeCoords[routeCoords.length - 1].longitude : 0
                    }} />
                )}
            </MapView>

            <TouchableOpacity style={styles.menuButton} onPress={() => setSidebarOpen(true)}>
                <Text style={{ fontSize: 24 }}>☰</Text>
            </TouchableOpacity>

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
                                    <View>
                                        <Text style={styles.pickup}>📍 {ride.pickup_location}</Text>
                                        <Text style={styles.destination}>🏁 {ride.destination}</Text>
                                        <Text style={styles.fare}>💰 ${ride.fare} • {ride.distance}km</Text>
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
                    <Text style={styles.activeTitle}>Current Ride</Text>
                    <Text style={styles.pickup}>Pickup: {activeRide.pickup_location}</Text>
                    <Text style={styles.destination}>Dropoff: {activeRide.destination}</Text>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.navButton}>
                        <Text style={styles.navText}>Started / Navigate</Text>
                    </TouchableOpacity>
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
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 20, maxHeight: height * 0.4
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
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20
    },
    activeTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: Colors.primary },
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
    logoutText: { color: 'red', fontWeight: 'bold' }
});
