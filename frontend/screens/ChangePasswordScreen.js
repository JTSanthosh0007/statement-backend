import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleChange = () => {
    if (newPass === confirmPass) {
      alert("Password Changed ✅");
      navigation.goBack();
    } else {
      alert("New passwords do not match ❌");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }] }>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Change Password</Text>
      </View>

      <Text style={styles.label}>Old Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={oldPass}
        onChangeText={setOldPass}
        placeholder="Enter old password"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
        placeholder="Enter new password"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPass}
        onChangeText={setConfirmPass}
        placeholder="Confirm new password"
        placeholderTextColor="#888"
      />

      <TouchableOpacity style={styles.button} onPress={handleChange} activeOpacity={0.8}>
        <Ionicons name="checkmark-done-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
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
    gap: 14,
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  label: {
    color: '#aaa',
    marginTop: 12,
    marginBottom: 4,
    fontSize: 15,
  },
  input: {
    backgroundColor: '#18181b',
    color: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  button: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 36,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 