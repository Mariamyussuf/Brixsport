import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Logger } from '@/lib/adminService';

const LoggerManagement = () => {
  const { loggers, loading, error, clearError, createLogger, updateLogger, deleteLogger, suspendLogger, activateLogger } = useAdmin();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLogger, setEditingLogger] = useState<Logger | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'logger'
  });

  // Get logger statuses from environment variables
  const loggerStatuses = process.env.NEXT_PUBLIC_LOGGER_STATUSES?.split(',') || ['active', 'inactive', 'suspended'];

  // Create a map of status labels
  const statusLabels: Record<string, string> = {};
  loggerStatuses.forEach(status => {
    statusLabels[status] = status.charAt(0).toUpperCase() + status.slice(1);
  });

  // Get status colors from environment variables
  const statusColors: Record<string, string> = {};
  loggerStatuses.forEach(status => {
    switch(status) {
      case 'active':
        statusColors[status] = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        break;
      case 'inactive':
        statusColors[status] = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        break;
      case 'suspended':
        statusColors[status] = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        break;
      default:
        statusColors[status] = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  });

  // Handle form submission for creating a logger
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      await createLogger({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: 'active',
        assignedCompetitions: []
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'logger'
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create logger:', err);
    }
  };

  // Handle form submission for updating a logger
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!editingLogger) return;
    
    try {
      await updateLogger(editingLogger.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role
      });
      
      // Reset form and editing state
      setFormData({
        name: '',
        email: '',
        role: 'logger'
      });
      setEditingLogger(null);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to update logger:', err);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingLogger(null);
    setFormData({
      name: '',
      email: '',
      role: 'logger'
    });
    setShowCreateForm(false);
  };

  // Start editing a logger
  const startEditing = (logger: Logger) => {
    setEditingLogger(logger);
    setFormData({
      name: logger.name,
      email: logger.email,
      role: logger.role
    });
    setShowCreateForm(true);
  };

  // Handle suspending a logger
  const handleSuspend = async (id: string) => {
    if (window.confirm('Are you sure you want to suspend this logger?')) {
      try {
        await suspendLogger(id);
      } catch (err) {
        console.error('Failed to suspend logger:', err);
      }
    }
  };

  // Handle activating a logger
  const handleActivate = async (id: string) => {
    try {
      await activateLogger(id);
    } catch (err) {
      console.error('Failed to activate logger:', err);
    }
  };

  // Handle deleting a logger
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this logger? This action cannot be undone.')) {
      try {
        await deleteLogger(id);
      } catch (err) {
        console.error('Failed to delete logger:', err);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Logger Management</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
        >
          {showCreateForm ? 'Cancel' : 'Add New Logger'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            {editingLogger ? 'Edit Logger' : 'Create New Logger'}
          </h3>
          <form onSubmit={editingLogger ? handleUpdate : handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="logger">Logger</option>
                  <option value="senior-logger">Senior Logger</option>
                  <option value="logger-admin">Logger Admin</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                {editingLogger ? 'Update Logger' : 'Create Logger'}
              </button>
              {editingLogger && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Logger
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loggers.map((logger) => (
              <tr key={logger.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{logger.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {logger.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {logger.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[logger.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
                    {statusLabels[logger.status] || logger.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(logger)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    {logger.status === 'active' ? (
                      <button
                        onClick={() => handleSuspend(logger.id)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(logger.id)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(logger.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading.loggers && (
        <div className="flex justify-center py-6">
          <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {!loading.loggers && loggers.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No loggers</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new logger.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoggerManagement;