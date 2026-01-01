import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const EarningsScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.background} />
                </TouchableOpacity>
                <Text style={styles.title}>Earnings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Total Earnings</Text>
                    <Text style={styles.balanceAmount}>ZMW 1,250.00</Text>
                    <Text style={styles.balanceSub}>This Week</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="car-sport" size={24} color={Colors.primary} />
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Trips</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="time" size={24} color={Colors.primary} />
                        <Text style={styles.statValue}>8.5h</Text>
                        <Text style={styles.statLabel}>Online</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {/* Mock Data */}
                {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.transactionItem}>
                        <View>
                            <Text style={styles.transTitle}>Trip Payment</Text>
                            <Text style={styles.transDate}>Today, 2:30 PM</Text>
                        </View>
                        <Text style={styles.transAmount}>+ ZMW 45.00</Text>
                    </View>
                ))}
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
