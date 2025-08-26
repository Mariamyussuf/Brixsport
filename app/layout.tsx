import React from 'react';
import './globals.css';
import PWARegister from "@/components/shared/PWARegister";
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const metadata = {
  title: 'BrixSports',
  description: 'Sports analytics and tracking application for football events',
  manifest: '/manifest.json',
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
        <NoFlashThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <PWARegister />
          {/* Floating theme toggle */}
          <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000 }}>
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}