import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const EarningsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [earningsData, setEarningsData] = useState<any>({
        earnings: "0.00",
        trips: 0,
        recentTransactions: []
    });

    const fetchEarnings = async () => {
        try {
            const res = await api.get('/driver/earnings');
            if (res.data.success) {
                setEarningsData(res.data);
            }
        } catch (error) {
            console.error("Fetch earnings error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEarnings();
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.background} />
                </TouchableOpacity>
                <Text style={styles.title}>Earnings</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Total Earnings</Text>
                    <Text style={styles.balanceAmount}>K{earningsData.earnings}</Text>
                    <Text style={styles.balanceSub}>Overall Performance</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="car-sport" size={24} color={Colors.primary} />
                        <Text style={styles.statValue}>{earningsData.trips}</Text>
                        <Text style={styles.statLabel}>Trips</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="star" size={24} color={Colors.primary} />
                        <Text style={styles.statValue}>4.9</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Recent Completed Trips</Text>
                {earningsData.recentTransactions.length === 0 ? (
                    <Text style={{ color: Colors.gray, textAlign: 'center', marginTop: 20 }}>No trips completed yet.</Text>
                ) : (
                    earningsData.recentTransactions.map((item: any) => (
                        <View key={item.id} style={styles.transactionItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.transTitle} numberOfLines={1}>{item.destination}</Text>
                                <Text style={styles.transDate}>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            <Text style={styles.transAmount}>+ K{item.fare}</Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: Colors.primary },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.background, marginLeft: 15 },
    content: { padding: 20 },
    balanceCard: { backgroundColor: Colors.surface, padding: 30, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
    balanceLabel: { color: Colors.gray, fontSize: 16 },
    balanceAmount: { color: Colors.primary, fontSize: 32, fontWeight: 'bold', marginVertical: 10 },
    balanceSub: { color: Colors.text, fontSize: 14 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    statCard: { flex: 1, backgroundColor: Colors.surface, padding: 20, borderRadius: 10, marginHorizontal: 5, alignItems: 'center' },
    statValue: { color: Colors.text, fontSize: 24, fontWeight: 'bold', marginVertical: 5 },
    statLabel: { color: Colors.gray },
    sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    transactionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
    transTitle: { color: Colors.text, fontSize: 16 },
    transDate: { color: Colors.gray, fontSize: 12 },
    transAmount: { color: 'green', fontWeight: 'bold' }
});

export default EarningsScreen;
