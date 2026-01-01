import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const DriverSupportScreen = ({ navigation }: any) => {
    const handleCall = () => Linking.openURL(`tel:+260970000000`);
    const handleEmail = () => Linking.openURL('mailto:driver-support@tiye.com');

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

                <View style={styles.faqSection}>
                    <Text style={styles.faqTitle}>Driver FAQs</Text>
                    <TouchableOpacity style={styles.faqItem}>
                        <Text style={{ color: Colors.text }}>When do I get paid?</Text>
                        <Ionicons name="chevron-down" size={20} color={Colors.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.faqItem}>
                        <Text style={{ color: Colors.text }}>How to improve my rating?</Text>
                        <Ionicons name="chevron-down" size={20} color={Colors.gray} />
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
