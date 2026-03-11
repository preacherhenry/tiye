
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext'; // Adjust path
import api from '../../../services/api';
import { Colors } from '../../../constants/colors';
import { BlurView } from 'expo-blur';
import { formatDate } from '../../../utils/dateUtils';

export const SubscriptionMonitor = ({ navigation }: any) => {
    const { user, refreshUser } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [availableSubs, setAvailableSubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [switching, setSwitching] = useState(false);

    const status = user?.subscription_status || 'none';
    const isProblematic = ['paused', 'expired', 'none', 'rejected'].includes(status);

    useEffect(() => {
        // Disabled legacy subscription modal for wallet-based model
        setModalVisible(false);
        /*
        if (isProblematic) {
            checkOptions();
        } else {
            setModalVisible(false);
        }
        */
    }, [status]);

    const checkOptions = async () => {
        if (status === 'none') {
            setModalVisible(true); // Always show pay prompt for none
            return;
        }

        setLoading(true);
        try {
            const res = await api.get('/driver/subscriptions/available');
            if (res.data.success) {
                const subs = res.data.subscriptions || [];
                // Filter out the *current* expired/paused one if it's in the list? 
                // The API endpoint returns 'active' or 'paused'. 
                // If we are 'paused', our current one IS paused, so it might return itself?
                // The switchSubscription logic pauses others, so switching to *self* is no-op or resumes?
                // Let's assume the API returns VALID alternatives or potentially the current one if it can be resumed.
                // Actually, switchSubscription expects a target ID.
                setAvailableSubs(subs);
                setModalVisible(true);
            }
        } catch (e) {
            console.error('Failed to check subs', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSwitch = async (subId: string) => {
        setSwitching(true);
        try {
            const res = await api.post('/driver/subscriptions/switch', { subscription_id: subId });
            if (res.data.success) {
                Alert.alert("Success", "Subscription activated!");
                await refreshUser();
                setModalVisible(false);
            } else {
                Alert.alert("Error", res.data.message);
            }
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || 'Failed to switch');
        } finally {
            setSwitching(false);
        }
    };

    const handlePay = () => {
        setModalVisible(false);
        navigation.navigate('Subscription');
    };

    if (!modalVisible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            getRequestClose={() => { }} // Block back button
        >
            <View style={styles.centeredView}>
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.modalView}>
                    <Text style={styles.icon}>
                        {status === 'paused' ? '⏸️' : status === 'expired' ? '⚠️' : '🚫'}
                    </Text>

                    <Text style={styles.modalTitle}>
                        {status === 'paused' ? 'Subscription Paused' :
                            status === 'expired' ? 'Subscription Expired' :
                                'No Active Subscription'}
                    </Text>

                    <Text style={styles.modalText}>
                        {status === 'paused' ? 'Your active subscription has been paused by an administrator.' :
                            status === 'expired' ? 'Your current subscription has expired.' :
                                'You need an active subscription to receive rides.'}
                    </Text>

                    {loading ? (
                        <ActivityIndicator color={Colors.primary} size="large" style={{ marginVertical: 20 }} />
                    ) : (
                        <View style={styles.optionsContainer}>
                            {/* Option A: Switch - Only show if there are alternatives (more than 1) */}
                            {availableSubs.length > 1 && (
                                <View style={styles.switchContainer}>
                                    <Text style={styles.sectionTitle}>Switch to Available Plan:</Text>
                                    {availableSubs.map((sub) => (
                                        <TouchableOpacity
                                            key={sub.id}
                                            style={styles.subOption}
                                            onPress={() => handleSwitch(sub.id)}
                                            disabled={switching}
                                        >
                                            <View>
                                                <Text style={styles.planName}>{sub.plan_name}</Text>
                                                <Text style={styles.planDetails}>Expires: {formatDate(sub.expiry_date)}</Text>
                                            </View>
                                            {switching ? <ActivityIndicator color="#fff" /> : <Text style={styles.switchBtn}>ACTIVATE</Text>}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Option B: Pay (Always valid) */}
                            <TouchableOpacity
                                style={[styles.button, styles.buttonPrimary]}
                                onPress={handlePay}
                            >
                                <Text style={styles.textStyle}>Purchase New Subscription</Text>
                            </TouchableOpacity>

                            {/* Close (Only if paused? No, we want enforcement) */}
                            {/* We block closing if status is invalid to enforce rules. */}
                            {/* But user might want to access settings/support. Allow nav to sub screen. */}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalView: {
        margin: 20,
        backgroundColor: "#1a1a1a",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#333'
    },
    icon: {
        fontSize: 50,
        marginBottom: 15
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        marginBottom: 10,
        textAlign: "center"
    },
    modalText: {
        marginBottom: 20,
        textAlign: "center",
        color: "#ccc",
        fontSize: 16
    },
    optionsContainer: {
        width: '100%',
    },
    switchContainer: {
        marginBottom: 20,
        width: '100%'
    },
    sectionTitle: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase'
    },
    subOption: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444'
    },
    planName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    planDetails: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 2
    },
    switchBtn: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 12
    },
    button: {
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        width: '100%',
        alignItems: 'center'
    },
    buttonPrimary: {
        backgroundColor: Colors.primary,
    },
    textStyle: {
        color: "black",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 16
    },
});
