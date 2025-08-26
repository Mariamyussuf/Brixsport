import React from 'react';
import './globals.css';
import PWARegister from "@/components/shared/PWARegister";

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
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="application-name" content="BrixSports" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}