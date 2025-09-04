"use client";

import React from 'react';
import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to dashboard since this is handled by layout.tsx
  redirect('/admin/dashboard');
}