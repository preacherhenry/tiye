import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Alert, Image, ActivityIndicator, Dimensions
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const InputField = ({ label, value, onChange, placeholder, secure = false, keyboard = 'default' }: any) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.gray}
            value={value}
            onChangeText={onChange}
            secureTextEntry={secure}
            keyboardType={keyboard as any}
        />
    </View>
);

const DocPicker = ({ label, uri, onPick }: any) => (
    <TouchableOpacity style={styles.docPicker} onPress={onPick}>
        <View style={styles.docInfo}>
            <Ionicons name={uri ? "checkmark-circle" : "cloud-upload-outline"} size={24} color={uri ? Colors.success : Colors.primary} />
            <Text style={styles.docLabel}>{label}</Text>
        </View>
        {uri && <Image source={{ uri }} style={styles.docPreview} />}
    </TouchableOpacity>
);

const DriverApplyScreen = ({ navigation }: any) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', password: '',
        national_id: '', drivers_license_number: '', license_expiry_date: '',
        vehicle_type: '', vehicle_registration_number: '', vehicle_color: '',
        driving_experience_years: ''
    });

    // Documents
    const [docs, setDocs] = useState<any>({
        license_document: null,
        national_id_document: null,
        vehicle_registration_document: null,
        profile_photo: null
    });

    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const pickImage = async (docType: string) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: docType === 'profile_photo' ? [1, 1] : [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setDocs((prev: any) => ({ ...prev, [docType]: result.assets[0].uri }));
        }
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.name || !formData.phone || !formData.email || !formData.password) {
                Alert.alert("Error", "Please fill in all personal details.");
                return false;
            }
        } else if (step === 2) {
            if (!formData.national_id || !formData.drivers_license_number || !formData.license_expiry_date) {
                Alert.alert("Error", "Please fill in all identification details.");
                return false;
            }
        } else if (step === 3) {
            if (!formData.vehicle_type || !formData.vehicle_registration_number || !formData.vehicle_color || !formData.driving_experience_years) {
                Alert.alert("Error", "Please fill in all vehicle details.");
                return false;
            }
        } else if (step === 4) {
            if (!docs.license_document || !docs.national_id_document || !docs.vehicle_registration_document || !docs.profile_photo) {
                Alert.alert("Error", "Please upload all required documents.");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        if (!acceptedTerms) {
            Alert.alert("Terms & Conditions", "You must accept the terms to continue.");
            return;
        }

        setLoading(true);
        const data = new FormData();

        // Append text fields
        Object.keys(formData).forEach(key => {
            data.append(key, (formData as any)[key]);
        });

        // Append files
        Object.keys(docs).forEach(key => {
            if (docs[key]) {
                const uri = docs[key];
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                data.append(key, { uri, name: filename, type } as any);
            }
        });

        try {
            const res = await api.post('/apply-driver', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                Alert.alert(
                    "Success",
                    "Your application has been submitted and is under review. You will be notified once approved.",
                    [{ text: "OK", onPress: () => navigation.navigate('Login') }]
                );
            } else {
                Alert.alert("Application Failed", res.data.message);
            }
        } catch (error: any) {
            Alert.alert("Error", "An error occurred during submission.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? prevStep() : navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Driver Application</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                {[1, 2, 3, 4, 5].map(i => (
                    <View key={i} style={[styles.progressStep, step >= i && styles.progressStepActive]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {step === 1 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Personal Information</Text>
                        <InputField label="Full Name" value={formData.name} onChange={(v: string) => updateField('name', v)} placeholder="Enter your full name" />
                        <InputField label="Email Address" value={formData.email} onChange={(v: string) => updateField('email', v)} placeholder="email@example.com" keyboard="email-address" />
                        <InputField label="Phone Number" value={formData.phone} onChange={(v: string) => updateField('phone', v)} placeholder="+260 9xx xxxxxx" keyboard="phone-pad" />
                        <InputField label="Create Password" value={formData.password} onChange={(v: string) => updateField('password', v)} placeholder="At least 6 characters" secure />
                    </View>
                )}

                {step === 2 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Identification</Text>
                        <InputField label="National ID / NRC" value={formData.national_id} onChange={(v: string) => updateField('national_id', v)} placeholder="Enter NRC Number" />
                        <InputField label="Driver's License Number" value={formData.drivers_license_number} onChange={(v: string) => updateField('drivers_license_number', v)} placeholder="Enter License Number" />
                        <InputField label="License Expiry Date" value={formData.license_expiry_date} onChange={(v: string) => updateField('license_expiry_date', v)} placeholder="YYYY-MM-DD" />
                    </View>
                )}

                {step === 3 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Vehicle Details</Text>
                        <InputField label="Vehicle Type" value={formData.vehicle_type} onChange={(v: string) => updateField('vehicle_type', v)} placeholder="e.g. Toyota Vitz, Corolla" />
                        <InputField label="Registration Number" value={formData.vehicle_registration_number} onChange={(v: string) => updateField('vehicle_registration_number', v)} placeholder="Enter Plate Number" />
                        <InputField label="Vehicle Color" value={formData.vehicle_color} onChange={(v: string) => updateField('vehicle_color', v)} placeholder="e.g. Silver, White" />
                        <InputField label="Driving Experience (Years)" value={formData.driving_experience_years} onChange={(v: string) => updateField('driving_experience_years', v)} placeholder="Number of years" keyboard="number-pad" />
                    </View>
                )}

                {step === 4 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Upload Documents</Text>
                        <DocPicker label="Driver's License (Front)" uri={docs.license_document} onPick={() => pickImage('license_document')} />
                        <DocPicker label="National ID / NRC" uri={docs.national_id_document} onPick={() => pickImage('national_id_document')} />
                        <DocPicker label="Vehicle Registration" uri={docs.vehicle_registration_document} onPick={() => pickImage('vehicle_registration_document')} />
                        <DocPicker label="Profile Photo" uri={docs.profile_photo} onPick={() => pickImage('profile_photo')} />
                    </View>
                )}

                {step === 5 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Review & Submit</Text>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryText}>By submitting this application, you agree to undergo a background check and verify all provided information is accurate.</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setAcceptedTerms(!acceptedTerms)}
                        >
                            <Ionicons name={acceptedTerms ? "checkbox" : "square-outline"} size={24} color={Colors.primary} />
                            <Text style={styles.checkboxLabel}>I accept the Terms & Conditions</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitBtn, !acceptedTerms && { opacity: 0.5 }]}
                            onPress={handleSubmit}
                            disabled={loading || !acceptedTerms}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.black} />
                            ) : (
                                <Text style={styles.submitBtnText}>Submit Application</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {step < 5 && (
                    <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                        <Text style={styles.nextBtnText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color={Colors.black} />
                    </TouchableOpacity>
                )}
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
    },
    backBtn: {
        padding: 8,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginRight: 15
    },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
    progressContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        justifyContent: 'space-between'
    },
    progressStep: {
        height: 6,
        width: (width - 60) / 5,
        backgroundColor: Colors.lightGray,
        borderRadius: 3
    },
    progressStepActive: {
        backgroundColor: Colors.primary
    },
    scrollContent: { padding: 20, paddingBottom: 40 },
    stepContainer: { animationAction: 'fadeIn' },
    stepTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 25 },
    inputContainer: { marginBottom: 20 },
    label: { color: Colors.gray, fontSize: 14, marginBottom: 8, fontWeight: '500' },
    input: {
        backgroundColor: Colors.surface,
        padding: 15,
        borderRadius: 15,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    docPicker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        minHeight: 80
    },
    docInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    docLabel: { marginLeft: 12, color: Colors.text, fontWeight: '500' },
    docPreview: { width: 50, height: 50, borderRadius: 8 },
    nextBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
        borderRadius: 15,
        marginTop: 20
    },
    nextBtnText: { color: Colors.black, fontWeight: 'bold', fontSize: 16, marginRight: 8 },
    summaryBox: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.lightGray
    },
    summaryText: { color: Colors.gray, lineHeight: 22 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    checkboxLabel: { marginLeft: 10, color: Colors.text, fontWeight: '500' },
    submitBtn: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center'
    },
    submitBtnText: { color: Colors.black, fontWeight: 'bold', fontSize: 16 }
});

export default DriverApplyScreen;
