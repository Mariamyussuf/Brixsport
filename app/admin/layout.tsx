import React from 'react';
import '../globals.css';
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AdminProvider } from "@/contexts/AdminContext";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: 'BrixSports Admin',
  description: 'Administrative platform for managing sports events and loggers',
  manifest: '/admin-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BrixSports Admin',
  }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="application-name" content="BrixSports Admin" />
        
        {/* iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BrixSports Admin" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
        <NoFlashThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}