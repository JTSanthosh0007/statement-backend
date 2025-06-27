import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { upiApps, banks } from './data';
import BottomNavBar from './BottomNavBar';

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  const filteredUPI = query
    ? upiApps.filter(item => item.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredBanks = query
    ? banks.filter(item => item.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={22} color="#aaa" style={styles.searchIcon} />
        <TextInput
          placeholder="Search UPI apps or Banks"
          placeholderTextColor="#888"
          style={styles.input}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <Text style={styles.sectionTitle}>UPI Apps</Text>
      <FlatList
        data={filteredUPI}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }] }>
            <Ionicons name="logo-google-playstore" size={22} color="#7c3aed" style={{ marginRight: 12 }} />
            <Text style={styles.item}>{item}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No UPI app found</Text>}
      />

      <Text style={styles.sectionTitle}>Banks</Text>
      <FlatList
        data={filteredBanks}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }] }>
            <Ionicons name="card" size={22} color="#2563eb" style={{ marginRight: 12 }} />
            <Text style={styles.item}>{item}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No bank found</Text>}
      />

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    paddingVertical: 14,
    fontSize: 17,
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 1,
  },
  item: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 10,
  },
}); 