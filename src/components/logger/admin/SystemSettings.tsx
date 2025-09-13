import React, { useState, useEffect } from 'react';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  fields: SettingField[];
}

interface SettingField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  value: string | number | boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  description?: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SettingSection[]>([
    {
      id: 'general',
      title: 'General Settings',
      description: 'Configure basic system preferences',
      fields: [
        {
          id: 'site-name',
          label: 'Site Name',
          type: 'text',
          value: 'Brixsports Live',
          placeholder: 'Enter site name'
        },
        {
          id: 'timezone',
          label: 'Timezone',
          type: 'select',
          value: 'UTC',
          options: [
            { label: 'UTC', value: 'UTC' },
            { label: 'GMT', value: 'GMT' },
            { label: 'EST', value: 'EST' },
            { label: 'PST', value: 'PST' },
            { label: 'CET', value: 'CET' }
          ]
        },
        {
          id: 'language',
          label: 'Default Language',
          type: 'select',
          value: 'en',
          options: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' }
          ]
        }
      ]
    },
    {
      id: 'logging',
      title: 'Logging Configuration',
      description: 'Manage event logging parameters',
      fields: [
        {
          id: 'auto-save',
          label: 'Auto-save interval (minutes)',
          type: 'number',
          value: 5,
          description: 'How often to automatically save logger data'
        },
        {
          id: 'max-events',
          label: 'Max events per match',
          type: 'number',
          value: 200,
          description: 'Maximum number of events allowed per match'
        },
        {
          id: 'require-confirmation',
          label: 'Require confirmation for critical events',
          type: 'checkbox',
          value: true,
          description: 'Ask for confirmation before logging goals, red cards, etc.'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Configure system notifications',
      fields: [
        {
          id: 'email-notifications',
          label: 'Enable email notifications',
          type: 'checkbox',
          value: true
        },
        {
          id: 'slack-notifications',
          label: 'Enable Slack notifications',
          type: 'checkbox',
          value: false
        },
        {
          id: 'notification-email',
          label: 'Notification email address',
          type: 'text',
          value: process.env.NEXT_PUBLIC_ADMIN_DEFAULT_EMAIL || 'admin@brixsports.com',
          placeholder: 'Enter email address'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Manage system security parameters',
      fields: [
        {
          id: 'session-timeout',
          label: 'Session timeout (minutes)',
          type: 'number',
          value: 30,
          description: 'How long until inactive sessions expire'
        },
        {
          id: 'max-login-attempts',
          label: 'Max login attempts',
          type: 'number',
          value: 5,
          description: 'Maximum failed login attempts before lockout'
        },
        {
          id: 'two-factor-auth',
          label: 'Require two-factor authentication',
          type: 'checkbox',
          value: true
        }
      ]
    }
  ]);

  const [activeSection, setActiveSection] = useState('general');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll use the environment variables
    const timezoneOptions = process.env.NEXT_PUBLIC_TIMEZONES?.split(',') || ['UTC', 'GMT', 'EST', 'PST', 'CET'];
    const languageOptions = process.env.NEXT_PUBLIC_LANGUAGES?.split(',') || ['en', 'es', 'fr', 'de'];
    
    setSettings(prev => prev.map(section => {
      if (section.id === 'general') {
        return {
          ...section,
          fields: section.fields.map(field => {
            if (field.id === 'timezone') {
              return {
                ...field,
                options: timezoneOptions.map(tz => ({ label: tz, value: tz })),
                value: timezoneOptions[0] || 'UTC'
              };
            }
            if (field.id === 'language') {
              return {
                ...field,
                options: languageOptions.map(lang => ({
                  label: lang.toUpperCase(),
                  value: lang
                })),
                value: languageOptions[0] || 'en'
              };
            }
            return field;
          })
        };
      }
      return section;
    }));
  }, []);

  const handleFieldChange = (sectionId: string, fieldId: string, value: string | number | boolean) => {
    setSettings(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.map(field => 
            field.id === fieldId ? { ...field, value } : field
          )
        };
      }
      return section;
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving settings:', settings);
    setSuccessMessage('Settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      // In a real app, this would reset to actual default values
      setSuccessMessage('Settings reset to defaults!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const currentSection = settings.find(s => s.id === activeSection);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">System Settings</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Configure system-wide preferences and parameters
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-1">
            {settings.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                  activeSection === section.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {successMessage && (
            <div className="mb-6 p-4 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentSection && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {currentSection.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {currentSection.description}
                </p>
              </div>

              <div className="space-y-6">
                {currentSection.fields.map((field) => (
                  <div key={field.id}>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {field.label}
                      </label>
                      {field.type === 'checkbox' && (
                        <button
                          onClick={() => handleFieldChange(activeSection, field.id, !field.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            field.value 
                              ? 'bg-red-600' 
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              field.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    
                    {field.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {field.description}
                      </p>
                    )}

                    {field.type === 'text' && (
                      <div className="mt-1">
                        <input
                          type="text"
                          value={field.value as string}
                          onChange={(e) => handleFieldChange(activeSection, field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full max-w-md rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    )}

                    {field.type === 'number' && (
                      <div className="mt-1">
                        <input
                          type="number"
                          value={field.value as number}
                          onChange={(e) => handleFieldChange(activeSection, field.id, Number(e.target.value))}
                          className="w-full max-w-md rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    )}

                    {field.type === 'select' && field.options && (
                      <div className="mt-1">
                        <select
                          value={field.value as string}
                          onChange={(e) => handleFieldChange(activeSection, field.id, e.target.value)}
                          className="w-full max-w-md rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {field.type === 'textarea' && (
                      <div className="mt-1">
                        <textarea
                          value={field.value as string}
                          onChange={(e) => handleFieldChange(activeSection, field.id, e.target.value)}
                          rows={4}
                          className="w-full max-w-md rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </p>
          <button
            onClick={handleSave}
            className="mt-2 md:mt-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition duration-200"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;