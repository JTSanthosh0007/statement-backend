import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import BottomNavBar from './BottomNavBar';

export default function HomeScreen() {
  const navigation = useNavigation();
  const currentRoute = navigation.getState().routes[navigation.getState().index].name;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.user}>
          <View style={styles.avatar}><Text style={styles.avatarText}>J</Text></View>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.username}>Hello, jtsanthoshshetty0007</Text>
          </View>
        </View>
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }] }>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Available Apps</Text>

        {/* App Cards */}
        <AppCard bg="#7c3aed" initials="Pe" title="PhonePe" subtitle="Analyze your PhonePe statements" onPress={() => navigation.navigate('PhonePeStatement')} />
        <AppCard bg="#E53E3E" initials="KB" title="Kotak Mahindra Bank" subtitle="Analyze your Kotak Bank statements" onPress={() => navigation.navigate('KotakBankStatement')} />
        <AppCard bg="#2563eb" initials="PU" title="PDF Unlocker" subtitle="Unlock password-protected PDF statements" onPress={() => navigation.navigate('PDFUnlocker')} />
        <AppCard bg="#0A9396" initials="CB" title="Canara Bank" subtitle="Analyze your Canara Bank statements" onPress={() => navigation.navigate('CanaraBankStatement')} />

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={() => navigation.navigate('AllBanks')}>
            <Ionicons name="business" size={18} color="#7c3aed" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>View All Banks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={() => navigation.navigate('AllUPIApps')}>
            <Ionicons name="apps" size={18} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>View All UPI Apps</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavBar />
    </View>
  );
}

function AppCard({ bg, initials, title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.97 }] }] }>
      <View style={[styles.cardIcon, { backgroundColor: bg }]}> 
        <Text style={styles.cardIconText}>{initials}</Text>
      </View>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#232323',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  welcome: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  scroll: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#18181b',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },
  cardTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#18181b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    marginHorizontal: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
});