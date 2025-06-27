import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={24} color="#7c3aed" style={{ marginRight: 10 }} />
        <Text style={styles.heading}>Privacy Policy</Text>
      </View>
      {sections.map((section, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.cardText}>{section.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const sections = [
  { title: 'Data Usage', text: 'We collect and analyze your transaction data to provide comprehensive insights and analytics that help you better understand your financial patterns and make informed decisions...' },
  { title: 'Data Collection', text: 'When you use our application, we collect various types of transaction data, including but not limited to: transaction amounts, dates, merchant information, etc.' },
  { title: 'Security Measures', text: 'Your data is protected using industry-standard encryption protocols at every stage - during transmission, processing, and storage...' },
  { title: 'Data Processing', text: 'Our advanced analytics engine processes your transaction data to provide valuable insights. This includes categorizing transactions, detecting unusual activity, and generating monthly reports...' },
  { title: 'Data Storage', text: 'Your data is stored in secure, encrypted databases with regular backups to prevent data loss. We use high-performance servers for quick access and long-term storage solutions for archived data...' },
  { title: 'Data Retention', text: 'We retain your transaction data for as long as you maintain an active account. You can delete it anytime from your settings. We ensure removal from both active and backup systems within 30 days...' },
  { title: 'Data Analysis Benefits', text: 'The analysis enables features like: spending insights, budget tips, fraud alerts, and category-wise breakdowns. We use anonymized data to improve features for everyone...' },
  { title: 'Third-Party Integration', text: 'We only share minimum required data with 3rd parties like banks/payment gateways. We always check their security and privacy standards...' },
  { title: 'Data Access Controls', text: 'Only authorized employees can view anonymized service-level data. Direct access requires multiple approvals and is audited for compliance...' },
  { title: 'Compliance and Regulations', text: 'We follow rules like GDPR, CCPA, RBI standards, and conduct regular audits to keep your data safe and compliant with Indian and global laws...' },
  { title: 'User Control and Transparency', text: 'You control what data is collected and how it\'s used. Our app provides clear settings and export options for transparency...' },
  { title: 'Continuous Monitoring', text: 'We monitor all system logs, access patterns, and use detection systems to prevent hacks or suspicious access...' },
  { title: 'Data Recovery and Continuity', text: 'Backups, redundancy, and disaster recovery tools are in place to ensure smooth operation even if something breaks...' },
  { title: 'Future Improvements', text: 'We\'re always working to make our encryption stronger and analytics more powerful while keeping your data private and secure...' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    color: '#7c3aed',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  cardText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
}); 