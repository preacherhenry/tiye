import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const PromotionsScreen = ({ navigation }: any) => {
    const [promotions, setPromotions] = useState([]);
    const [promoCode, setPromoCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await api.get('/promotions');
            if (response.data.success) {
                setPromotions(response.data.promotions);
            }
        } catch (error) {
            console.error('Error fetching promotions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCode = async () => {
        if (!promoCode.trim()) return;
        setApplying(true);
        try {
            const response = await api.post('/promotions/validate', { code: promoCode });
            if (response.data.success) {
                const promo = response.data.promotion;
                Alert.alert(
                    'Success!',
                    `Applied "${promo.title}". You get ${promo.discount_type === 'percentage' ? promo.discount_value + '%' : 'K' + promo.discount_value} off!`
                );
                setPromoCode('');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid promocode');
        } finally {
            setApplying(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Promotions</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Apply Promo Code</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="e.g. TIYEFREE"
                        style={styles.input}
                        placeholderTextColor={Colors.gray}
                        autoCapitalize="characters"
                        value={promoCode}
                        onChangeText={setPromoCode}
                    />
                    <TouchableOpacity
                        style={[styles.applyButton, applying && { opacity: 0.7 }]}
                        onPress={handleApplyCode}
                        disabled={applying}
                    >
                        {applying ? (
                            <ActivityIndicator size="small" color={Colors.black} />
                        ) : (
                            <Text style={styles.applyText}>Apply Code</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Active Offers</Text>
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
                ) : promotions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="gift-outline" size={50} color={Colors.gray} />
                        <Text style={styles.emptyText}>No active offers available</Text>
                    </View>
                ) : (
                    promotions.map((promo: any) => (
                        <TouchableOpacity key={promo.id} style={styles.promoCard} activeOpacity={0.8}>
                            <View style={styles.cardAccent} />
                            <View style={styles.promoContent}>
                                <View style={styles.promoHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.promoTitle}>{promo.title}</Text>
                                        <Text style={styles.promoDesc} numberOfLines={2}>{promo.description}</Text>
                                    </View>
                                    <View style={styles.tagBox}>
                                        <Text style={styles.tagText}>{promo.code}</Text>
                                    </View>
                                </View>
                                <View style={styles.promoFooter}>
                                    <View style={styles.expiryBox}>
                                        <Ionicons name="time-outline" size={14} color={Colors.gray} />
                                        <Text style={styles.expiryText}>
                                            Expires: {new Date(promo.expiry_date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.discountBox}>
                                        <Text style={styles.discountText}>
                                            {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `K${promo.discount_value}`} OFF
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                {/* Referral Card */}
                <View style={styles.referralCard}>
                    <Ionicons name="people" size={40} color={Colors.black} />
                    <View style={styles.referralTextContainer}>
                        <Text style={styles.referralTitle}>Refer & Earn</Text>
                        <Text style={styles.referralSubtitle}>Invite friends and get K25 each!</Text>
                    </View>
                    <TouchableOpacity style={styles.shareBtn}>
                        <Text style={styles.shareBtnText}>Invite</Text>
                    </TouchableOpacity>
                </View>
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
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.gray, marginBottom: 15, marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        backgroundColor: Colors.surface,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        padding: 5
    },
    input: { flex: 1, paddingHorizontal: 15, color: Colors.text, fontWeight: 'bold' },
    applyButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12
    },
    applyText: { color: Colors.black, fontWeight: 'bold' },
    promoCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardAccent: { width: 8, backgroundColor: Colors.primary },
    promoContent: { flex: 1, padding: 20 },
    promoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    promoTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    tagBox: { backgroundColor: Colors.primary + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagText: { color: Colors.primary, fontSize: 12, fontWeight: 'bold' },
    promoDesc: { color: Colors.gray, fontSize: 14, marginBottom: 15, lineHeight: 20 },
    promoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expiryBox: { flexDirection: 'row', alignItems: 'center' },
    expiryText: { color: Colors.gray, fontSize: 12, marginLeft: 5 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyText: { color: Colors.gray, marginTop: 10, fontSize: 16 },
    discountBox: { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '33' },
    discountText: { color: Colors.primary, fontSize: 12, fontWeight: 'black' },
    referralCard: {
        backgroundColor: Colors.primary,
        padding: 20,
        borderRadius: 20,
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    referralTextContainer: { flex: 1, marginLeft: 15 },
    referralTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.black },
    referralSubtitle: { fontSize: 12, color: Colors.black, opacity: 0.7 },
    shareBtn: { backgroundColor: Colors.black, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
    shareBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 12 }
});

export default PromotionsScreen;
