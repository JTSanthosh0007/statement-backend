import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
// import { PieChart } from 'react-native-chart-kit'; // Uncomment and configure if you want a real chart

export default function AnalyzeResultScreen({ route }) {
  const { summary, chartData } = route.params;
  const [selectedChart, setSelectedChart] = useState('pie');
  const screenWidth = Dimensions.get('window').width;

  // Prepare data for PieChart
  const pieData = Object.entries(chartData || {}).map(([category, value], i) => ({
    name: category,
    amount: typeof value === 'object' ? value.amount : value,
    color: ['#64748b', '#2563eb', '#ef4444', '#22c55e', '#f59e42'][i % 5],
    legendFontColor: '#fff',
    legendFontSize: 14,
  }));

  return (
    <ScrollView style={{ backgroundColor: '#121212', flex: 1 }}>
      {/* Transaction Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transaction Summary</Text>
        <View style={styles.summaryRow}>
          <SummaryBox label="Total Received (CR)" value={`₹${summary?.totalReceived ?? 0}`} color="#22c55e" />
          <SummaryBox label="Total Spent (DR)" value={`₹${summary?.totalSpent ?? 0}`} color="#ef4444" />
          <SummaryBox label="Total Amount" value={`₹${summary?.totalAmount ?? 0}`} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryBox label="Highest Amount" value={`₹${summary?.highestAmount ?? 0}`} />
          <SummaryBox label="Lowest Amount" value={`₹${summary?.lowestAmount ?? 0}`} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryBox label="Total Amount" value={`₹${summary?.pageTotalAmount ?? 0}`} subtext={`Total ${summary?.totalTransactions ?? 0} transactions\n${summary?.pageCount ?? 0} pages`} color="#ef4444" />
        </View>
        <View style={styles.summaryRow}>
          <SummaryBox label="Total Credit Transactions" value={summary?.creditCount ?? 0} color="#22c55e" />
          <SummaryBox label="Total Debit Transactions" value={summary?.debitCount ?? 0} color="#ef4444" />
        </View>
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
          {selectedChart === 'pie' && pieData.length > 0 ? (
            <PieChart
              data={pieData.map(d => ({
                name: d.name,
                population: d.amount,
                color: d.color,
                legendFontColor: d.legendFontColor,
                legendFontSize: d.legendFontSize,
              }))}
              width={screenWidth - 64}
              height={220}
              chartConfig={{
                color: () => '#fff',
                labelColor: () => '#fff',
                backgroundColor: '#18181b',
                backgroundGradientFrom: '#18181b',
                backgroundGradientTo: '#18181b',
                decimalPlaces: 0,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={{ color: '#fff' }}>[Pie Chart Placeholder]</Text>
          )}
          {/* Example legend for PhonePe */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <View style={{ width: 18, height: 18, backgroundColor: '#64748b', borderRadius: 9, marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16 }}>PhonePe</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function SummaryBox({ label, value, color, subtext }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color && { color }]}>{value}</Text>
      {subtext && <Text style={styles.summarySubtext}>{subtext}</Text>}
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
  summarySubtext: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
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