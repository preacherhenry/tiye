const fs = require('fs');
const path = require('path');

const content = `import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const MyRidesScreen = ({ navigation }) => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRides();
    }, []);

    const fetchRides = async () => {
        try {
            // Placeholder: Assuming backend will implement this endpoint
            const response = await api.get('/rides/history'); 
            if (response.data.success) {
                setRides(response.data.rides);
            }
        } catch (error) {
            console.log('Error fetching rides:', error);
            // Mock data for now to show UI
            setRides([
                { id: 1, date: '2025-01-01', pickup: 'Mwenyi Safari Lodge', destination: 'Siavonga Market', fare: 150, status: 'completed' },
                { id: 2, date: '2024-12-30', pickup: 'Lake Kariba Inns', destination: 'Main Bus Station', fare: 200, status: 'cancelled' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={[styles.status, { color: item.status === 'completed' ? 'green' : 'red' }]}>{item.status.toUpperCase()}</Text>
            </View>
            <View style={styles.locationContainer}>
                <Ionicons name="ellipse" size={10} color="green" />
                <Text style={styles.locationText}>{item.pickup}</Text>
            </View>
            <View style={styles.locationContainer}>
                <Ionicons name="location" size={10} color="red" />
                <Text style={styles.locationText}>{item.destination}</Text>
            </View>
            <Text style={styles.fare}>ZMW {item.fare}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>My Rides</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList 
                    data={rides}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: Colors.primary },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 15 },
    list: { padding: 15 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    date: { color: '#888', fontSize: 12 },
    status: { fontWeight: 'bold', fontSize: 12 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
    locationText: { marginLeft: 10, color: '#333' },
    fare: { marginTop: 10, fontWeight: 'bold', fontSize: 16, alignSelf: 'flex-end', color: Colors.primary }
});

export default MyRidesScreen;
`;

const targetPath = path.resolve('c:/Users/lenovo/taxi_mobile/src/screens/sidebar/MyRidesScreen.tsx');
fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, content);
console.log(`Created ${targetPath}`);
