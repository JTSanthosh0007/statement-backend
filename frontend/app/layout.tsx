import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthWrapper from './components/AuthWrapper'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Statement Analyzer',
  description: 'Analyze your bank statements and UPI transactions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
} 