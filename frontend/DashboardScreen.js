import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTailwind } from 'tailwindcss-react-native';
import { Ionicons } from '@expo/vector-icons';

const AppCard = ({ color, initials, title, subtitle }) => {
  const tailwind = useTailwind();
  return (
    <View style={tailwind('flex-row items-center bg-gray-800 rounded-xl p-4 mb-4 shadow-md')}>
      <View style={[
        tailwind('w-12 h-12 rounded-full justify-center items-center mr-4'),
        { backgroundColor: color }
      ]}>
        <Text style={tailwind('text-white text-lg font-bold')}>{initials}</Text>
      </View>
      <View>
        <Text style={tailwind('text-white text-base font-semibold')}>{title}</Text>
        <Text style={tailwind('text-gray-400 text-xs mt-1')}>{subtitle}</Text>
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const tailwind = useTailwind();

  return (
    <View style={tailwind('flex-1 bg-black')}>
      {/* Top Bar */}
      <View style={tailwind('flex-row items-center justify-between px-4 pt-10 pb-4')}>
        <View style={tailwind('flex-row items-center')}>
          <View style={tailwind('w-10 h-10 rounded-full bg-gray-700 justify-center items-center mr-3')}>
            <Text style={tailwind('text-white text-lg font-bold')}>J</Text>
          </View>
          <View>
            <Text style={tailwind('text-gray-400 text-xs')}>Welcome back,</Text>
            <Text style={tailwind('text-white text-lg font-bold')}>Hello, <Text style={tailwind('font-normal')}>jtsanthoshshetty0007</Text></Text>
          </View>
        </View>
        <Ionicons name="notifications-outline" size={26} color="#fff" />
      </View>

      {/* Main Content */}
      <ScrollView style={tailwind('flex-1 px-4')}>
        <Text style={tailwind('text-white text-lg font-bold mb-4')}>Available Apps</Text>
        <AppCard
          color="#7c3aed"
          initials="Pe"
          title="PhonePe"
          subtitle="Analyze your PhonePe statements"
        />
        <AppCard
          color="#ef4444"
          initials="KB"
          title="Kotak Mahindra Bank"
          subtitle="Analyze your Kotak Bank statements"
        />
        <AppCard
          color="#2563eb"
          initials="PU"
          title="PDF Unlocker"
          subtitle="Unlock password-protected PDF statements"
        />

        {/* Bottom Buttons */}
        <View style={tailwind('flex-row justify-between mt-4')}>
          <TouchableOpacity style={tailwind('flex-1 bg-gray-800 rounded-xl py-3 mr-2 items-center shadow-md')}>
            <Text style={tailwind('text-white font-semibold')}>View All Banks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tailwind('flex-1 bg-gray-800 rounded-xl py-3 ml-2 items-center shadow-md')}>
            <Text style={tailwind('text-white font-semibold')}>View All UPI Apps</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={tailwind('flex-row justify-around items-center bg-gray-900 py-3 rounded-t-2xl shadow-lg')}>
        <Ionicons name="home" size={28} color="#fff" />
        <Ionicons name="search" size={28} color="#fff" />
        <Ionicons name="settings-outline" size={28} color="#fff" />
      </View>
    </View>
  );
} 