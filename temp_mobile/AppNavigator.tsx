import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { PassengerHomeScreen } from '../screens/passenger/PassengerHomeScreen';
import { DriverDashboard } from '../screens/driver/DriverDashboard';
import MyRidesScreen from '../screens/sidebar/MyRidesScreen';
import PaymentsScreen from '../screens/sidebar/PaymentsScreen';
import PromotionsScreen from '../screens/sidebar/PromotionsScreen';
import SettingsScreen from '../screens/sidebar/SettingsScreen';
import HelpSupportScreen from '../screens/sidebar/HelpSupportScreen';
import DriverRidesScreen from '../screens/driver/sidebar/DriverRidesScreen';
import DriverEarningsScreen from '../screens/driver/sidebar/DriverEarningsScreen';
import DriverSettingsScreen from '../screens/driver/sidebar/DriverSettingsScreen';
import DriverSupportScreen from '../screens/driver/sidebar/DriverSupportScreen';
import DriverApplyScreen from '../screens/auth/DriverApplyScreen';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

const Stack = createStackNavigator();

export const AppNavigator = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    user.role === 'driver' ? (
                        <>
                            <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
                            <Stack.Screen name="DriverRides" component={DriverRidesScreen} />
                            <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
                            <Stack.Screen name="DriverSettings" component={DriverSettingsScreen} />
                            <Stack.Screen name="DriverSupport" component={DriverSupportScreen} />
                        </>
                    ) : (
                        <>
                            <Stack.Screen name="PassengerHome" component={PassengerHomeScreen} />
                            <Stack.Screen name="MyRides" component={MyRidesScreen} />
                            <Stack.Screen name="Payments" component={PaymentsScreen} />
                            <Stack.Screen name="Promotions" component={PromotionsScreen} />
                            <Stack.Screen name="Settings" component={SettingsScreen} />
                            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                        </>
                    )
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="DriverApply" component={DriverApplyScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
