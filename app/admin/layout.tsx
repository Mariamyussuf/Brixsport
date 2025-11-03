import React from 'react';
import '../globals.css';
import AdminPWARegister from '@/components/shared/AdminPWARegister';
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AdminProvider } from "@/contexts/AdminContext";
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/adminAuth';
import type { AdminUser } from '@/lib/adminAuth';
import Header from "@/components/shared/glassmorphic/Header";
import BottomNav from "@/components/shared/glassmorphic/BottomNav";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: process.env.NEXT_PUBLIC_ADMIN_APP_NAME || 'BrixSports Admin',
  description: process.env.NEXT_PUBLIC_ADMIN_APP_DESCRIPTION || 'Administrative platform for managing sports events and loggers',
  manifest: '/admin-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: process.env.NEXT_PUBLIC_ADMIN_APP_NAME || 'BrixSports Admin',
  }
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For all admin pages, perform authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  let user: AdminUser | null = null;

  // Always render the layout with AdminProvider
  // Authentication checks will happen in client components
  if (token) {
    try {
      user = await verifyAdminToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      // If token verification fails, user remains null
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <NoFlashThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <AdminProvider currentAdmin={user}>
            <AdminPWARegister />
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow pb-[80px] pt-[70px]">
                {children}
              </main>
              <BottomNav />
            </div>
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}