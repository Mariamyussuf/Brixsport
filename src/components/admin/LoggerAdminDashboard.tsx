import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Logger } from '@/lib/adminService';

const LoggerAdminDashboard = () => {
  const {
    loggers,
    competitions,
    matches,
    loading,
    error,
    loadLoggers,
    loadLoggerCompetitions,
    loadLoggerMatches,
    createLogger,
    updateLogger,
    deleteLogger,
    suspendLogger,
    activateLogger,
    createLoggerMatch,
    updateLoggerMatch,
    addLoggerEvent,
    selectLogger
  } = useAdmin();

  const [showCreateLoggerForm, setShowCreateLoggerForm] = useState(false);
  const [showCreateMatchForm, setShowCreateMatchForm] = useState(false);
  const [selectedLogger, setSelectedLogger] = useState<Logger | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'logger',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    assignedCompetitions: [] as string[]
  });

  useEffect(() => {
    loadLoggers();
    loadLoggerCompetitions();
    loadLoggerMatches();
  }, []);

  const handleCreateLogger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLogger({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        assignedCompetitions: formData.assignedCompetitions
      });
      setShowCreateLoggerForm(false);
      setFormData({
        name: '',
        email: '',
        role: 'logger',
        status: 'active',
        assignedCompetitions: []
      });
    } catch (err) {
      console.error('Failed to create logger:', err);
    }
  };

  const handleUpdateLogger = async (loggerId: string, updates: Partial<Logger>) => {
    try {
      await updateLogger(loggerId, updates);
    } catch (err) {
      console.error('Failed to update logger:', err);
    }
  };

  const handleDeleteLogger = async (loggerId: string) => {
    if (window.confirm('Are you sure you want to delete this logger?')) {
      try {
        await deleteLogger(loggerId);
      } catch (err) {
        console.error('Failed to delete logger:', err);
      }
    }
  };

  const handleSuspendLogger = async (loggerId: string) => {
    try {
      await suspendLogger(loggerId);
    } catch (err) {
      console.error('Failed to suspend logger:', err);
    }
  };

  const handleActivateLogger = async (loggerId: string) => {
    try {
      await activateLogger(loggerId);
    } catch (err) {
      console.error('Failed to activate logger:', err);
    }
  };

  if (loading.loggers) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard with Logger Capabilities</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Logger Management Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Logger Management</h2>
          <button
            onClick={() => setShowCreateLoggerForm(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Logger
          </button>
        </div>

        {showCreateLoggerForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New Logger</h3>
            <form onSubmit={handleCreateLogger}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="logger">Logger</option>
                    <option value="senior-logger">Senior Logger</option>
                    <option value="logger-admin">Logger Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLoggerForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create Logger
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loggers.map((logger) => (
                <tr key={logger.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{logger.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{logger.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{logger.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      logger.status === 'active' ? 'bg-green-100 text-green-800' :
                      logger.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {logger.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleSuspendLogger(logger.id)}
                      disabled={logger.status === 'suspended'}
                      className="text-red-600 hover:text-red-900 mr-3 disabled:opacity-50"
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => handleActivateLogger(logger.id)}
                      disabled={logger.status === 'active'}
                      className="text-green-600 hover:text-green-900 mr-3 disabled:opacity-50"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleUpdateLogger(logger.id, { role: 'senior-logger' })}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Make Senior
                    </button>
                    <button
                      onClick={() => handleDeleteLogger(logger.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competition Management Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Competitions</h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Loggers</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competitions.map((competition) => (
                <tr key={competition.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{competition.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{competition.sport}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      competition.status === 'active' ? 'bg-green-100 text-green-800' :
                      competition.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {competition.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {competition.assignedLoggers.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Management Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Matches</h2>
          <button
            onClick={() => setShowCreateMatchForm(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Match
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matches.map((match) => (
                <tr key={match.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Competition name would need to be looked up from competitions */}
                    Match #{match.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Teams would need to be looked up from teams data */}
                    Home vs Away
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      match.status === 'live' ? 'bg-green-100 text-green-800' :
                      match.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {match.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {match.startTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      Edit
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Log Events
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoggerAdminDashboard;