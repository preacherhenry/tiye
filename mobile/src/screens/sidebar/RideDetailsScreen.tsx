import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export const RideDetailsScreen = ({ route, navigation }: any) => {
    const { rideId } = route.params;
    const [ride, setRide] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRideDetails();
    }, [rideId]);

    const fetchRideDetails = async () => {
        try {
            const response = await api.get(`/ride/${rideId}`);
            if (response.data.success) {
                setRide(response.data.ride);
            } else {
                Alert.alert('Error', response.data.message || 'Could not fetch ride details');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching ride details:', error);
            Alert.alert('Error', 'An error occurred while fetching ride details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!ride) return null;

    const isCompleted = ride.status === 'completed';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Ride Details</Text>
                <View style={[styles.statusBadge, { backgroundColor: isCompleted ? Colors.success + '22' : Colors.danger + '22' }]}>
                    <Text style={[styles.statusText, { color: isCompleted ? Colors.success : Colors.danger }]}>
                        {ride.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Trip Locations */}
                <View style={styles.section}>
                    <View style={styles.locationRow}>
                        <View style={styles.dotContainer}>
                            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                            <View style={styles.line} />
                            <Ionicons name="location" size={16} color={Colors.danger} />
                        </View>
                        <View style={styles.addressContainer}>
                            <View style={styles.addressBox}>
                                <Text style={styles.addressLabel}>Pickup</Text>
                                <Text style={styles.addressText}>{ride.pickup_location}</Text>
                            </View>
                            <View style={[styles.addressBox, { marginTop: 20 }]}>
                                <Text style={styles.addressLabel}>Destination</Text>
                                <Text style={styles.addressText}>{ride.destination}</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={styles.timestamp}>
                        {new Date(ride.created_at).toLocaleDateString(undefined, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {/* Driver Info */}
                {ride.driver_id && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Driver & Vehicle</Text>
                        <View style={styles.driverCard}>
                            <View style={styles.driverMain}>
                                {ride.driver_photo ? (
                                    <Image source={{ uri: ride.driver_photo }} style={styles.driverAvatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarInitial}>{ride.driver_name?.[0]}</Text>
                                    </View>
                                )}
                                <View style={styles.driverStats}>
                                    <Text style={styles.driverName}>{ride.driver_name}</Text>
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={14} color={Colors.primary} />
                                        <Text style={styles.ratingText}>{Number(ride.driver_rating || 5).toFixed(1)}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.phoneRow}
                                        onPress={() => handleCall(ride.driver_phone)}
                                    >
                                        <Ionicons name="call" size={14} color={Colors.primary} />
                                        <Text style={styles.phoneText}>{ride.driver_phone}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.vehicleRow}>
                                <View style={styles.vehicleInfo}>
                                    <Text style={styles.vehicleLabel}>Vehicle</Text>
                                    <Text style={styles.vehicleText}>{ride.car_color} {ride.car_model}</Text>
                                </View>
                                <View style={styles.plateContainer}>
                                    <Text style={styles.plateText}>{ride.plate_number}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Fare Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Distance</Text>
                            <Text style={styles.summaryValue}>{ride.distance} km</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Trip Fare</Text>
                            <Text style={styles.summaryValue}>K{isCompleted ? ride.fare : '0.00'}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total Paid</Text>
                            <Text style={styles.totalValue}>K{isCompleted ? ride.fare : '0.00'}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: Colors.background
    },
    backBtn: {
        padding: 8,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginRight: 15
    },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.text, flex: 1 },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    content: { padding: 20 },
    section: { marginBottom: 25 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.gray,
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    locationRow: { flexDirection: 'row' },
    dotContainer: { alignItems: 'center', width: 20, marginRight: 15, paddingTop: 5 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    line: { width: 2, height: 40, backgroundColor: Colors.lightGray, marginVertical: 5 },
    addressContainer: { flex: 1 },
    addressBox: {},
    addressLabel: { color: Colors.gray, fontSize: 12, marginBottom: 4 },
    addressText: { color: Colors.text, fontSize: 15, fontWeight: '500' },
    timestamp: { color: Colors.gray, fontSize: 12, marginTop: 20, textAlign: 'center' },
    driverCard: {
        backgroundColor: Colors.surface,
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    driverMain: { flexDirection: 'row', alignItems: 'center' },
    driverAvatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.lightGray },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarInitial: { fontSize: 24, fontWeight: 'bold', color: Colors.black },
    driverStats: { marginLeft: 15, flex: 1 },
    driverName: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    ratingText: { color: Colors.text, fontSize: 13, marginLeft: 4, fontWeight: '600' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    phoneText: { color: Colors.primary, fontSize: 13, marginLeft: 6, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: Colors.lightGray, marginVertical: 15 },
    vehicleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    vehicleInfo: { flex: 1 },
    vehicleLabel: { color: Colors.gray, fontSize: 11, marginBottom: 2 },
    vehicleText: { color: Colors.text, fontSize: 14, fontWeight: 'bold' },
    plateContainer: {
        backgroundColor: Colors.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    plateText: { color: Colors.text, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
    summaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    summaryLabel: { color: Colors.gray, fontSize: 14 },
    summaryValue: { color: Colors.text, fontSize: 14, fontWeight: '600' },
    totalRow: { marginTop: 5, paddingTop: 15, borderTopWidth: 1, borderTopColor: Colors.lightGray, marginBottom: 0 },
    totalLabel: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
    totalValue: { color: Colors.primary, fontSize: 22, fontWeight: 'bold' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }
});
