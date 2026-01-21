import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

const EarningsCard = ({ label, amount, icon, color, prefix = "K " }: any) => (
    <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardAmount}>{prefix}{amount}</Text>
        </View>
    </View>
);

export default function DriverEarningsScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>({
        earnings: "0.00",
        trips: 0,
        todayEarnings: "0.00",
        weekEarnings: "0.00",
        monthEarnings: "0.00",
        recentTransactions: []
    });

    const fetchEarnings = async () => {
        console.log("💰 Fetching driver earnings...");
        try {
            const res = await api.get('/driver/earnings');
            if (res.data.success) {
                setData(res.data);
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Earnings</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            >
                {/* Total Balance */}
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Total Earnings</Text>
                    <Text style={styles.balanceAmount}>K {data.earnings}</Text>
                </View>

                {/* Stats Breakdown Grid */}
                <View style={styles.statsGrid}>
                    <EarningsCard label="Today" amount={data.todayEarnings} icon="today" color={Colors.primary} />
                    <EarningsCard label="This Week" amount={data.weekEarnings} icon="calendar" color="#4CAF50" />
                </View>

                <View style={styles.statsGrid}>
                    <EarningsCard label="This Month" amount={data.monthEarnings} icon="stats-chart" color="#FF9800" />
                    <EarningsCard label="Total Trips" amount={data.trips} icon="car" color="#2196F3" prefix="" />
                </View>

                {/* Trend Chart */}
                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>Earnings Trend</Text>
                    <View style={styles.chartArea}>
                        {/* Y-Axis Labels */}
                        <View style={styles.yAxis}>
                            {['K 2,000', 'K 1,500', 'K 1,300', 'K 1,000', 'K 800', 'K 500', 'K 200', 'K 0'].map((label, i) => (
                                <Text key={i} style={styles.yAxisLabel}>{label}</Text>
                            ))}
                        </View>

                        <View style={styles.chartWrapper}>
                            {/* Grid Lines */}
                            <View style={styles.gridLines}>
                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <View key={i} style={styles.gridLine} />
                                ))}
                            </View>

                            {data.chartData && data.chartData.length > 0 ? (
                                <View style={styles.barsContainer}>
                                    {data.chartData.map((item: any, index: number) => {
                                        // Calculate height relative to 2000
                                        const maxHeight = 2000;
                                        const height = Math.min((item.amount / maxHeight) * 100, 100);
                                        return (
                                            <View key={index} style={styles.barItem}>
                                                <View style={[styles.bar, { height: `${height}%` } as any]} />
                                                <Text style={styles.barLabel}>{item.day}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <Text style={{ color: '#888', textAlign: 'center' }}>No trend data available</Text>
                            )}
                        </View>
                    </View>

                    {/* Trend Status */}
                    {data.chartData && data.chartData.length >= 2 && (
                        <View style={styles.trendStatus}>
                            {(() => {
                                const today = data.chartData[data.chartData.length - 1].amount;
                                const yesterday = data.chartData[data.chartData.length - 2].amount;
                                if (today > yesterday) {
                                    return (
                                        <View style={styles.statusRow}>
                                            <Ionicons name="trending-up" size={24} color="#4CAF50" />
                                            <Text style={[styles.statusText, { color: '#4CAF50' }]}>Making More Money</Text>
                                        </View>
                                    );
                                } else if (today < yesterday && today > 0) {
                                    return (
                                        <View style={styles.statusRow}>
                                            <Ionicons name="trending-down" size={24} color="#FF4444" />
                                            <Text style={[styles.statusText, { color: '#FF4444' }]}>Making Less Money</Text>
                                        </View>
                                    );
                                } else {
                                    return (
                                        <View style={styles.statusRow}>
                                            <Ionicons name="remove" size={24} color={Colors.primary} />
                                            <Text style={[styles.statusText, { color: Colors.primary }]}>Steady Income</Text>
                                        </View>
                                    );
                                }
                            })()}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: Colors.secondary,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    content: {
        padding: 20,
    },
    balanceContainer: {
        backgroundColor: Colors.secondary,
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        marginBottom: 25,
    },
    balanceLabel: {
        color: 'black',
        opacity: 0.7,
        fontSize: 16,
        marginBottom: 5,
    },
    balanceAmount: {
        color: 'black',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    payoutButton: {
        backgroundColor: 'black',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    payoutText: {
        color: Colors.secondary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#1A1A1A',
        width: (width - 55) / 2,
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardLabel: {
        color: '#888',
        fontSize: 14,
        marginBottom: 2,
    },
    cardAmount: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 15,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    transLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    transDate: {
        color: '#888',
        fontSize: 12,
    },
    transAmount: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    chartContainer: {
        marginTop: 10,
        backgroundColor: '#1A1A1A',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    chartWrapper: {
        flex: 1,
        height: 180,
        justifyContent: 'flex-end',
    },
    chartArea: {
        flexDirection: 'row',
        marginTop: 15,
        height: 200,
    },
    yAxis: {
        justifyContent: 'space-between',
        paddingRight: 10,
        paddingBottom: 25, // Align with bars
    },
    yAxisLabel: {
        color: '#666',
        fontSize: 10,
        textAlign: 'right',
        width: 45,
    },
    gridLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 25,
        justifyContent: 'space-between',
    },
    gridLine: {
        height: 1,
        backgroundColor: '#333',
        width: '100%',
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '100%',
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 10,
    },
    barItem: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        width: 14,
        backgroundColor: Colors.primary,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    barLabel: {
        color: '#888',
        fontSize: 10,
        marginTop: 8,
        position: 'absolute',
        bottom: -20,
    },
    trendStatus: {
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 15,
        marginTop: 25,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});
