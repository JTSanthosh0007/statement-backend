import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';
import BottomNavBar from './BottomNavBar';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // The AuthGate will automatically redirect to AuthScreen on logout
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>U</Text></View>
        <View>
          <Text style={styles.username}>User</Text>
          <Text style={styles.email}>No email set</Text>
        </View>
      </View>

      {/* Settings Options */}
      <SettingsOption label="Account Settings" icon="person-outline" onPress={() => navigation.navigate('Account')} />
      <SettingsOption label="Notifications" icon="notifications-outline" onPress={() => navigation.navigate('Notifications')} />
      <SettingsOption label="Privacy" icon="lock-closed-outline" onPress={() => navigation.navigate('Privacy')} />
      <SettingsOption label="Help & Support" icon="help-circle-outline" onPress={() => navigation.navigate('Help')} />

      {/* Log Out */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <BottomNavBar />
    </View>
  );
}

const SettingsOption = ({ label, icon, onPress }) => (
  <Pressable style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]} onPress={onPress}>
    <Ionicons name={icon} size={20} color="#7c3aed" style={{ marginRight: 12 }} />
    <Text style={styles.optionText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    backgroundColor: '#232323',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  email: {
    color: '#aaa',
    fontSize: 13,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logout: {
    backgroundColor: '#E53E3E',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 30,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 