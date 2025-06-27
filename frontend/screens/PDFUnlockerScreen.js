import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { unlockPDF } from './api';

export default function PDFUnlockerScreen() {
  const navigation = useNavigation();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (res.type === 'success') {
      setFile(res);
    }
  };

  const handleUnlock = async () => {
    setError('');
    setResult(null);
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }
    if (!password) {
      setError('Please enter the PDF password.');
      return;
    }
    setLoading(true);
    try {
      const res = await unlockPDF(file.uri, password);
      setResult(res);
    } catch (e) {
      setError(e.message || 'Failed to unlock PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }] }>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.title}>PDF Unlocker</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={36} color="#b794f4" />
        </View>
        <Text style={styles.cardTitle}>PDF Unlocker</Text>
        <Text style={styles.cardSubtitle}>Unlock password-protected PDFs</Text>
        <Text style={styles.label}>Select PDF file</Text>
        <View style={styles.fileRow}>
          <TouchableOpacity style={styles.chooseFileBtn} onPress={pickFile} activeOpacity={0.8}>
            <Text style={styles.chooseFileText}>Choose File</Text>
          </TouchableOpacity>
          <Text style={styles.fileName}>{file ? file.name : 'No file chosen'}</Text>
        </View>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter PDF password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.unlockBtn} activeOpacity={0.8} onPress={handleUnlock} disabled={loading}>
          <Text style={styles.unlockBtnText}>{loading ? 'Unlocking...' : 'Unlock PDF'}</Text>
        </TouchableOpacity>
        {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}
        {result ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: '#0f0', fontWeight: 'bold' }}>Success!</Text>
            <Text style={{ color: '#ccc' }}>{JSON.stringify(result)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 14,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 28,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
  },
  iconCircle: {
    backgroundColor: '#7c3aed22',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 19,
    marginBottom: 2,
  },
  cardSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 18,
  },
  label: {
    color: '#ccc',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chooseFileBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginRight: 10,
  },
  chooseFileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fileName: {
    color: '#ccc',
    fontSize: 14,
    flexShrink: 1,
  },
  input: {
    backgroundColor: '#232323',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 18,
    width: '100%',
  },
  unlockBtn: {
    backgroundColor: '#444a58',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  unlockBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 