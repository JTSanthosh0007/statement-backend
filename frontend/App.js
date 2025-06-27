import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthGate from './AuthGate';
import AppPermissions from './AppPermissions';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import AccountScreen from './screens/AccountScreen';
import NotificationScreen from './screens/NotificationScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import HelpScreen from './screens/HelpScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import PhonePeStatementScreen from './screens/PhonePeStatementScreen';
import KotakBankStatementScreen from './screens/KotakBankStatementScreen';
import PDFUnlockerScreen from './screens/PDFUnlockerScreen';
import AllBanksScreen from './screens/AllBanksScreen';
import AllUPIAppsScreen from './screens/AllUPIAppsScreen';
import TransactionSummaryScreen from './screens/TransactionSummaryScreen';
import AnalyzeResultScreen from './screens/AnalyzeResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <AuthGate>
        <AppPermissions />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="PhonePeStatement" component={PhonePeStatementScreen} />
            <Stack.Screen name="KotakBankStatement" component={KotakBankStatementScreen} />
            <Stack.Screen name="PDFUnlocker" component={PDFUnlockerScreen} />
            <Stack.Screen name="AllBanks" component={AllBanksScreen} />
            <Stack.Screen name="AllUPIApps" component={AllUPIAppsScreen} />
            <Stack.Screen name="TransactionSummary" component={TransactionSummaryScreen} />
            <Stack.Screen name="AnalyzeResult" component={AnalyzeResultScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthGate>
    </>
  );
} 