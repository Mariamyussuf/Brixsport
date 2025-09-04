// Test Layout for Logger Notifications

import React from 'react';
import LoggerPWARegister from "@/components/shared/LoggerPWARegister";
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

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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