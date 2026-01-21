import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, FlatList, Text, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors } from '../constants/colors';

interface LocationAutocompleteProps {
    placeholder: string;
    onLocationSelect: (location: { name: string, lat: number, lon: number }) => void;
    defaultValue?: string;
}

interface PlaceResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        name?: string;
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
    };
}

export const LocationAutocomplete = ({ placeholder, onLocationSelect, defaultValue = '' }: LocationAutocompleteProps) => {
    const [query, setQuery] = useState(defaultValue);
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2 && showResults) {
                fetchPlaces(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, showResults]);

    useEffect(() => {
        setQuery(defaultValue);
    }, [defaultValue]);

    const fetchPlaces = async (searchText: string) => {
        setIsLoading(true);
        try {
            const response = await api.get('/places/search', {
                params: { q: searchText }
            });

            if (response.data.success) {
                setResults(response.data.results);
            }
        } catch (error: any) {
            console.error('Error fetching places:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (item: PlaceResult) => {
        // ... (rest is same)
        // Construct a shorter, cleaner name
        let name = item.display_name;
        if (item.address) {
            const parts = [
                item.address.name || item.address.road,
                item.address.suburb,
                item.address.city
            ].filter(Boolean);
            if (parts.length > 0) name = parts.join(', ');
        }

        setQuery(name);
        setShowResults(false);
        onLocationSelect({
            name: name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color={Colors.gray} style={{ marginRight: 10 }} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholderTextColor={Colors.gray}
                />
                {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(''); setShowResults(false); }}>
                        <Ionicons name="close-circle" size={18} color={Colors.gray} />
                    </TouchableOpacity>
                )}
            </View>

            {showResults && results.length > 0 && (
                <View style={styles.resultsList}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.place_id.toString()}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                                <Ionicons name="location" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={styles.mainText}>{item.display_name.split(',')[0]}</Text>
                                    <Text style={styles.subText} numberOfLines={1}>{item.display_name}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 10, // Ensure dropdown appears on top
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee'
    },
    input: {
        flex: 1,
        color: Colors.text,
        fontSize: 16
    },
    resultsList: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderRadius: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        maxHeight: 200,
        zIndex: 100,
    },
    resultItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    mainText: {
        fontWeight: 'bold',
        color: Colors.text,
        fontSize: 14
    },
    subText: {
        color: Colors.gray,
        fontSize: 12,
        marginTop: 2
    }
});
