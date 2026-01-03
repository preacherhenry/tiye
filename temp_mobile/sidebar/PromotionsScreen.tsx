import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const PromotionsScreen = ({ navigation }: any) => {
    const promoCodes = [
        { id: 1, title: 'Welcome Offer', description: 'Get 50% off your first 3 rides!', code: 'WELCOME50', expires: '31 Dec 2026', type: 'percentage' },
        { id: 2, title: 'Weekend Special', description: 'K20 off on all weekend rides', code: 'WEEKEND20', expires: 'Jan 15 2026', type: 'fixed' },
    ];

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
                    />
                    <TouchableOpacity style={styles.applyButton}>
                        <Text style={styles.applyText}>Apply Code</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Active Offers</Text>
                {promoCodes.map((promo) => (
                    <TouchableOpacity key={promo.id} style={styles.promoCard} activeOpacity={0.8}>
                        <View style={styles.cardAccent} />
                        <View style={styles.promoContent}>
                            <View style={styles.promoHeader}>
                                <Text style={styles.promoTitle}>{promo.title}</Text>
                                <View style={styles.tagBox}>
                                    <Text style={styles.tagText}>{promo.code}</Text>
                                </View>
                            </View>
                            <Text style={styles.promoDesc}>{promo.description}</Text>
                            <View style={styles.promoFooter}>
                                <View style={styles.expiryBox}>
                                    <Ionicons name="time-outline" size={14} color={Colors.gray} />
                                    <Text style={styles.expiryText}>Expires: {promo.expires}</Text>
                                </View>
                                <Ionicons name="copy-outline" size={20} color={Colors.primary} />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

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
