import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EduTrack — Academy & Coaching Management Platform',
  description: 'Multi-academy education management platform for Pakistan. Attendance, Tests, Fees, and Portals.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#533afd',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EduTrack" />
      </head>
      <body className="min-h-screen bg-white text-stripe-ink font-sans flex flex-col antialiased selection:bg-stripe-primary selection:text-white">
        <OfflineIndicator />
        <PWAInstallPrompt />
        <ServiceWorkerRegister />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
