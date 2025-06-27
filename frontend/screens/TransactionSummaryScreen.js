import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
// import { PieChart } from 'react-native-chart-kit'; // Uncomment if using chart-kit

export default function TransactionSummaryScreen({ route }) {
  const { summary, chartData } = route.params;
  const [selectedChart, setSelectedChart] = useState('pie');

  return (
    <ScrollView style={{ backgroundColor: '#121212', flex: 1 }}>
      {/* Transaction Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transaction Summary</Text>
        <View style={styles.summaryRow}>
          <SummaryBox label="Total Received (CR)" value={`₹${summary.totalReceived}`} color="#22c55e" />
          <SummaryBox label="Total Spent (DR)" value={`₹${summary.totalSpent}`} color="#ef4444" />
          <SummaryBox label="Total Amount" value={`₹${summary.totalAmount}`} />
        </View>
        {/* Add more summary boxes as needed */}
      </View>

      {/* Spending Analysis Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spending Analysis</Text>
        <View style={styles.tabRow}>
          {['pie', 'bar', 'doughnut', 'horizontal'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.tab, selectedChart === type && styles.activeTab]}
              onPress={() => setSelectedChart(type)}
            >
              <Text style={selectedChart === type ? styles.activeTabText : styles.tabText}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Chart
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          {/* Render your chart here based on selectedChart */}
          {/* Example: <PieChart data={chartData} ... /> */}
          <Text style={{ color: '#fff' }}>[Chart goes here]</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function SummaryBox({ label, value, color }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryBox: {
    flex: 1,
    margin: 4,
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  summaryValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#232323',
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    color: '#aaa',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 