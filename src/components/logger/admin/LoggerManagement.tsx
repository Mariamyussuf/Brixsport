import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

const LoggerManagement = () => {
  const { loggers, loading, error, clearError, createLogger, updateLogger, deleteLogger, suspendLogger, activateLogger } = useAdmin();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLogger, setEditingLogger] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'logger'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLogger({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: 'active',
      assignedCompetitions: []
    });
    setFormData({ name: '', email: '', role: 'logger' });
    setShowCreateForm(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLogger) {
      await updateLogger(editingLogger.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role
      });
      setEditingLogger(null);
      setFormData({ name: '', email: '', role: 'logger' });
    }
  };

  const handleDelete = async (loggerId: string) => {
    if (window.confirm('Are you sure you want to delete this logger?')) {
      await deleteLogger(loggerId);
    }
  };

  const handleSuspend = async (loggerId: string) => {
    if (window.confirm('Are you sure you want to suspend this logger?')) {
      await suspendLogger(loggerId);
    }
  };

  const handleActivate = async (loggerId: string) => {
    await activateLogger(loggerId);
  };

  const startEditing = (logger: any) => {
    setEditingLogger(logger);
    setFormData({
      name: logger.name,
      email: logger.email,
      role: logger.role
    });
  };

  const cancelEditing = () => {
    setEditingLogger(null);
    setFormData({ name: '', email: '', role: 'logger' });
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {logger.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    logger.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : logger.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {logger.status.charAt(0).toUpperCase() + logger.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => startEditing(logger)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    Edit
                  </button>
                  {logger.status === 'active' ? (
                    <button 
                      onClick={() => handleSuspend(logger.id)}
                      className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 mr-3"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleActivate(logger.id)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                    >
                      Activate
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(logger.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading.loggers && (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )}

      {loggers.length === 0 && !loading.loggers && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No loggers</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding a new logger.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoggerManagement;