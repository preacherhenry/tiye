import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MyRidesScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchRides();
    }, [user]);

    const fetchRides = async () => {
        try {
            const endpoint = user.role === 'driver' ? `/driver-rides/${user.id}` : `/passenger-rides/${user.id}`;
            const response = await api.get(endpoint);
            if (response.data.success) {
                setRides(response.data.rides);
            }
        } catch (error) {
            console.log('Error fetching rides:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <View style={[styles.statusTag, { backgroundColor: item.status === 'completed' ? Colors.success + '22' : Colors.danger + '22' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'completed' ? Colors.success : Colors.danger }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>

            <View style={styles.tripInfo}>
                <View style={styles.locationContainer}>
                    <View style={styles.dotContainer}>
                        <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                        <View style={styles.line} />
                        <Ionicons name="location" size={14} color={Colors.danger} />
                    </View>
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressText} numberOfLines={1}>{item.pickup_location}</Text>
                        <View style={{ height: 15 }} />
                        <Text style={styles.addressText} numberOfLines={1}>{item.destination}</Text>
                    </View>
                </View>

                <View style={styles.fareContainer}>
                    <Text style={styles.fareLabel}>Fare</Text>
                    <Text style={styles.fareValue}>K{item.fare}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Trip History</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={rides}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="car-outline" size={80} color={Colors.lightGray} />
                            <Text style={styles.emptyText}>No trips found yet.</Text>
                            <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.bookBtnText}>{user.role === 'driver' ? 'Back to Dashboard' : 'Book a Ride'}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
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
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
    list: { padding: 20 },
    card: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray
    },
    statusTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: { fontWeight: 'bold', fontSize: 10 },
    date: { color: Colors.gray, fontSize: 13, fontWeight: '500' },
    tripInfo: { flexDirection: 'row', justifyContent: 'space-between' },
    locationContainer: { flexDirection: 'row', flex: 1 },
    dotContainer: { alignItems: 'center', width: 20, marginRight: 10 },
    dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    line: { width: 2, flex: 1, backgroundColor: Colors.lightGray, marginVertical: 4 },
    addressContainer: { flex: 1 },
    addressText: { color: Colors.text, fontSize: 14, fontWeight: '500' },
    fareContainer: { alignItems: 'flex-end', justifyContent: 'center' },
    fareLabel: { color: Colors.gray, fontSize: 12, marginBottom: 4 },
    fareValue: { color: Colors.primary, fontSize: 18, fontWeight: 'bold' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { textAlign: 'center', marginTop: 20, color: Colors.gray, fontSize: 16 },
    bookBtn: {
        marginTop: 30,
        backgroundColor: Colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 15
    },
    bookBtnText: { color: Colors.black, fontWeight: 'bold', fontSize: 16 }
});

export default MyRidesScreen;
