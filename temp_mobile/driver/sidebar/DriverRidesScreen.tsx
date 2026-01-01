import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const DriverRidesScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchRides();
    }, [user]);

    const fetchRides = async () => {
        try {
            // Updated endpoint for drivers
            const response = await api.get(`/driver-rides/${user.id}`);
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
        <TouchableOpacity style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={[styles.status, { color: item.status === 'completed' ? 'green' : 'red' }]}>{item.status.toUpperCase()}</Text>
            </View>
            <View style={styles.locationContainer}>
                <Ionicons name="ellipse" size={10} color="green" />
                <Text style={styles.locationText}>{item.pickup_location}</Text>
            </View>
            <View style={styles.locationContainer}>
                <Ionicons name="location" size={10} color="red" />
                <Text style={styles.locationText}>{item.destination}</Text>
            </View>
            <Text style={styles.fare}>Earnings: ZMW {item.fare}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.background} />
                </TouchableOpacity>
                <Text style={styles.title}>My Trips</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={rides}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No trips yet.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: Colors.primary },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.background, marginLeft: 15 },
    list: { padding: 15 },
    card: { backgroundColor: Colors.surface, padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    date: { color: Colors.gray, fontSize: 12 },
    status: { fontWeight: 'bold', fontSize: 12 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
    locationText: { marginLeft: 10, color: Colors.text },
    fare: { marginTop: 10, fontWeight: 'bold', fontSize: 16, alignSelf: 'flex-end', color: Colors.primary },
    emptyText: { textAlign: 'center', marginTop: 50, color: Colors.gray }
});

export default DriverRidesScreen;
