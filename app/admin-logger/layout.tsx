import React from 'react';
import '../../app/globals.css';
import Header from "@/components/shared/glassmorphic/Header";
import BottomNav from "@/components/shared/glassmorphic/BottomNav";

export const metadata = {
  title: 'BrixSports Admin/Logger Platform',
  description: 'Administrative and logging platform for BrixSports',
};

export default function AdminLoggerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow pb-[80px] pt-[70px]">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}