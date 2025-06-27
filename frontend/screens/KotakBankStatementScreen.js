import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { analyzeKotak } from './api';

export default function KotakBankStatementScreen() {
  const navigation = useNavigation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const pickFile = async () => {
    setError('');
    setResult(null);
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (res.type === 'success') {
      setFile(res);
      analyzePDF(res);
    }
  };

  const analyzePDF = async (pdfFile) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeKotak(pdfFile.uri);
      setResult(data);
    } catch (err) {
      setError('Failed to analyze PDF. Please try again.');
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
        <Text style={styles.title}>Kotak Bank Statement Analysis</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-outline" size={48} color="#aaa" />
        </View>
        <Text style={styles.cardTitle}>Upload Statement</Text>
        <Text style={styles.cardSubtitle}>Upload your Kotak bank statement to analyze your spending patterns</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickFile} activeOpacity={0.8}>
          <Ionicons name="cloud-upload-outline" size={36} color="#aaa" style={{ marginBottom: 8 }} />
          <Text style={styles.uploadText}>{file ? file.name : 'Drag and drop your statement\nhere'}</Text>
          <Text style={styles.uploadSubText}>or click to browse</Text>
        </TouchableOpacity>
        {loading && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center', zIndex: 10
          }}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: '#fff', marginTop: 16, fontWeight: 'bold', fontSize: 18 }}>Analyzing PDF...</Text>
          </View>
        )}
        {error ? <Text style={{ color: 'red', marginTop: 12 }}>{error}</Text> : null}
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    backgroundColor: '#232323',
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cardTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 22,
    textAlign: 'center',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    backgroundColor: '#161618',
  },
  uploadText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 2,
  },
  uploadSubText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
}); 