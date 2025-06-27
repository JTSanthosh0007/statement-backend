import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { upiApps } from './data';
import { useNavigation } from '@react-navigation/native';

export default function AllUPIAppsScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }] }>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.title}>All UPI Apps</Text>
      </View>
      <FlatList
        data={upiApps}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }] }>
            <Ionicons name="logo-google-playstore" size={22} color="#7c3aed" style={{ marginRight: 12 }} />
            <Text style={styles.item}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 8, flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#232323', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 4, elevation: 1 },
  item: { color: '#fff', fontSize: 16, fontWeight: '600' },
}); 