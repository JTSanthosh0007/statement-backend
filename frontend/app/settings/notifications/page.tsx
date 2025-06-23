'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState({
    pushNotifications: true
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

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
        <h1 className="text-xl font-semibold">Notifications</h1>
      </div>

      {/* Notifications Content */}
      <div className="p-4 space-y-6">
        {/* General Notifications */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">General</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-4">
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-zinc-400">Receive push notifications on your device</p>
              </div>
              <button 
                onClick={() => toggleNotification('pushNotifications')}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                  notifications.pushNotifications ? 'bg-blue-600' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${
                  notifications.pushNotifications ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 