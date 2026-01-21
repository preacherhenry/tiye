import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { Colors } from '../../../constants/colors';
import api from '../../../services/api';

const DriverSettingsScreen = ({ navigation }: any) => {
    const { user, logout } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need camera roll permissions to select a photo.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Could not open image picker');
        }
    };

    const uploadPhoto = async () => {
        if (!selectedImage || !user) return;

        setUploading(true);
        try {
            const formData = new FormData();
            const filename = selectedImage.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('photo', {
                uri: selectedImage,
                name: filename || 'photo.jpg',
                type,
            } as any);
            formData.append('userId', user.id.toString());

            const response = await api.post('/upload-photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                Alert.alert('Success', 'Profile photo updated! Please log out and log back in to see the change.');
                setSelectedImage(null);
            } else {
                Alert.alert('Error', response.data.message || 'Upload failed');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Profile Photo Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Photo</Text>
                <View style={styles.photoSection}>
                    {selectedImage || user?.profile_photo ? (
                        <Image
                            source={{ uri: selectedImage || user?.profile_photo }}
                            style={styles.profilePhoto}
                        />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="person" size={50} color={Colors.gray} />
                        </View>
                    )}

                    <View style={styles.photoButtons}>
                        <TouchableOpacity style={styles.button} onPress={pickImage}>
                            <Ionicons name="images" size={20} color="black" />
                            <Text style={styles.buttonText}>Choose Photo</Text>
                        </TouchableOpacity>

                        {selectedImage && (
                            <TouchableOpacity
                                style={[styles.button, styles.uploadButton]}
                                onPress={uploadPhoto}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload" size={20} color="black" />
                                        <Text style={styles.buttonText}>Upload</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Driver Info Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Driver Information</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{user?.name}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Phone:</Text>
                    <Text style={styles.value}>{user?.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{user?.email}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Vehicle Info Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vehicle Information</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Model:</Text>
                    <Text style={styles.value}>{user?.car_model || 'Not set'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Plate Number:</Text>
                    <Text style={styles.value}>{user?.plate_number || 'Not set'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Color:</Text>
                    <Text style={styles.value}>{user?.car_color || 'Not set'}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#ff4444" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    title: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    photoSection: {
        alignItems: 'center',
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: Colors.primary,
        marginBottom: 15,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#222',
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    photoButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        gap: 8,
    },
    uploadButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    label: {
        color: Colors.gray,
        fontSize: 14,
    },
    value: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.lightGray,
        marginHorizontal: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 8,
        backgroundColor: '#ff444420',
        gap: 10,
    },
    logoutText: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DriverSettingsScreen;
