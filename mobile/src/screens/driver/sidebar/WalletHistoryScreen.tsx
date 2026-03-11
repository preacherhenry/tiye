import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import api from '../../../services/api';
import { formatDate } from '../../../utils/dateUtils';

const WalletHistoryScreen = ({ navigation }: any) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/wallet/history');
            if (res.data.success) {
                setHistory(res.data.transactions);
            }
        } catch (error) {
            console.error('Failed to fetch wallet history:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.historyCard}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.typeText}>{item.type?.toUpperCase()}</Text>
                    <Text style={styles.descText}>{item.description || (item.type === 'deposit' ? 'Top-up' : 'Trip Fee')}</Text>
                </View>
                <Text style={[styles.amountText, { color: item.type === 'deposit' ? Colors.success : '#ff4444' }]}>
                    {item.type === 'deposit' ? '+' : '-'} K{item.amount}
                </Text>
            </View>
            <View style={styles.detailsRow}>
                <View style={[styles.statusBadge, { 
                    backgroundColor: item.status === 'approved' ? '#003300' : item.status === 'pending' ? '#333300' : '#330000' 
                }]}>
                    <Text style={[styles.statusText, { 
                        color: item.status === 'approved' ? Colors.success : item.status === 'pending' ? Colors.primary : '#ff4444' 
                    }]}>
                        {item.status?.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction History</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={60} color="#333" />
                            <Text style={styles.emptyText}>No transactions found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50,
        backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222'
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15 },
    historyCard: {
        backgroundColor: '#111', padding: 15, borderRadius: 15, marginBottom: 12,
        borderWidth: 1, borderColor: '#222'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    typeText: { fontSize: 10, fontWeight: '900', color: '#666', letterSpacing: 1 },
    descText: { fontSize: 14, fontWeight: '700', color: 'white', marginTop: 2 },
    amountText: { fontSize: 18, fontWeight: '900' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    dateText: { fontSize: 12, color: '#666' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#666', marginTop: 15, fontSize: 16 },
});

export default WalletHistoryScreen;
