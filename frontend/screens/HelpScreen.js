import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function HelpScreen() {
  const phone = '+91 9876543210';
  const email = 'support@example.com';

  const callSupport = () => {
    Linking.openURL(`tel:${phone}`);
  };

  const emailSupport = () => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="help-circle-outline" size={24} color="#7c3aed" style={{ marginRight: 10 }} />
        <Text style={styles.heading}>Help & Support</Text>
      </View>

      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]} onPress={callSupport}>
        <View style={styles.row}>
          <Text style={styles.contact}>{phone}</Text>
          <Ionicons name="call" size={20} color="#3B82F6" />
        </View>
        <Text style={styles.info}>Available Monday to Friday, 9:00 AM - 6:00 PM IST</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]} onPress={emailSupport}>
        <View style={styles.row}>
          <Text style={styles.contact}>{email}</Text>
          <MaterialIcons name="email" size={20} color="#3B82F6" />
        </View>
        <Text style={styles.info}>We typically respond within 24 hours</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 0,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#18181b',
    padding: 18,
    borderRadius: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  contact: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    color: '#aaa',
    fontSize: 13,
  },
}); 