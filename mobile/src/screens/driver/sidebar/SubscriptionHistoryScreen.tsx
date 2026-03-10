import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/dateUtils';

export const SubscriptionHistoryScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/subscriptions/history/${user?.id}`);
            if (res.data.success) {
                setHistory(res.data.history);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearAll = () => {
        Alert.alert(
            "Clear History",
            "Are you sure you want to permanently delete all expired subscription records?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        setClearing(true);
                        try {
                            const res = await api.delete(`/subscriptions/history/${user?.id}`);
                            if (res.data.success) {
                                setHistory([]);
                                Alert.alert("Success", "Subscription history cleared.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to clear history.");
                        } finally {
                            setClearing(false);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.historyCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.planName}>{item.plan_name}</Text>
                <Text style={styles.planPrice}>K{item.price}</Text>
            </View>
            <View style={styles.detailsRow}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.expiry_date)}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>History</Text>
                {history.length > 0 && (
                    <TouchableOpacity onPress={handleClearAll} disabled={clearing} style={styles.clearBtn}>
                        {clearing ? <ActivityIndicator size="small" color="red" /> : <Text style={styles.clearText}>Clear All</Text>}
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={
                        history.length > 0 && history[0].status === 'expired' ? (
                            <View style={styles.highlightSection}>
                                <Text style={styles.highlightTitle}>MOST RECENT EXPIRY</Text>
                                <View style={[styles.historyCard, styles.latestCard]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.planName}>{history[0].plan_name}</Text>
                                        <Text style={styles.planPrice}>K{history[0].price}</Text>
                                    </View>
                                    <View style={styles.detailsRow}>
                                        <View style={[styles.statusBadge, { backgroundColor: '#330000' }]}>
                                            <Text style={[styles.statusText, { color: '#ff4444' }]}>EXPIRED</Text>
                                        </View>
                                        <Text style={styles.dateText}>Expired on: {formatDate(history[0].expiry_date)}</Text>
                                    </View>
                                </View>
                                <Text style={styles.historyListTitle}>Past History</Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, index }) => {
                        // Skip the first one if we already highlighted it
                        if (index === 0 && item.status === 'expired') return null;
                        return renderItem({ item });
                    }}
                    contentContainerStyle={styles.listContent}

                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={60} color="#333" />
                            <Text style={styles.emptyText}>No subscription history found.</Text>
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
        flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50,
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: '#333'
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', flex: 1 },
    clearBtn: { paddingVertical: 5, paddingHorizontal: 10 },
    clearText: { color: 'red', fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15 },
    historyCard: {
        backgroundColor: Colors.surface, padding: 15, borderRadius: 12, marginBottom: 12,
        borderWidth: 1, borderColor: '#333'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    planName: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
    planPrice: { fontSize: 16, fontWeight: 'bold', color: 'white' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { backgroundColor: '#333', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: 'bold', color: '#999' },
    dateText: { fontSize: 12, color: '#888' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#666', marginTop: 15, fontSize: 16 },
    highlightSection: {
        marginBottom: 20,
    },
    highlightTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 10,
        letterSpacing: 1,
    },
    latestCard: {
        borderColor: '#440000',
        backgroundColor: '#0a0000',
        borderWidth: 2,
    },
    historyListTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 10,
        marginBottom: 15,
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: 20,
    },
});
