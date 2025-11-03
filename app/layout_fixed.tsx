import React from 'react';
import './globals.css';
import PWARegister from "@/components/shared/PWARegister";
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import OfflineWrapper from "@/components/shared/OfflineWrapper";
import { SettingsProvider } from "@/components/shared/SettingsContext";
import { I18nProvider } from "@/components/shared/I18nProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/components/shared/NotificationsContext";
import NotificationsGate from "@/components/shared/NotificationsGate";
import DataSaverGate from "@/components/shared/DataSaverGate";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import MonitoringInitializer from "@/components/shared/MonitoringInitializer";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/shared/glassmorphic/Header";
import BottomNav from "@/components/shared/glassmorphic/BottomNav";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: 'Brixsport - Live Sports Scores for Nigerian Universities',
  description: 'Get real-time live scores, updates, and results for university sports across Nigeria. Follow football, basketball, and tournaments from universities nationwide.',
  keywords: 'Nigerian university sports, university football scores, university basketball scores, live sports Nigeria, Nigerian university tournaments, Brixsport, university sports updates',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Brixsport',
  },
  openGraph: {
    title: 'Brixsport - Live Sports Scores for Nigerian Universities',
    description: 'Real-time live scores and updates for university sports across Nigeria. Follow football, basketball, and tournaments from universities nationwide.',
    type: 'website',
    url: 'https://brixsport.com',
    siteName: 'Brixsport',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brixsport - Live Sports Scores for Nigerian Universities',
    description: 'Real-time live scores and updates for university sports across Nigeria. Follow football, basketball, and tournaments from universities nationwide.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="application-name" content="Brixsport" />
        <meta name="keywords" content="Nigerian university sports, university football scores, university basketball scores, live sports Nigeria, Nigerian university tournaments, Brixsport, university sports updates" />
        
        {/* iOS PWA meta tags - enhanced for better iOS support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Brixsport" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png" />
        
        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1536x2048.png" media="(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2)" />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            "name": "Brixsport",
            "operatingSystem": "Android, iOS",
            "applicationCategory": "SportsApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "NGN"
            },
            "description": "Get real-time live scores, updates, and results for university sports across Nigeria. Follow football, basketball, and tournaments from universities nationwide."
          })
        }} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": "University of Lagos vs University of Ibadan Football Match",
            "startDate": "2025-09-20T15:00:00+01:00",
            "endDate": "2025-09-20T17:00:00+01:00",
            "location": {
              "@type": "Place",
              "name": "University of Lagos Stadium"
            },
            "homeTeam": {
              "@type": "SportsTeam",
              "name": "University of Lagos"
            },
            "awayTeam": {
              "@type": "SportsTeam",
              "name": "University of Ibadan"
            },
            "sport": "Football"
          })
        }} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is Brixsport?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Brixsport is a dedicated platform for live sports scores and updates from Nigerian universities. We cover football, basketball, and various tournaments happening across university campuses in Nigeria."
                }
              },
              {
                "@type": "Question",
                "name": "How can I get live scores for university sports?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can access real-time scores through our website or mobile app. Simply visit brixsport.com or download our free app on Android or iOS devices to follow your favorite university teams."
                }
              },
              {
                "@type": "Question",
                "name": "Which Nigerian universities are covered?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We cover major universities across Nigeria including University of Lagos, University of Ibadan, Obafemi Awolowo University, University of Nigeria, Nsukka, and many more participating in various sports competitions."
                }
              }
            ]
          })
        }} />
        
        <NoFlashThemeScript />
      </head>
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <SettingsProvider>
              <I18nProvider>
                <AuthProvider>
                  <NotificationsProvider>
                    <MonitoringInitializer />
                    <PWARegister />
                    <OfflineWrapper />
                    <NotificationsGate />
                    <DataSaverGate />
                    <Toaster />
                    <div className="min-h-screen flex flex-col">
                      <Header />
                      <main className="flex-grow pb-[80px] pt-[70px]">
                        {children}
                      </main>
                      <BottomNav />
                    </div>
                  </NotificationsProvider>
                </AuthProvider>
              </I18nProvider>
            </SettingsProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}