import React from 'react';
import '../globals.css';
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AdminProvider } from "@/contexts/AdminContext";
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/adminAuth';

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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('next-url') || '';

  // If we are on the login page, render the children directly without auth checks
  if (pathname === '/admin/login') {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <NoFlashThemeScript />
            </head>
            <body>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
  }

  // For all other admin pages, perform authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  const user = await verifyAdminToken(token);
  if (!user) {
    redirect('/admin/login');
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="application-name" content="BrixSports Admin" />
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
          <AdminProvider currentAdmin={user}>
            {children}
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}