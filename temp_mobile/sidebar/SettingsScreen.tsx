import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen = ({ navigation }) => {
    const { logout, user } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", onPress: logout, style: "destructive" }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.background} />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
            </View>

            <View style={styles.profileSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                </View>
                <Text style={styles.name}>{user?.name || 'User Name'}</Text>
                <Text style={styles.phone}>{user?.phone || '+260 000 000 000'}</Text>
            </View>

            <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                    <Text style={styles.menuText}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="language-outline" size={24} color={Colors.text} />
                    <Text style={styles.menuText}>Language</Text>
                    <Text style={{ color: Colors.gray, marginRight: 10 }}>English</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="red" />
                    <Text style={[styles.menuText, { color: 'red' }]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: Colors.primary },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.background, marginLeft: 15 },
    profileSection: { alignItems: 'center', padding: 30, backgroundColor: Colors.surface, marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { fontSize: 30, fontWeight: 'bold', color: Colors.primary },
    name: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    phone: { color: Colors.gray, marginTop: 5 },
    menu: { backgroundColor: Colors.surface },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
    menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: Colors.text }
});

export default SettingsScreen;
