import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Enter your email', 'Please enter your email to reset your password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your email', 'A password reset link has been sent to your email.');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={24} color="#7c3aed" style={{ marginRight: 10 }} />
        <Text style={styles.heading}>Reset Password</Text>
      </View>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="your@gmail.com"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleReset} activeOpacity={0.8}>
        <Ionicons name="send-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  label: { marginBottom: 4, color: '#aaa', fontSize: 15 },
  input: { backgroundColor: '#18181b', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  button: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, marginTop: 24, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
}); 