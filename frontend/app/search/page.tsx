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

      {/* Search Results */}
      <div className="space-y-6">
        {filteredApps.length === 0 ? (
          <div className="text-center text-zinc-400 py-8">
            <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p>No apps found matching "{searchQuery}"</p>
            <p className="text-sm text-zinc-500 mt-2">Try searching for: "SBI", "HDFC", "PhonePe", "Paytm", etc.</p>
          </div>
        ) : (
          <>
            {/* UPI Apps Section */}
            {groupedApps.upiApps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3 px-1">UPI Apps</h3>
                {groupedApps.upiApps.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-700"
                      >
                        <span className="text-white text-sm font-bold">
                          {app.shortName ? app.shortName.charAt(0) : app.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{app.name}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          app.available 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {app.available ? 'Available' : 'Coming Soon'}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 capitalize">
                          {app.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Public Sector Banks Section */}
            {groupedApps.publicBanks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3 px-1">Public Sector Banks</h3>
                {groupedApps.publicBanks.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-700"
                      >
                        <span className="text-white text-sm font-bold">
                          {app.shortName ? app.shortName.charAt(0) : app.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{app.name}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                        {app.bankCode && (
                          <p className="text-xs text-zinc-500 mt-1">Code: {app.bankCode}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          app.available 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {app.available ? 'Available' : 'Coming Soon'}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 capitalize">
                          {app.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Private Sector Banks Section */}
            {groupedApps.privateBanks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3 px-1">Private Sector Banks</h3>
                {groupedApps.privateBanks.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-700"
                      >
                        <span className="text-white text-sm font-bold">
                          {app.shortName ? app.shortName.charAt(0) : app.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{app.name}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                        {app.bankCode && (
                          <p className="text-xs text-zinc-500 mt-1">Code: {app.bankCode}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          app.available 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {app.available ? 'Available' : 'Coming Soon'}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 capitalize">
                          {app.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Banks Section */}
            {groupedApps.paymentBanks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3 px-1">Payment Banks</h3>
                {groupedApps.paymentBanks.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-700"
                      >
                        <span className="text-white text-sm font-bold">
                          {app.shortName ? app.shortName.charAt(0) : app.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{app.name}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                        {app.bankCode && (
                          <p className="text-xs text-zinc-500 mt-1">Code: {app.bankCode}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          app.available 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {app.available ? 'Available' : 'Coming Soon'}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 capitalize">
                          {app.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Small Finance Banks Section */}
            {groupedApps.smallFinanceBanks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3 px-1">Small Finance Banks</h3>
                {groupedApps.smallFinanceBanks.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-700"
                      >
                        <span className="text-white text-sm font-bold">
                          {app.shortName ? app.shortName.charAt(0) : app.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{app.name}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                        {app.bankCode && (
                          <p className="text-xs text-zinc-500 mt-1">Code: {app.bankCode}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          app.available 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {app.available ? 'Available' : 'Coming Soon'}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 capitalize">
                          {app.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Foreign Banks Section */}
            {groupedApps.foreignBanks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3 px-1">Foreign Banks</h3>
                {groupedApps.foreignBanks.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-700"
                      >
                        <span className="text-white text-sm font-bold">
                          {app.shortName ? app.shortName.charAt(0) : app.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{app.name}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                        {app.bankCode && (
                          <p className="text-xs text-zinc-500 mt-1">Code: {app.bankCode}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          app.available 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {app.available ? 'Available' : 'Coming Soon'}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 capitalize">
                          {app.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 