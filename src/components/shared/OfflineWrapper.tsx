'use client';

import dynamic from 'next/dynamic';

const OfflineStatusIndicator = dynamic(
  () => import('./OfflineStatusIndicator'),
  { ssr: false }
);

export default function OfflineWrapper() {
  return <OfflineStatusIndicator />;
}
