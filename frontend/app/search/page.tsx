'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UPI_APPS, searchApps } from '../constants/upiApps'

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredApps, setFilteredApps] = useState<any[]>([])

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchApps(searchQuery)
      setFilteredApps(results)
    } else {
      setFilteredApps(UPI_APPS)
    }
  }, [searchQuery])

  // Group apps by category
  const groupedApps = {
    upiApps: filteredApps.filter(app => app.category === 'payment' && !app.bankCode),
    publicBanks: filteredApps.filter(app => app.category === 'public'),
    privateBanks: filteredApps.filter(app => app.category === 'private'),
    paymentBanks: filteredApps.filter(app => app.category === 'payment' && app.bankCode),
    smallFinanceBanks: filteredApps.filter(app => app.category === 'small-finance'),
    foreignBanks: filteredApps.filter(app => app.category === 'foreign')
  }

  const handleAppClick = (app: any) => {
    if (app.id === 'phonepe') {
      router.push('/phonepe')
    } else if (app.id === 'kotak') {
      router.push('/kotak')
    } else if (app.id === 'paytm') {
      router.push('/paytm')
    } else {
      router.push('/banks')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-zinc-400 hover:text-white flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* Search Input */}
      <div className="sticky top-0 bg-black pb-4 z-10">
        <div className="flex items-center gap-2 bg-zinc-900 rounded-xl p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search UPI apps or banks..."
            className="bg-transparent border-none outline-none text-white w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      {/* Hide all app/bank lists below, only show search bar */}
    </div>
  )
} 