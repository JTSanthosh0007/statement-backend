'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">Privacy</h1>
      </div>

      {/* Privacy Content */}
      <div className="p-4 pb-24">
        {/* Data Usage Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Data Usage</h2>
          <div className="text-sm text-zinc-400 space-y-4">
            <p>
              We collect and analyze your transaction data to provide comprehensive insights and analytics that help you better understand your financial patterns and make informed decisions. Our data collection and processing practices are designed with your privacy and security as the top priority.
            </p>

            <h3 className="text-white font-medium pt-2">Data Collection</h3>
            <p>
              When you use our application, we collect various types of transaction data, including but not limited to: transaction amounts, dates, merchant information, transaction categories, and payment methods. This data is collected directly from your uploaded bank statements or through secure connections with your financial institutions. We also gather metadata such as transaction timestamps, device information, and usage patterns to enhance your experience and improve our services.
            </p>

            <h3 className="text-white font-medium pt-2">Security Measures</h3>
            <p>
              Your data is protected using industry-standard encryption protocols at every stage - during transmission, processing, and storage. We employ AES-256 encryption for data at rest and TLS 1.3 for data in transit. Our servers are hosted in secure facilities with multiple layers of physical and digital security measures. Access to user data is strictly controlled and monitored, with multiple authentication layers required for any data access.
            </p>

            <h3 className="text-white font-medium pt-2">Data Processing</h3>
            <p>
              Our advanced analytics engine processes your transaction data to provide valuable insights. This includes: categorizing transactions, identifying spending patterns, detecting unusual activities, generating monthly reports, and creating personalized financial recommendations. The processing is automated and runs on secure, isolated environments to ensure data privacy. Our machine learning models are trained on anonymized datasets to maintain individual privacy while improving accuracy.
            </p>

            <h3 className="text-white font-medium pt-2">Data Storage</h3>
            <p>
              Your data is stored in secure, encrypted databases with regular backups to prevent data loss. We maintain separate storage environments for active data and archived data. Active data is stored on high-performance servers for quick access, while archived data is stored in secure, long-term storage solutions. All storage systems are regularly audited and updated to maintain security standards.
            </p>

            <h3 className="text-white font-medium pt-2">Data Retention</h3>
            <p>
              We retain your transaction data for as long as you maintain an active account with us. Historical data is crucial for providing year-over-year analysis and long-term financial insights. However, you have the option to delete your data at any time through the app's privacy settings. When you request data deletion, we ensure complete removal from both active and backup systems within 30 days.
            </p>

            <h3 className="text-white font-medium pt-2">Data Analysis Benefits</h3>
            <p>
              The analysis of your transaction data enables us to provide numerous benefits, including: personalized spending insights, budget recommendations, fraud detection alerts, merchant spending analysis, category-wise breakdowns, and trend analysis. We also use aggregated, anonymized data to improve our services and develop new features that benefit all users.
            </p>

            <h3 className="text-white font-medium pt-2">Third-Party Integration</h3>
            <p>
              When integrating with third-party services (such as banks or payment processors), we maintain strict data sharing protocols. We only share the minimum required data necessary for the service to function. All third-party integrations are thoroughly vetted for security compliance and must meet our strict data protection standards. You always maintain control over which third-party services can access your data.
            </p>

            <h3 className="text-white font-medium pt-2">Data Access Controls</h3>
            <p>
              We implement strict access controls to protect your data. Our employees only have access to anonymized data for service improvement purposes. Any direct access to user data requires multiple levels of authorization and is logged for security auditing. We regularly review and update access permissions to maintain the principle of least privilege.
            </p>

            <h3 className="text-white font-medium pt-2">Compliance and Regulations</h3>
            <p>
              Our data handling practices comply with major financial and data protection regulations. We regularly update our systems and practices to maintain compliance with evolving standards. This includes adherence to GDPR, CCPA, and other relevant data protection laws. We conduct regular security audits and maintain transparent data handling policies.
            </p>

            <h3 className="text-white font-medium pt-2">User Control and Transparency</h3>
            <p>
              You maintain full control over your data through our privacy settings. You can view what data is collected, how it's used, and manage your sharing preferences. We provide tools to export your data in standard formats and options to limit data collection while maintaining essential service functionality. Our transparency reports detail our data handling practices and are regularly updated.
            </p>

            <h3 className="text-white font-medium pt-2">Continuous Monitoring</h3>
            <p>
              We maintain continuous monitoring systems to detect and prevent unauthorized access or unusual activities. Our security teams actively monitor system logs, access patterns, and potential vulnerabilities. We employ advanced threat detection systems and regularly update our security measures to address emerging threats.
            </p>

            <h3 className="text-white font-medium pt-2">Data Recovery and Business Continuity</h3>
            <p>
              To ensure your data is always available when you need it, we maintain robust backup and recovery systems. Our infrastructure is designed with redundancy and failover capabilities to prevent data loss and ensure service continuity. Regular disaster recovery tests are conducted to verify our ability to restore services and data access quickly in case of any incidents.
            </p>

            <h3 className="text-white font-medium pt-2">Future Improvements</h3>
            <p>
              We continuously work on improving our data handling and analysis capabilities while maintaining strict privacy standards. This includes developing more sophisticated encryption methods, implementing advanced anonymization techniques, and enhancing our analytical capabilities to provide even more valuable insights while protecting your privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 