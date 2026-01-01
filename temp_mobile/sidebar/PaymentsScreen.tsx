import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const PaymentsScreen = ({ navigation }) => {
    const [cashEnabled, setCashEnabled] = useState(true);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.background} />
                </TouchableOpacity>
                <Text style={styles.title}>Payments</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Payment Methods</Text>

                <View style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                        <Ionicons name="cash-outline" size={24} color={Colors.primary} />
                        <Text style={styles.methodText}>Cash</Text>
                    </View>
                    <Switch
                        value={cashEnabled}
                        onValueChange={setCashEnabled}
                        trackColor={{ false: "#767577", true: Colors.primary }}
                    />
                </View>

                <TouchableOpacity style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                        <Ionicons name="card-outline" size={24} color="#555" />
                        <Text style={styles.methodText}>Add Credit/Debit Card</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.methodCard}>
                    <View style={styles.methodInfo}>
                        <Ionicons name="phone-portrait-outline" size={24} color="#555" />
                        <Text style={styles.methodText}>Add Mobile Money</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: Colors.primary },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.background, marginLeft: 15 },
    content: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.gray, marginBottom: 15, marginTop: 10 },
    methodCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
    methodInfo: { flexDirection: 'row', alignItems: 'center' },
    methodText: { marginLeft: 15, fontSize: 16, color: Colors.text }
});

export default PaymentsScreen;
