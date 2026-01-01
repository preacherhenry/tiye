import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const EarningsCard = ({ label, amount, icon, color }: any) => (
    <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardAmount}>K {amount}</Text>
        </View>
    </View>
);

export default function DriverEarningsScreen() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Earnings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Total Balance */}
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Total Balance</Text>
                    <Text style={styles.balanceAmount}>K 1,250.00</Text>
                    <TouchableOpacity style={styles.payoutButton}>
                        <Text style={styles.payoutText}>Request Payout</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <EarningsCard label="Today" amount="450.00" icon="today" color={Colors.primary} />
                    <EarningsCard label="This Week" amount="1,250.00" icon="calendar" color="#4CAF50" />
                </View>

                <View style={styles.statsGrid}>
                    <EarningsCard label="Rides" amount="12" icon="car" color="#2196F3" />
                    <EarningsCard label="Hours" amount="8.5" icon="time" color="#FF9800" />
                </View>


                {/* Recent Transactions Stub */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {[1, 2, 3].map((_, i) => (
                    <View key={i} style={styles.transactionItem}>
                        <View style={styles.transLeft}>
                            <View style={styles.transIcon}>
                                <Ionicons name="cash" size={20} color={Colors.white} />
                            </View>
                            <View>
                                <Text style={styles.transTitle}>Ride Payment</Text>
                                <Text style={styles.transDate}>Today, 2:30 PM</Text>
                            </View>
                        </View>
                        <Text style={styles.transAmount}>+ K 150.00</Text>
                    </View>
                ))}

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
});
