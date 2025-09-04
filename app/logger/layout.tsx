import React from 'react';
import '../globals.css';
import LoggerPWARegister from "../../components/shared/LoggerPWARegister";
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import OfflineWrapper from "@/components/shared/OfflineWrapper";
import { SettingsProvider } from "@/components/shared/SettingsContext";
import { I18nProvider } from "@/components/shared/I18nProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/components/shared/NotificationsContext";
import NotificationsGate from "@/components/shared/NotificationsGate";
import DataSaverGate from "@/components/shared/DataSaverGate";
import { LoggerProvider } from "@/contexts/LoggerContext";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: 'BrixSports Logger',
  description: 'Match logging platform for sports events',
  manifest: '/logger-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BrixSports Logger',
  }
};

export default function LoggerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/logger-manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="application-name" content="BrixSports Logger" />
        
        {/* iOS PWA meta tags - enhanced for better iOS support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BrixSports Logger" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/logger-apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logger-apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logger-apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/logger-apple-touch-icon-167x167.png" />
        
        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/logger-splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/logger-splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/logger-splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/logger-splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/logger-splash-1536x2048.png" media="(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2)" />
        <NoFlashThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <SettingsProvider>
            <I18nProvider>
              <AuthProvider>
                <LoggerProvider>
                  <NotificationsProvider>
                    <LoggerPWARegister />
                    <OfflineWrapper />
                    <NotificationsGate />
                    <DataSaverGate />
                    {children}
                  </NotificationsProvider>
                </LoggerProvider>
              </AuthProvider>
            </I18nProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}