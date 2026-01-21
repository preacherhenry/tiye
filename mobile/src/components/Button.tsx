import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, isLoading, variant = 'primary' }) => {
    const getBgColor = () => {
        switch (variant) {
            case 'secondary': return Colors.secondary;
            case 'danger': return 'transparent';
            case 'success': return 'transparent';
            default: return Colors.primary;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'secondary': return Colors.primary;
            case 'danger': return Colors.danger;
            case 'success': return Colors.success;
            default: return Colors.white;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: getBgColor() }]}
            onPress={onPress}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
