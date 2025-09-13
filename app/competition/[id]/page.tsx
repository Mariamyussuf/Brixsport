'use client';

import React from 'react';
import CompetitionDetailsScreen from '@/components/CompetitionDetailsScreen';
import { useI18n } from '@/components/shared/I18nProvider';

// Use a permissive prop type to satisfy Next's generated PageProps validator.
// We'll handle both sync and Promise-like `params` at runtime.
interface CompetitionDetailsPageProps {
  params: any;
}

const CompetitionDetailsPage: React.FC<CompetitionDetailsPageProps> = ({ params }) => {
  const { t } = useI18n();
  const [id, setId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resolved = await params;
        if (mounted) setId(resolved?.id ?? null);
      } catch {
        // If awaiting fails, try direct extraction
        const maybe = params as any;
        if (mounted) setId(maybe?.id ?? null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CompetitionDetailsScreen competitionId={id} />
    </div>
  );
};

export default CompetitionDetailsPage;