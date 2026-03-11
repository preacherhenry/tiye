import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface ActiveTripSummaryProps {
    pickup: string;
    destination: string;
    status?: 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed';
    driverName?: string;
    plate_number?: string;
    fare?: string | number;
    onDetailsPress: () => void;
}

export const ActiveTripSummary: React.FC<ActiveTripSummaryProps> = ({ 
    pickup, 
    destination, 
    status = 'searching', 
    driverName, 
    plate_number, 
    fare, 
    onDetailsPress 
}) => {
    const getStatusHeader = () => {
        switch (status) {
            case 'searching': return 'SEARCHING FOR DRIVER...';
            case 'accepted': return 'DRIVER IS ARRIVING...';
            case 'arrived': return 'DRIVER AT PICKUP';
            case 'in_progress': return 'TRIP IN PROGRESS';
            default: return 'ACTIVE TRIP';
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onDetailsPress} activeOpacity={0.9}>
            <View style={styles.statusHeader}>
                {status === 'searching' ? (
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
                ) : (
                    <View style={styles.liveIndicator} />
                )}
                <Text style={styles.statusTitle}>{getStatusHeader()}</Text>
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

            {driverName && (
                <View style={styles.driverSection}>
                    <View style={{ height: 1, backgroundColor: '#333', marginVertical: 12 }} />
                    <View style={styles.driverInfoRow}>
                        <View style={styles.driverIconBox}>
                            <Ionicons name="person" size={16} color="white" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.driverNameText}>{driverName}</Text>
                            <Text style={styles.carPlateText}>{plate_number || 'No Plate Info'}</Text>
                        </View>
                        {fare && (
                            <View style={styles.fareBox}>
                                <Text style={styles.fareText}>K{fare}</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
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
    driverSection: {
        width: '100%',
    },
    driverInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverNameText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    carPlateText: {
        color: Colors.gray,
        fontSize: 10,
        marginTop: 2,
    },
    fareBox: {
        backgroundColor: Colors.primary + '22',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    fareText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
