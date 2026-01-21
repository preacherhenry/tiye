import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const PersonalInformationScreen = ({ navigation }: any) => {
    const { user, login } = useAuth(); // We'll use a hack to update context by re-setting user data if needed, or better, fetch fresh profile
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [profileImage, setProfileImage] = useState(user?.profile_photo || null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need access to your gallery to update your photo.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const selectedUri = result.assets[0].uri;
                handleUploadPhoto(selectedUri);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not pick image');
        }
    };

    const handleUploadPhoto = async (uri: string) => {
        setUpdating(true);
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('photo', { uri, name: filename, type } as any);
            formData.append('userId', user?.id?.toString() || '');

            const response = await api.post('/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setProfileImage(response.data.photoUrl);
                Alert.alert('Success', 'Profile photo updated!');
            } else {
                Alert.alert('Upload Failed', response.data.message);
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred during upload');
        } finally {
            setUpdating(false);
        }
    };

    const handleSave = async () => {
        if (!name || !email || !phone) {
            Alert.alert('Error', 'All fields are required');
            return;
        }

        setUpdating(true);
        try {
            const response = await api.put('/update-profile', { name, email, phone });
            if (response.data.success) {
                Alert.alert('Success', 'Profile updated successfully');
                // Optional: Force a refresh of the user context would be better here
                // For now, we rely on the user seeing the update and the back button
            } else {
                Alert.alert('Update Failed', response.data.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Could not update profile');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Personal Information</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{name?.[0] || 'U'}</Text>
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <Ionicons name="camera" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.photoHint}>Tap to change profile picture</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your Name"
                            placeholderTextColor={Colors.gray}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="email@example.com"
                            placeholderTextColor={Colors.gray}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+260..."
                            placeholderTextColor={Colors.gray}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, updating && styles.disabledBtn]}
                        onPress={handleSave}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator color="black" size="small" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    content: { padding: 20 },
    photoSection: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 40,
        backgroundColor: Colors.surface,
        position: 'relative',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5
    },
    avatar: { width: 120, height: 120, borderRadius: 40 },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarInitial: { fontSize: 48, fontWeight: 'bold', color: Colors.black },
    editIconContainer: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: Colors.black,
        padding: 10,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: Colors.background
    },
    photoHint: { color: Colors.gray, marginTop: 15, fontSize: 13 },
    form: { backgroundColor: Colors.surface, borderRadius: 25, padding: 25, borderWidth: 1, borderColor: Colors.lightGray },
    inputGroup: { marginBottom: 20 },
    label: { color: Colors.gray, fontSize: 13, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: {
        backgroundColor: Colors.background,
        color: Colors.text,
        padding: 15,
        borderRadius: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10
    },
    disabledBtn: { opacity: 0.7 },
    saveBtnText: { color: Colors.black, fontSize: 16, fontWeight: 'bold' }
});
