import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { analyzeCanara } from './api';

export default function CanaraBankStatementScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePickFile = async () => {
    setError('');
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (res.type === 'success') {
      analyzePDF(res);
    }
  };

  const analyzePDF = async (pdfFile) => {
    setLoading(true);
    setError('');
    try {
      const data = await analyzeCanara(pdfFile.uri);
      navigation.navigate('AnalyzeResult', { data });
    } catch (e) {
      setError('Failed to analyze PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Canara Bank Statement Analyzer</Text>
      <Text style={styles.subtitle}>Upload your Canara Bank statement to analyze your spending patterns</Text>
      <TouchableOpacity style={styles.button} onPress={handlePickFile} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Analyzing...' : 'Upload PDF'}</Text>
        {loading && <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />}
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#0A9396' },
  subtitle: { fontSize: 16, color: '#333', marginBottom: 24, textAlign: 'center' },
  button: { backgroundColor: '#0A9396', padding: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: 'red', marginTop: 16 },
});
