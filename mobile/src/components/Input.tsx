import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { Colors } from '../constants/colors';

interface InputProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    label?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}

export const Input: React.FC<InputProps> = ({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={Colors.gray}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        width: '100%',
    },
    label: {
        color: Colors.gray,
        marginBottom: 5,
        fontSize: 14,
    },
    input: {
        backgroundColor: Colors.surface,
        color: Colors.white,
        height: 50,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
    },
});
