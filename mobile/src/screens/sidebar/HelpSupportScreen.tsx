import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const HelpSupportScreen = ({ navigation }: any) => {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const handleCall = () => Linking.openURL(`tel:+260978128041`);
    const handleEmail = () => Linking.openURL('mailto:support@tiye.com');
    const handleWhatsApp = () => Linking.openURL('https://wa.me/260978128041');

    const faqs = [
        { id: 1, q: 'How do I cancel a ride?', a: 'You can cancel a by tapping the "Cancel" button on the trip island.' },
        { id: 2, q: 'Is my payment secure?', a: 'Yes, all payments are processed through encrypted, industry-standard gateways. We do not store your full card details.' },
        { id: 3, q: 'What if I lost an item?', a: 'If you left something in the car, use the "Call Driver" button in your trip history or contact our support team immediately.' },
    ];

    const toggleFaq = (id: number) => {
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Help & Support</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.intro}>We're here to help you move safely and comfortably.</Text>

                <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
                        <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="call" size={24} color="#2196F3" />
                        </View>
                        <Text style={styles.contactLabel}>Call Us</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="mail" size={24} color="#FF9800" />
                        </View>
                        <Text style={styles.contactLabel}>Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
                        <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
                        </View>
                        <Text style={styles.contactLabel}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                {faqs.map((faq) => (
                    <TouchableOpacity
                        key={faq.id}
                        style={styles.faqCard}
                        onPress={() => toggleFaq(faq.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.faqHeader}>
                            <Text style={styles.faqQuestion}>{faq.q}</Text>
                            <Ionicons
                                name={expandedFaq === faq.id ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={Colors.gray}
                            />
                        </View>
                        {expandedFaq === faq.id && (
                            <Text style={styles.faqAnswer}>{faq.a}</Text>
                        )}
                    </TouchableOpacity>
                ))}

                {/* Report Issue Button */}
                <TouchableOpacity style={styles.reportBtn}>
                    <Ionicons name="alert-circle-outline" size={24} color={Colors.black} />
                    <Text style={styles.reportText}>Report an Emergency</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Tiye Cab Services Zambia</Text>
                    <Text style={styles.footerSub}>Available 24/7 for your safety</Text>
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
    intro: { fontSize: 16, color: Colors.gray, marginBottom: 25, lineHeight: 24 },
    contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    contactCard: {
        width: (width - 60) / 3,
        backgroundColor: Colors.surface,
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    contactLabel: { fontSize: 13, fontWeight: 'bold', color: Colors.text },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.gray, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    faqCard: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { flex: 1, fontSize: 15, fontWeight: 'bold', color: Colors.text, marginRight: 10 },
    faqAnswer: { marginTop: 12, fontSize: 14, color: Colors.gray, lineHeight: 20 },
    reportBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        padding: 20,
        borderRadius: 20,
        marginTop: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    reportText: { marginLeft: 10, fontWeight: 'bold', fontSize: 16, color: Colors.black },
    footer: { marginTop: 40, alignItems: 'center' },
    footerText: { fontSize: 14, fontWeight: 'bold', color: Colors.text },
    footerSub: { fontSize: 12, color: Colors.gray, marginTop: 4 }
});

export default HelpSupportScreen;
