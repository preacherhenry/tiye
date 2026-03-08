import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface ActiveTripSummaryProps {
    pickup: string;
    destination: string;
    onPress: () => void;
}

export const ActiveTripSummary: React.FC<ActiveTripSummaryProps> = ({ pickup, destination, onPress }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.statusHeader}>
                <View style={styles.liveIndicator} />
                <Text style={styles.statusTitle}>Active Trip</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray} style={{ marginLeft: 'auto' }} />
            </View>

            <View style={styles.routeContainer}>
                <View style={styles.lineIndicator}>
                    <View style={styles.dot} />
                    <View style={styles.line} />
                    <Ionicons name="location" size={14} color={Colors.danger} />
                </View>

                <View style={styles.details}>
                    <View style={styles.locationBox}>
                        <Text style={styles.label}>Pickup</Text>
                        <Text style={styles.address} numberOfLines={1}>{pickup}</Text>
                    </View>
                    <View style={[styles.locationBox, { marginTop: 12 }]}>
                        <Text style={styles.label}>Destination</Text>
                        <Text style={styles.address} numberOfLines={1}>{destination}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 16,
        borderRadius: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#333',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    liveIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginRight: 8,
    },
    statusTitle: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    routeContainer: {
        flexDirection: 'row',
    },
    lineIndicator: {
        alignItems: 'center',
        marginRight: 12,
        paddingTop: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.success,
    },
    line: {
        width: 1,
        height: 25,
        backgroundColor: '#444',
        marginVertical: 2,
    },
    details: {
        flex: 1,
    },
    locationBox: {},
    label: {
        color: Colors.gray,
        fontSize: 10,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    address: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
});
