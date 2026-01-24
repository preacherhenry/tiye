import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export const RegisterScreen = ({ navigation }: any) => {
    const { register, isLoading } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
    const [carModel, setCarModel] = useState('');
    const [carColor, setCarColor] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        console.log('📸 Image picker clicked!');

        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log('Permission status:', status);

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need camera roll permissions to select a photo.');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            console.log('Picker result:', result);

            if (!result.canceled && result.assets && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
                Alert.alert('Success', 'Photo selected!');
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Could not open image picker: ' + error);
        }
    };

    const uploadPhoto = async (userId: number, imageUri: string) => {
        console.log('📤 uploadPhoto called');
        console.log('   userId:', userId);
        console.log('   imageUri:', imageUri);

        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            console.log('   filename:', filename);
            console.log('   type:', type);

            const photoData = {
                uri: imageUri,
                name: filename || 'photo.jpg',
                type,
            } as any;

            console.log('   photoData:', photoData);

            formData.append('photo', photoData);
            formData.append('userId', userId.toString());

            console.log('   FormData created, sending to /upload-photo...');

            const response = await api.post('/upload-photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('   Upload response:', response.data);

            if (response.data.success) {
                console.log('   ✅ Photo uploaded successfully!');
                console.log('   Photo URL:', response.data.photoUrl);
                return true;
            } else {
                console.log('   ❌ Upload failed:', response.data.message);
                return false;
            }
        } catch (error: any) {
            console.error('   ❌ Photo upload error:', error);
            console.error('   Error message:', error.message);
            if (error.response) {
                console.error('   Response status:', error.response.status);
                console.error('   Response data:', error.response.data);
            }
            return false;
        }
    };

    const handleRegister = async () => {
        if (role === 'driver') {
            navigation.navigate('DriverApply');
            return;
        }

        console.log('🚀 Starting registration...');
        console.log('   Has profile image:', !!profileImage);

        setUploading(true);
        try {
            const response: any = await register(username, name, phone, email || null, password, role, carModel, carColor, plateNumber);
            console.log('   Registration response:', response);

            if (response.success) {
                console.log('   ✅ Registration successful!');
                console.log('   User ID:', response.userId);

                if (profileImage && response.userId) {
                    console.log('   🖼️  Uploading profile photo...');
                    const photoUploaded = await uploadPhoto(response.userId, profileImage);
                    if (!photoUploaded) {
                        console.warn('   ⚠️  Photo upload failed, but account was created');
                        Alert.alert('Warning', 'Account created but photo upload failed. You can upload it later from settings.');
                    } else {
                        console.log('   ✅ Photo uploaded successfully!');
                    }
                } else {
                    console.log('   ℹ️  No photo to upload or no userId');
                }

                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            } else {
                console.log('   ❌ Registration failed:', response.message);
                Alert.alert('Registration Failed', response.message || 'An unknown error occurred.');
            }
        } catch (error) {
            console.error('   ❌ Registration error:', error);
            Alert.alert('Error', 'A network or system error occurred.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Image
                    source={require('../../../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View style={styles.formContainer}>

                    {/* Profile Photo Section */}
                    <TouchableOpacity
                        style={styles.photoContainer}
                        onPress={pickImage}
                        activeOpacity={0.7}
                    >
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.placeholderPhoto}>
                                <Ionicons name="camera" size={40} color={Colors.gray} />
                                <Text style={styles.photoText}>Tap to Add Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Username (Unique)"
                        placeholderTextColor="#999"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email (Optional)"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="#999"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'passenger' && styles.roleActive]}
                            onPress={() => setRole('passenger')}
                        >
                            <Text style={[styles.roleText, role === 'passenger' && styles.roleTextActive]}>Passenger</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'driver' && styles.roleActive]}
                            onPress={() => setRole('driver')}
                        >
                            <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Driver</Text>
                        </TouchableOpacity>
                    </View>

                    {role === 'driver' && (
                        <View style={styles.driverInfoBox}>
                            <Text style={styles.driverInfoTitle}>Apply to Become a Driver</Text>
                            <Text style={styles.driverInfoText}>To ensure safety and quality, all drivers must submit an application for review including identification and vehicle documents.</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={isLoading || uploading}
                    >
                        {(isLoading || uploading) ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <Text style={styles.buttonText}>{role === 'driver' ? 'Apply Now' : 'Sign Up'}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView >
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 50,
    },
    logo: {
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginBottom: 20,
    },
    formContainer: {
        width: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 20,
        textAlign: 'center',
    },
    photoContainer: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: Colors.primary,
    },
    placeholderPhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#222',
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoText: {
        color: Colors.gray,
        marginTop: 5,
        fontSize: 12,
    },
    input: {
        backgroundColor: '#333333',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        color: Colors.white,
        borderWidth: 1,
        borderColor: '#444444'
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: Colors.black,
        fontSize: 18,
        fontWeight: 'bold',
    },
    roleContainer: {
        flexDirection: 'row',
        backgroundColor: '#222',
        borderRadius: 10,
        marginBottom: 15,
        padding: 4,
    },
    roleButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    roleActive: {
        backgroundColor: Colors.white,
    },
    roleText: {
        color: '#888',
        fontWeight: 'bold',
    },
    roleTextActive: {
        color: Colors.primary,
    },
    driverInfoBox: {
        backgroundColor: '#222',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    driverInfoTitle: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
    },
    driverInfoText: {
        color: Colors.gray,
        fontSize: 14,
        lineHeight: 20,
    },
    link: {
        color: Colors.secondary,
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
