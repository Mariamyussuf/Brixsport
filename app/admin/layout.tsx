import React from 'react';
import '../globals.css';
import NoFlashThemeScript from "@/components/shared/NoFlashThemeScript";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AdminProvider } from "@/contexts/AdminContext";
import { cookies } from 'next/headers';
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
  // For all admin pages, perform authentication
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
    <ThemeProvider>
      <AdminProvider currentAdmin={user}>
        {children}
      </AdminProvider>
    </ThemeProvider>
  );
}