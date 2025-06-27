import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TouchableOpacity, Button, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

export default function PhonePeStatementScreen() {
  const navigation = useNavigation();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const pickAndUpload = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const fileAsset = res.assets[0];
        setFile(fileAsset);
        setUploading(true);
        const backendUrl = 'http://192.168.1.5:8000/analyze-phonepe';
        const formData = new FormData();
        formData.append('file', {
          uri: fileAsset.uri,
          name: fileAsset.name,
          type: fileAsset.mimeType || 'application/pdf',
        });
        const response = await axios.post(backendUrl, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploading(false);
        setAnalyzing(true);
        setTimeout(() => {
          setResult(response.data);
          setAnalyzing(false);
          navigation.navigate('AnalyzeResult', {
            summary: response.data.summary,
            chartData: response.data.categoryBreakdown,
          });
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }] }>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.title}>PhonePe Statement Analysis</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-outline" size={48} color="#aaa" />
        </View>
        <Text style={styles.cardTitle}>Upload Statement</Text>
        <Text style={styles.cardSubtitle}>Upload your bank statement to analyze your spending patterns</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickAndUpload} activeOpacity={0.8}>
          <Ionicons name="cloud-upload-outline" size={36} color="#aaa" style={{ marginBottom: 8 }} />
          <Text style={styles.uploadText}>{file ? file.name : 'Drag and drop your statement\nhere'}</Text>
          <Text style={styles.uploadSubText}>or click to browse</Text>
        </TouchableOpacity>
        {uploading && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center', zIndex: 10
          }}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: '#fff', marginTop: 16, fontWeight: 'bold', fontSize: 18 }}>Uploading PDF...</Text>
          </View>
        )}
        {analyzing && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center', zIndex: 10
          }}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={{ color: '#22c55e', marginTop: 16, fontWeight: 'bold', fontSize: 18 }}>Analyzing PDF...</Text>
          </View>
        )}
        {error && <Text style={{ color: 'red', marginTop: 12 }}>{error}</Text>}
        {result && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: 'white' }}>Result:</Text>
            <Text selectable style={{ color: 'white', fontSize: 12 }}>{JSON.stringify(result, null, 2)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}