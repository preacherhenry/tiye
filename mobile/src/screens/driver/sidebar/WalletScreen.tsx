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
    Dimensions,
    TextInput
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../../utils/formatUtils';

const { width } = Dimensions.get('window');

const WalletScreen = ({ navigation }: any) => {
    const { user, refreshUser } = useAuth();
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [amount, setAmount] = useState('');
    const [screenshot, setScreenshot] = useState<any>(null);
    const [walletBalance, setWalletBalance] = useState(user?.wallet_balance || 0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [settingsRes, balanceRes] = await Promise.all([
                api.get('/financial-settings'),
                api.get('/wallet/balance')
            ]);
            
            if (settingsRes.data.success) {
                setSettings(settingsRes.data.settings);
            }
            if (balanceRes.data.success) {
                setWalletBalance(balanceRes.data.balance);
            }
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setScreenshot(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        const depositAmount = parseFloat(amount);
        
        if (!amount || isNaN(depositAmount)) {
            Alert.alert('Invalid Amount', 'Please enter a valid deposit amount.');
            return;
        }

        if (settings) {
            if (depositAmount < settings.min_deposit) {
                Alert.alert('Too Low', `Minimum deposit is K${settings.min_deposit}`);
                return;
            }
            if (depositAmount > settings.max_deposit) {
                Alert.alert('Too High', `Maximum deposit is K${settings.max_deposit}`);
                return;
            }
        }

        if (!screenshot) {
            Alert.alert('Missing Proof', 'Please upload a screenshot of your payment proof.');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('amount', depositAmount.toString());

            const uri = screenshot.uri;
            const name = uri.split('/').pop();
            const type = 'image/jpeg';

            // @ts-ignore
            formData.append('proof', { uri, name, type });
            formData.append('driver_id', user.id);

            console.log('📤 Submitting deposit to:', api.defaults.baseURL + '/wallet/deposit');

            const res = await api.post('/wallet/deposit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                Alert.alert('Success', 'Deposit request submitted. Finance Manager will verify and update your balance shortly.');
                setAmount('');
                setScreenshot(null);
                await refreshUser();
            }
        } catch (error: any) {
            console.error('Deposit error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit deposit');
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
                <Text style={styles.headerTitle}>Driver Wallet</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceAmount}>K {walletBalance.toLocaleString()}</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('SubscriptionHistory')} 
                        style={styles.historyBtn}
                    >
                        <Ionicons name="time-outline" size={18} color="black" />
                        <Text style={styles.historyBtnText}>VIEW HISTORY</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.depositSection}>
                    <Text style={styles.sectionTitle}>Make a Deposit</Text>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Deposit Amount (K)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter amount"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                        {settings && (
                            <Text style={styles.limitText}>
                                Min: K{settings.min_deposit} | Max: K{settings.max_deposit}
                            </Text>
                        )}
                    </View>

                    <Text style={styles.inputLabel}>Upload Payment Proof</Text>
                    <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
                        {screenshot ? (
                            <Image source={{ uri: screenshot.uri }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Ionicons name="cloud-upload" size={40} color="#666" />
                                <Text style={styles.uploadText}>Upload Screenshot</Text>
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
                            <Text style={styles.submitText}>SUBMIT DEPOSIT</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {settings && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color={Colors.primary} />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>Requirements</Text>
                            <Text style={styles.infoText}>
                                • Minimum K{settings.min_online_balance} balance required to receive rides.{'\n'}
                                • K{settings.trip_deduction} service fee deducted per completed trip.
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50,
        backgroundColor: '#111',
    },
    backButton: { marginRight: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    scrollContent: { padding: 20 },
    balanceCard: {
        backgroundColor: Colors.primary, padding: 25, borderRadius: 25,
        alignItems: 'center', marginBottom: 30,
    },
    balanceLabel: { color: 'black', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
    balanceAmount: { color: 'black', fontSize: 36, fontWeight: '900' },
    historyBtn: {
        flexDirection: 'row', alignItems: 'center', marginTop: 15,
        backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 15, paddingVertical: 8,
        borderRadius: 20,
    },
    historyBtnText: { color: 'black', fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
    depositSection: { marginTop: 10 },
    sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    inputContainer: { marginBottom: 20 },
    inputLabel: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
    input: {
        backgroundColor: '#111', color: 'white', padding: 15, borderRadius: 15,
        fontSize: 18, fontWeight: 'bold', borderWidth: 1, borderColor: '#222',
    },
    limitText: { color: '#444', fontSize: 10, marginTop: 5, textAlign: 'right' },
    uploadBox: {
        width: '100%', height: 180, backgroundColor: '#111', borderRadius: 20,
        borderStyle: 'dashed', borderWidth: 2, borderColor: '#333',
        justifyContent: 'center', alignItems: 'center', marginBottom: 25, overflow: 'hidden',
    },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { color: '#666', marginTop: 10, fontSize: 14 },
    previewImage: { width: '100%', height: '100%' },
    submitButton: {
        backgroundColor: Colors.primary, height: 60, borderRadius: 15,
        justifyContent: 'center', alignItems: 'center', marginBottom: 30,
    },
    submitText: { color: 'black', fontSize: 16, fontWeight: '900' },
    infoBox: {
        flexDirection: 'row', backgroundColor: '#111', padding: 20, borderRadius: 20,
        borderWidth: 1, borderColor: '#222', alignItems: 'flex-start',
    },
    infoTextContainer: { marginLeft: 15, flex: 1 },
    infoTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
    infoText: { color: '#aaa', fontSize: 12, lineHeight: 18 },
});

export default WalletScreen;
