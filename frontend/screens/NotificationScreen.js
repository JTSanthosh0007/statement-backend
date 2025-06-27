import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationScreen() {
  const [isEnabled, setIsEnabled] = useState(true);

  const toggleSwitch = () => setIsEnabled(previous => !previous);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={24} color="#7c3aed" style={{ marginRight: 10 }} />
        <Text style={styles.heading}>Notifications</Text>
      </View>

      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
        <View style={styles.info}>
          <Text style={styles.title}>Push Notifications</Text>
          <Text style={styles.subtitle}>Receive push notifications on your device</Text>
        </View>
        <Switch
          trackColor={{ false: "#444", true: "#3B82F6" }}
          thumbColor={isEnabled ? "#fff" : "#ccc"}
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 0,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#18181b',
    padding: 18,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  info: {
    flexShrink: 1,
    marginRight: 10,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 13,
  },
});
