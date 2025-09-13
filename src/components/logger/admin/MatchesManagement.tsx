import React, { useState, useEffect } from 'react';
import { loggerService, LoggerMatch, MatchEvent, LoggerCompetition } from '@/lib/loggerService';
import { getCompetitions } from '@/lib/competitionService';

interface MatchData extends LoggerMatch {
  competitionName?: string;
  loggerName?: string;
}

const MatchesManagement = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [competitions, setCompetitions] = useState<LoggerCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    competitionId: '',
    homeTeamId: '',
    awayTeamId: '',
    startTime: '',
    venue: '',
    loggerId: ''
  });

  // Fetch matches and competitions from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // First fetch competitions
        const competitionsResponse = await loggerService.getCompetitions();
        if (competitionsResponse.success && competitionsResponse.data) {
          setCompetitions(competitionsResponse.data);
        }
        
        // If we have competitions, fetch matches for the first one
        if (competitionsResponse.success && competitionsResponse.data && competitionsResponse.data.length > 0) {
          const response = await loggerService.getMatches(competitionsResponse.data[0].id);
          if (response.success && response.data) {
            setMatches(response.data as MatchData[]);
          } else {
            throw new Error(response.error || 'Failed to load matches');
          }
        } else {
          setMatches([]);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Scheduled</span>;
      case 'live':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Live</span>;
      case 'half-time':
        return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Half Time</span>;
      case 'full-time':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Full Time</span>;
      case 'postponed':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Postponed</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const handleCreateMatch = () => {
    setShowCreateForm(true);
  };

  const handleViewDetails = (match: MatchData) => {
    setSelectedMatch(match);
  };

  const handleCloseDetails = () => {
    setSelectedMatch(null);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, you would submit the form data to create a match
    console.log('Creating match with data:', formData);
    setShowCreateForm(false);
    // Reset form
    setFormData({
      competitionId: '',
      homeTeamId: '',
      awayTeamId: '',
      startTime: '',
      venue: '',
      loggerId: ''
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="ml-2 text-lg font-medium text-red-800">Error</h3>
        </div>
        <div className="mt-2 text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Matches Management</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Manage all sports matches in the system
            </p>
          </div>
          <button
            onClick={handleCreateMatch}
            className="mt-4 md:mt-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Match
          </button>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No matches</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new match.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateMatch}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Match
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Match
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Competition
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Logger
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {match.homeTeamId} vs {match.awayTeamId}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(match.startTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {competitions.find(c => c.id === match.competitionId)?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{match.loggerName || 'N/A'}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ID: {match.loggerId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(match.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(match.lastUpdated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(match)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Match Details
                </h3>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Match Information</h4>
                  <dl className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Home Team</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{selectedMatch.homeTeamId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Away Team</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{selectedMatch.awayTeamId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{formatDate(selectedMatch.startTime)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{getStatusBadge(selectedMatch.status)}</dd>
                    </div>
                    {selectedMatch.homeScore !== undefined && (
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Score</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {selectedMatch.homeScore} - {selectedMatch.awayScore}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Assignment</h4>
                  <dl className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Competition</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {competitions.find(c => c.id === selectedMatch.competitionId)?.name || 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Logger</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{selectedMatch.loggerName || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Logger ID</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{selectedMatch.loggerId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                      <dd className="text-sm text-gray-900 dark:text-white">{formatDate(selectedMatch.lastUpdated)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {selectedMatch.events.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Events</h4>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedMatch.events.map((event) => (
                        <li key={event.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{event.description}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {event.type} • {event.teamId} • Minute {event.minute}
                              </p>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
                  Edit Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Match Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Create New Match
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Competition
                    </label>
                    <select
                      name="competitionId"
                      value={formData.competitionId}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Competition</option>
                      {competitions.map(competition => (
                        <option key={competition.id} value={competition.id}>
                          {competition.name} ({competition.sport})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Home Team
                      </label>
                      <input
                        type="text"
                        name="homeTeamId"
                        value={formData.homeTeamId}
                        onChange={handleFormChange}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Home Team"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Away Team
                      </label>
                      <input
                        type="text"
                        name="awayTeamId"
                        value={formData.awayTeamId}
                        onChange={handleFormChange}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Away Team"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Venue
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Venue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assign Logger
                    </label>
                    <select
                      name="loggerId"
                      value={formData.loggerId}
                      onChange={handleFormChange}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Logger</option>
                      <option value="logger-1">John Smith</option>
                      <option value="logger-2">Sarah Johnson</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                  >
                    Create Match
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesManagement;