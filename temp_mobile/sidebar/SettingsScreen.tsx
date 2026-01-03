import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen = ({ navigation }: any) => {
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

    const Section = ({ title, children }: any) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );

    const SettingItem = ({ icon, label, subtext, onPress, color = Colors.text, danger = false }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: danger ? '#FFEBEB' : Colors.lightGray + '55' }]}>
                <Ionicons name={icon} size={22} color={danger ? '#FF3B30' : Colors.primary} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuLabel, danger && { color: '#FF3B30' }]}>{label}</Text>
                {subtext && <Text style={styles.menuSubtext}>{subtext}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Overview */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user?.profile_photo ? (
                            <Image source={{ uri: user.profile_photo }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{user?.name?.[0] || 'U'}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Ionicons name="camera" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>{user?.name || 'User Name'}</Text>
                    <Text style={styles.profilePhone}>{user?.phone || '+260 000 000 000'}</Text>
                </View>

                <Section title="Account Settings">
                    <SettingItem
                        icon="person-outline"
                        label="Personal Information"
                        subtext="Name, Email, Phone Number"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        label="Security"
                        subtext="Change Password, 2FA"
                        onPress={() => { }}
                    />
                </Section>

                <Section title="Preferences">
                    <SettingItem
                        icon="notifications-outline"
                        label="Notifications"
                        subtext="On"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="globe-outline"
                        label="Language"
                        subtext="English"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="moon-outline"
                        label="Dark Mode"
                        subtext="System Default"
                        onPress={() => { }}
                    />
                </Section>

                <Section title="Account Actions">
                    <SettingItem
                        icon="help-circle-outline"
                        label="Help & Support"
                        onPress={() => navigation.navigate('HelpSupport')}
                    />
                    <SettingItem
                        icon="log-out-outline"
                        label="Sign Out"
                        danger
                        onPress={handleLogout}
                    />
                </Section>

                <Text style={styles.versionHeader}>Version 1.0.4 (Production)</Text>
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
    content: { paddingBottom: 40 },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 1,
        marginBottom: 25
    },
    avatarContainer: {
        width: 100,
        height: 100,
        marginBottom: 15,
        position: 'relative'
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 35,
        backgroundColor: Colors.lightGray
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 35,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarInitial: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Colors.black
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.black,
        padding: 8,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: Colors.surface
    },
    profileName: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
    profilePhone: { color: Colors.gray, fontSize: 14, marginTop: 4 },
    section: { paddingHorizontal: 20, marginBottom: 25 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.gray,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    sectionContent: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    menuTextContainer: { flex: 1 },
    menuLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
    menuSubtext: { fontSize: 12, color: Colors.gray, marginTop: 2 },
    versionHeader: {
        textAlign: 'center',
        color: Colors.gray,
        fontSize: 12,
        marginTop: 10,
        opacity: 0.5
    }
});

export default SettingsScreen;
