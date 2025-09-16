import React from 'react';
import { useRouter } from 'next/navigation';

interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface CompetitionsListProps {
  competitions: Competition[];
  onCompetitionClick?: (competition: Competition) => void;
}

const CompetitionsList: React.FC<CompetitionsListProps> = ({ 
  competitions,
  onCompetitionClick
}) => {
  const router = useRouter();

  const handleCompetitionClick = (competition: Competition) => {
    if (onCompetitionClick) {
      onCompetitionClick(competition);
    } else {
      // Default navigation to competition details page
      router.push(`/competitions/${competition.id}`);
    }
  };

  if (competitions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No competitions available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {competitions.map((competition) => (
        <div 
          key={competition.id}
          className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleCompetitionClick(competition)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {competition.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {competition.category}
              </p>
              <div className="flex items-center mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {competition.type}
                </span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {competition.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(competition.start_date).toLocaleDateString()} - {new Date(competition.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompetitionsList;