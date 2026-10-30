'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[EduTrack PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[EduTrack PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
