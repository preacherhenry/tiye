import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Plan {
    id: number;
    name: string;
    price: number;
    duration_days: number;
    description: string;
}

const SubscriptionScreen = ({ navigation }: any) => {
    const { user, refreshUser } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [screenshot, setScreenshot] = useState<any>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/subscriptions/plans');
            if (res.data.success) {
                setPlans(res.data.plans);
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setScreenshot(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedPlan || !screenshot) {
            Alert.alert('Missing Info', 'Please select a plan and upload proof of payment.');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('driver_id', user?.id?.toString() || '');
            formData.append('plan_id', selectedPlan.id.toString());

            const uri = screenshot.uri;
            const name = uri.split('/').pop();
            const type = 'image/jpeg';

            // @ts-ignore
            formData.append('screenshot', { uri, name, type });

            const res = await api.post('/subscriptions/subscribe', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                Alert.alert('Success', 'Payment proof submitted. Admin will verify and activate your subscription shortly.');
                await refreshUser();
                navigation.goBack();
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit subscription');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription Plans</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusCard}>
                    <Text style={styles.statusLabel}>Current Status</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, {
                            backgroundColor: user?.subscription_status === 'active' ? Colors.success :
                                user?.subscription_status === 'pending' ? Colors.primary :
                                    user?.subscription_status === 'paused' ? '#e67e22' : '#333'
                        }]}>
                            <Text style={styles.statusText}>{user?.subscription_status?.toUpperCase() || 'NONE'}</Text>
                        </View>
                        {user?.subscription_expiry && (
                            <Text style={styles.expiryText}>Expires: {new Date(user.subscription_expiry).toLocaleDateString()}</Text>
                        )}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Available Plans</Text>
                {plans.map(plan => (
                    <TouchableOpacity
                        key={plan.id}
                        style={[styles.planCard, selectedPlan?.id === plan.id && styles.selectedPlan]}
                        onPress={() => setSelectedPlan(plan)}
                    >
                        <View style={styles.planHeader}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planPrice}>K{plan.price}</Text>
                        </View>
                        <Text style={styles.planDuration}>{plan.duration_days} Days Accessibility</Text>
                        <Text style={styles.planDesc}>{plan.description}</Text>
                    </TouchableOpacity>
                ))}

                {selectedPlan && (
                    <View style={styles.paymentSection}>
                        <Text style={styles.sectionTitle}>Upload Proof of Payment</Text>
                        <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
                            {screenshot ? (
                                <Image source={{ uri: screenshot.uri }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="cloud-upload" size={40} color="#666" />
                                    <Text style={styles.uploadText}>Click to select screenshot</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text style={styles.submitText}>SUBMIT FOR VERIFICATION</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#111',
    },
    backButton: {
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    scrollContent: {
        padding: 20,
    },
    statusCard: {
        backgroundColor: '#111',
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#222',
    },
    statusLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 12,
    },
    expiryText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    planCard: {
        backgroundColor: '#111',
        padding: 20,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    selectedPlan: {
        borderColor: Colors.primary,
        backgroundColor: '#1a1a00',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    planName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    planPrice: {
        color: Colors.primary,
        fontSize: 20,
        fontWeight: '900',
    },
    planDuration: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    planDesc: {
        color: '#aaa',
        fontSize: 14,
        lineHeight: 20,
    },
    paymentSection: {
        marginTop: 20,
    },
    uploadBox: {
        width: '100%',
        height: 200,
        backgroundColor: '#111',
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        color: '#666',
        marginTop: 10,
        fontSize: 14,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 30,
    },
    submitText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    }
});

export default SubscriptionScreen;
