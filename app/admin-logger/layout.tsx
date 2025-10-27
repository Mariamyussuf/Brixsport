import React from 'react';
import '../../app/globals.css';

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
        {children}
      </body>
    </html>
  );
}