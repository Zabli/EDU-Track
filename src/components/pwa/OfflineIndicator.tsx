'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <aside aria-label="Connection Status" className="bg-emerald-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-sm animate-fade-in">
        <Wifi className="w-4 h-4" />
        <span>Connection restored. Live updates synchronized.</span>
      </aside>
    );
  }

  if (!isOffline) {
    return null;
  }

  return (
    <aside aria-label="Connection Warning" className="bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>You are currently offline. Viewing cached app shell. Sensitive changes require a live internet connection.</span>
    </aside>
  );
}
