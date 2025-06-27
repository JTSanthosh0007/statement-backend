import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BottomNavBar() {
  const navigation = useNavigation();
  const currentRoute = navigation.getState().routes[navigation.getState().index].name;

  return (
    <View style={styles.fabNav}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.navItem}>
        <View style={[styles.iconWrapper, currentRoute === 'Home' && styles.activeIcon]}>
          <Ionicons name="home" size={28} color={currentRoute === 'Home' ? "#3B82F6" : "#fff"} />
        </View>
        <Text style={[styles.navLabel, currentRoute === 'Home' && styles.activeLabel]}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.navItem}>
        <View style={[styles.iconWrapper, currentRoute === 'Search' && styles.activeIcon]}>
          <Ionicons name="search" size={28} color={currentRoute === 'Search' ? "#3B82F6" : "#fff"} />
        </View>
        <Text style={[styles.navLabel, currentRoute === 'Search' && styles.activeLabel]}>Search</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.navItem}>
        <View style={[styles.iconWrapper, currentRoute === 'Settings' && styles.activeIcon]}>
          <Ionicons name="settings-outline" size={28} color={currentRoute === 'Settings' ? "#3B82F6" : "#fff"} />
        </View>
        <Text style={[styles.navLabel, currentRoute === 'Settings' && styles.activeLabel]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabNav: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 30,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 8,
  },
  activeIcon: {
    backgroundColor: '#222',
  },
  navLabel: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  activeLabel: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
}); 