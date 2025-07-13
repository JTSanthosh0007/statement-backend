'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { UPIApp, getAppsByCategory } from '../constants/upiApps';

export default function UPIAppsPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedApp, setSelectedApp] = useState('');

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('upiAppFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, appName: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(appName)) {
        newFavorites.delete(appName);
      } else {
        newFavorites.add(appName);
      }
      // Save to localStorage
      localStorage.setItem('upiAppFavorites', JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  };

  const handleAppClick = (app: UPIApp) => {
    if (app.available) {
      router.push(`/${app.id}`);
    } else {
      setSelectedApp(app.name);
      setShowComingSoon(true);
    }
  };

  const upiApps = getAppsByCategory('payment');

  const favoriteApps = upiApps.filter(app => favorites.has(app.name));

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => router.push('/')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">UPI Apps</h1>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-medium mb-2">{selectedApp}</h3>
            <p className="text-zinc-400 mb-4">Coming Soon! This feature is under development.</p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Favorites Section */}
      {favoriteApps.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-white font-medium mb-3">Favorites</h2>
          <div className="grid grid-cols-1 gap-4">
            {favoriteApps.map((app) => (
              <div 
                key={app.id}
                onClick={() => handleAppClick(app)}
                className="group bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/50 hover:bg-zinc-700/80 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center overflow-hidden">
                    <span className="text-white text-sm font-bold">
                      {app.shortName?.charAt(0) || app.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{app.name}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                  </div>
                  <button onClick={(e) => toggleFavorite(e, app.name)} className="text-zinc-400 hover:text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${favorites.has(app.name) ? 'text-yellow-400' : ''}`} fill={favorites.has(app.name) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Apps Section */}
      <div className="px-4">
        <h2 className="text-white font-medium mb-3">All UPI Apps</h2>
        <div className="grid grid-cols-1 gap-4">
          {upiApps.map((app) => (
            <div 
              key={app.id}
              onClick={() => handleAppClick(app)}
              className="group bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/50 hover:bg-zinc-700/80 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center overflow-hidden">
                   <span className="text-white text-sm font-bold">
                      {app.shortName?.charAt(0) || app.name.charAt(0)}
                    </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{app.name}</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                </div>
                <button onClick={(e) => toggleFavorite(e, app.name)} className="text-zinc-400 hover:text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${favorites.has(app.name) ? 'text-yellow-400' : ''}`} fill={favorites.has(app.name) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 