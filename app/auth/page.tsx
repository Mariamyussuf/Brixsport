import React from 'react';
import { AuthScreen } from '@/screens/AuthScreen';

export default function AuthPage({ searchParams }: { searchParams: { tab?: 'login' | 'signup' } }) {
  const tab = searchParams?.tab === 'login' ? 'login' : 'signup';
  return <AuthScreen initialTab={tab} />;
}
