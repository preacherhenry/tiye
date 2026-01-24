import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

export const LoginScreen = ({ navigation }: any) => {
    const { login, isLoading } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!identifier || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            const response = await login(identifier, password);
            if (!response.success) {
                Alert.alert('Login Failed', response.message);
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'An error occurred during login');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Image
                    source={require('../../../assets/tiye_logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Username or Email"
                        placeholderTextColor="#999"
                        value={identifier}
                        onChangeText={setIdentifier}
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <Text style={styles.buttonText}>Log In</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.link}>Don't have an account? Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logo: {
        width: 150,
        height: 150,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Colors.secondary,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: Colors.gray,
        textAlign: 'center',
        marginBottom: 40,
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: '#333333', // Lighter background for better contrast
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
    link: {
        color: Colors.secondary,
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
