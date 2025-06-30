'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../supabase.js'

export default function AccountSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const getUsername = (email: string) => {
    if (!email) return 'User'
    return email.split('@')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">Account Settings</h1>
      </header>

      {/* Account Info Content */}
      <div className="p-4 space-y-6">
        {/* User Profile Section */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-2xl uppercase">{user ? getUsername(user.email)[0] : 'U'}</span>
          </div>
          <div>
            <h2 className="text-white font-medium text-xl">{user ? getUsername(user.email) : 'User'}</h2>
            <p className="text-sm text-zinc-400">{user ? user.email : 'No email set'}</p>
          </div>
        </div>

        {/* User Details Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400">Name</label>
            <div className="w-full bg-zinc-900 rounded-xl p-4 mt-1 text-white">
              {user ? getUsername(user.email) : 'User'}
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Email</label>
            <div className="w-full bg-zinc-900 rounded-xl p-4 mt-1 text-white">
              {user ? user.email : 'Enter your email'}
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Phone Number</label>
            <div className="w-full bg-zinc-900 rounded-xl p-4 mt-1 text-white">
              {user?.phone ? user.phone : 'Enter your phone number'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 