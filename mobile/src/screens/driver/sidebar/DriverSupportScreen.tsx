import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const DriverSupportScreen = ({ navigation }: any) => {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const handleCall = () => Linking.openURL(`tel:+260978128041`);
    const handleEmail = () => Linking.openURL('mailto:driver-support@tiye.com');
    const handleWhatsApp = () => Linking.openURL('https://wa.me/260978128041');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.background} />
                </TouchableOpacity>
                <Text style={styles.title}>Driver Support</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.intro}>Need help with a trip?</Text>

                <TouchableOpacity style={styles.card} onPress={handleCall}>
                    <View style={[styles.iconBox, { backgroundColor: '#e3f2fd' }]}>
                        <Ionicons name="call" size={24} color="#2196f3" />
                    </View>
                    <View>
                        <Text style={styles.cardTitle}>Driver Hotline</Text>
                        <Text style={styles.cardSubtitle}>Urgent issues</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={handleEmail}>
                    <View style={[styles.iconBox, { backgroundColor: '#fff3e0' }]}>
                        <Ionicons name="mail" size={24} color="#ff9800" />
                    </View>
                    <View>
                        <Text style={styles.cardTitle}>Email Support</Text>
                        <Text style={styles.cardSubtitle}>Payment or account issues</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={handleWhatsApp}>
                    <View style={[styles.iconBox, { backgroundColor: '#e8f5e9' }]}>
                        <Ionicons name="logo-whatsapp" size={24} color="#4caf50" />
                    </View>
                    <View>
                        <Text style={styles.cardTitle}>WhatsApp Support</Text>
                        <Text style={styles.cardSubtitle}>Quick chat for drivers</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.faqSection}>
                    <Text style={styles.faqTitle}>Driver FAQs</Text>

                    <TouchableOpacity style={styles.faqItem} onPress={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: Colors.text, fontWeight: 'bold' }}>When do I get paid?</Text>
                                <Ionicons name={expandedFaq === 1 ? "chevron-up" : "chevron-down"} size={20} color={Colors.gray} />
                            </View>
                            {expandedFaq === 1 && (
                                <Text style={{ color: Colors.gray, marginTop: 10 }}>Driver payments are processed weekly every Monday based on the previous week's completed trips.</Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.faqItem} onPress={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: Colors.text, fontWeight: 'bold' }}>How to improve my rating?</Text>
                                <Ionicons name={expandedFaq === 2 ? "chevron-up" : "chevron-down"} size={20} color={Colors.gray} />
                            </View>
                            {expandedFaq === 2 && (
                                <Text style={{ color: Colors.gray, marginTop: 10 }}>Keep your vehicle clean, be professional, and follow the most efficient routes to ensure high customer satisfaction.</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: Colors.primary },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.background, marginLeft: 15 },
    content: { padding: 20 },
    intro: { fontSize: 18, color: Colors.text, marginBottom: 20 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
    iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardTitle: { fontWeight: 'bold', fontSize: 16, color: Colors.text },
    cardSubtitle: { color: Colors.gray, fontSize: 13 },
    faqSection: { marginTop: 20 },
    faqTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: Colors.text },
    faqItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.lightGray }
});

export default DriverSupportScreen;
