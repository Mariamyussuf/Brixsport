import React from 'react';
import '../globals.css';
import LoggerPWARegister from "../../components/shared/LoggerPWARegister";
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import OfflineWrapper from "@/components/shared/OfflineWrapper";
import { SettingsProvider } from "@/components/shared/SettingsContext";
import { I18nProvider } from "@/components/shared/I18nProvider";
import { NotificationsProvider } from "@/components/shared/NotificationsContext";
import NotificationsGate from "@/components/shared/NotificationsGate";
import DataSaverGate from "@/components/shared/DataSaverGate";
import { LoggerProvider } from "@/contexts/LoggerContext";

// Client-only LoggerProvider wrapper
const ClientLoggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Only render LoggerProvider on the client side
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return <LoggerProvider>{children}</LoggerProvider>;
};

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
    <ThemeProvider>
      <SettingsProvider>
        <I18nProvider>
          {/* Removed the duplicate AuthProvider here since it's provided by the root layout */}
          <ClientLoggerProvider>
            <NotificationsProvider>
              <LoggerPWARegister />
              <OfflineWrapper />
              <NotificationsGate />
              <DataSaverGate />
              {children}
            </NotificationsProvider>
          </ClientLoggerProvider>
        </I18nProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}