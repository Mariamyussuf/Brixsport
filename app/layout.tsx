import React from 'react';
import './globals.css';
import PWARegister from "@/components/shared/PWARegister";
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import OfflineWrapper from "@/components/shared/OfflineWrapper";
import SettingsLauncher from "@/components/shared/SettingsLauncher";
import { SettingsProvider } from "@/components/shared/SettingsContext";
import { I18nProvider } from "@/components/shared/I18nProvider";
import NotificationsGate from "@/components/shared/NotificationsGate";
import DataSaverGate from "@/components/shared/DataSaverGate";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: 'BrixSports',
  description: 'Sports analytics and tracking application for football events',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BrixSports',
  }
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
        <meta name="application-name" content="BrixSports" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <NoFlashThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <SettingsProvider>
            <I18nProvider>
              <PWARegister />
              <OfflineWrapper />
              <NotificationsGate />
              <DataSaverGate />
              {/* Global settings launcher (gear) */}
              <SettingsLauncher />
              {children}
            </I18nProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}