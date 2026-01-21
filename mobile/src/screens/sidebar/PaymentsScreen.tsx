import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PaymentsScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [balance, setBalance] = useState('0.00');
    const [loading, setLoading] = useState(true);
    const [cashEnabled, setCashEnabled] = useState(true);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const response = await api.get('/balance');
            if (response.data.success) {
                setBalance(response.data.balance);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Payment Methods</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Wallet Balance Card */}
                <View style={styles.walletCard}>
                    <Text style={styles.walletLabel}>Total Balance</Text>
                    <Text style={styles.walletAmount}>K {balance}</Text>
                </View>

                <Text style={styles.sectionTitle}>Default Method</Text>
                <TouchableOpacity style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                        <View style={[styles.iconBox, { backgroundColor: Colors.primary }]}>
                            <Ionicons name="cash" size={24} color={Colors.black} />
                        </View>
                        <View style={styles.methodTextContainer}>
                            <Text style={styles.methodName}>Cash</Text>
                            <Text style={styles.methodSub}>Pay after completion</Text>
                        </View>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Local Mobile Money</Text>

                <TouchableOpacity style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFCC00' }]}>
                            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>MTN</Text>
                        </View>
                        <View style={styles.methodTextContainer}>
                            <Text style={styles.methodName}>MTN Money</Text>
                            <Text style={styles.methodSub}>Connect your account</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                        <View style={[styles.iconBox, { backgroundColor: '#E11B22' }]}>
                            <Text style={{ fontWeight: 'bold', fontSize: 10, color: 'white' }}>Airtel</Text>
                        </View>
                        <View style={styles.methodTextContainer}>
                            <Text style={styles.methodName}>Airtel Money</Text>
                            <Text style={styles.methodSub}>Pay using Airtel Wallet</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Cards & Bank</Text>
                <TouchableOpacity style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                        <View style={[styles.iconBox, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.lightGray }]}>
                            <Ionicons name="card" size={24} color={Colors.text} />
                        </View>
                        <View style={styles.methodTextContainer}>
                            <Text style={styles.methodName}>Add New Card</Text>
                            <Text style={styles.methodSub}>Visa, Mastercard accepted</Text>
                        </View>
                    </View>
                    <Ionicons name="add" size={24} color={Colors.primary} />
                </TouchableOpacity>
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
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
    content: { padding: 20 },
    walletCard: {
        backgroundColor: Colors.primary,
        padding: 25,
        borderRadius: 25,
        marginBottom: 30,
        alignItems: 'center',
        elevation: 5,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    walletLabel: { color: Colors.black, fontSize: 14, opacity: 0.8 },
    walletAmount: { color: Colors.black, fontSize: 36, fontWeight: 'bold', marginVertical: 10 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.gray, marginBottom: 15, marginTop: 10, textTransform: 'uppercase' },
    methodCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 15,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    methodInfo: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    methodTextContainer: { marginLeft: 15 },
    methodName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
    methodSub: { fontSize: 12, color: Colors.gray, marginTop: 2 }
});

export default PaymentsScreen;
