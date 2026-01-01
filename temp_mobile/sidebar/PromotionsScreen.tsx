import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const PromotionsScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.background} />
                </TouchableOpacity>
                <Text style={styles.title}>Promotions</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="Enter Promo Code"
                        style={styles.input}
                        placeholderTextColor={Colors.gray}
                    />
                    <TouchableOpacity style={styles.applyButton}>
                        <Text style={styles.applyText}>Apply</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.emptyState}>
                    <Ionicons name="gift-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No active promotions</Text>
                    <Text style={styles.subText}>Check back later for special offers!</Text>
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
    inputContainer: { flexDirection: 'row', marginBottom: 30 },
    input: { flex: 1, backgroundColor: Colors.surface, padding: 15, borderRadius: 8, marginRight: 10, elevation: 1, color: Colors.text },
    applyButton: { backgroundColor: Colors.primary, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 },
    applyText: { color: Colors.background, fontWeight: 'bold' },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: Colors.gray, marginTop: 15 },
    subText: { color: Colors.gray, marginTop: 5 }
});

export default PromotionsScreen;
