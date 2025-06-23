'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-4">
        {/* User Profile Section */}
        <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-xl uppercase">{user ? getUsername(user.email)[0] : 'U'}</span>
          </div>
          <div>
            <h2 className="text-white font-medium">{user ? getUsername(user.email) : 'User'}</h2>
            <p className="text-sm text-zinc-400">{user ? user.email : 'No email set'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-sm text-zinc-400">Name</label>
            <div className="w-full bg-zinc-900 rounded-xl p-4 mt-1">
              {user ? getUsername(user.email) : 'User'}
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Email</label>
            <div className="w-full bg-zinc-900 rounded-xl p-4 mt-1">
              {user ? user.email : 'Enter your email'}
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Phone Number</label>
            <div className="w-full bg-zinc-900 rounded-xl p-4 mt-1">
              {user?.phone ? user.phone : 'Enter your phone number'}
            </div>
          </div>
        </div>
        
        {/* Settings Options */}
        <button 
          onClick={() => router.push('/settings/account')}
          className="w-full bg-zinc-900 rounded-xl p-4 text-left hover:bg-zinc-800/80 transition-all duration-300"
        >
          Account Settings
        </button>

        <button 
          onClick={() => router.push('/settings/notifications')}
          className="w-full bg-zinc-900 rounded-xl p-4 text-left hover:bg-zinc-800/80 transition-all duration-300"
        >
          Notifications
        </button>

        <button 
          onClick={() => router.push('/settings/privacy')}
          className="w-full bg-zinc-900 rounded-xl p-4 text-left hover:bg-zinc-800/80 transition-all duration-300"
        >
          Privacy
        </button>

        <button 
          onClick={() => router.push('/settings/help')}
          className="w-full bg-zinc-900 rounded-xl p-4 text-left hover:bg-zinc-800/80 transition-all duration-300"
        >
          Help & Support
        </button>

        {/* Divider */}
        <div className="pt-4">
          <div className="border-t border-zinc-800"></div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full bg-zinc-900 rounded-xl p-4 text-center font-medium text-red-500 hover:bg-zinc-800/80 transition-all duration-300"
        >
          Log Out
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-zinc-800/50">
        <div className="flex justify-around p-4">
          <button 
            onClick={() => router.push('/')}
            className="text-zinc-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button 
            onClick={() => router.push('/search')}
            className="text-zinc-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button 
            className="text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  )
} 