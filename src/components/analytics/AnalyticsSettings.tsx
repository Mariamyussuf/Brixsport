'use client';

import React, { useState, useEffect } from 'react';

interface AnalyticsSettingsProps {
  className?: string;
}

const AnalyticsSettings: React.FC<AnalyticsSettingsProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState({
    // Data Collection
    enableUserTracking: true,
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableBusinessMetrics: true,

    // Privacy Settings
    anonymizeUserData: false,
    dataRetentionDays: 365,
    allowThirdPartyAnalytics: false,

    // Alerts & Notifications
    emailAlerts: true,
    performanceThreshold: 80,
    errorRateThreshold: 5,
    userGrowthAlert: true,

    // Reporting
    autoGenerateReports: true,
    reportFrequency: 'weekly',
    includeCharts: true,
    exportFormats: ['pdf', 'xlsx'],

    // Advanced
    samplingRate: 100,
    cacheEnabled: true,
    realTimeUpdates: true,
    debugMode: false
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Settings saved:', settings);
      // Show success message
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setSettings({
      enableUserTracking: true,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableBusinessMetrics: true,
      anonymizeUserData: false,
      dataRetentionDays: 365,
      allowThirdPartyAnalytics: false,
      emailAlerts: true,
      performanceThreshold: 80,
      errorRateThreshold: 5,
      userGrowthAlert: true,
      autoGenerateReports: true,
      reportFrequency: 'weekly',
      includeCharts: true,
      exportFormats: ['pdf', 'xlsx'],
      samplingRate: 100,
      cacheEnabled: true,
      realTimeUpdates: true,
      debugMode: false
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'reporting', label: 'Reporting', icon: '📊' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Settings</h2>
          <p className="text-gray-400 mt-1">Configure analytics tracking and reporting preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetToDefaults}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="border-b border-gray-700">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Data Collection</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">User Tracking</h4>
                      <p className="text-xs text-gray-400">Track user behavior and engagement metrics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableUserTracking}
                        onChange={(e) => setSettings(prev => ({ ...prev, enableUserTracking: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Performance Tracking</h4>
                      <p className="text-xs text-gray-400">Monitor system performance and response times</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enablePerformanceTracking}
                        onChange={(e) => setSettings(prev => ({ ...prev, enablePerformanceTracking: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Error Tracking</h4>
                      <p className="text-xs text-gray-400">Capture and analyze application errors</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableErrorTracking}
                        onChange={(e) => setSettings(prev => ({ ...prev, enableErrorTracking: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Business Metrics</h4>
                      <p className="text-xs text-gray-400">Track revenue and business performance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableBusinessMetrics}
                        onChange={(e) => setSettings(prev => ({ ...prev, enableBusinessMetrics: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Privacy & Data Protection</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Anonymize User Data</h4>
                      <p className="text-xs text-gray-400">Remove personally identifiable information from analytics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.anonymizeUserData}
                        onChange={(e) => setSettings(prev => ({ ...prev, anonymizeUserData: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-white mb-2">Data Retention Period</label>
                    <select
                      value={settings.dataRetentionDays}
                      onChange={(e) => setSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={180}>180 days</option>
                      <option value={365}>1 year</option>
                      <option value={730}>2 years</option>
                      <option value={1095}>3 years</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">How long to retain analytics data before automatic deletion</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Third-party Analytics</h4>
                      <p className="text-xs text-gray-400">Allow sharing data with third-party analytics providers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowThirdPartyAnalytics}
                        onChange={(e) => setSettings(prev => ({ ...prev, allowThirdPartyAnalytics: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Settings */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Alert Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Email Alerts</h4>
                      <p className="text-xs text-gray-400">Receive email notifications for important events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailAlerts}
                        onChange={(e) => setSettings(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-white mb-2">Performance Threshold (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.performanceThreshold}
                      onChange={(e) => setSettings(prev => ({ ...prev, performanceThreshold: parseInt(e.target.value) }))}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Alert when system performance drops below this threshold</p>
                  </div>

                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-white mb-2">Error Rate Threshold (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.errorRateThreshold}
                      onChange={(e) => setSettings(prev => ({ ...prev, errorRateThreshold: parseFloat(e.target.value) }))}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Alert when error rate exceeds this threshold</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">User Growth Alerts</h4>
                      <p className="text-xs text-gray-400">Get notified about significant user growth changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.userGrowthAlert}
                        onChange={(e) => setSettings(prev => ({ ...prev, userGrowthAlert: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reporting Settings */}
          {activeTab === 'reporting' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Report Generation</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Auto-generate Reports</h4>
                      <p className="text-xs text-gray-400">Automatically create reports on a schedule</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoGenerateReports}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoGenerateReports: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-white mb-2">Report Frequency</label>
                    <select
                      value={settings.reportFrequency}
                      onChange={(e) => setSettings(prev => ({ ...prev, reportFrequency: e.target.value }))}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Include Charts</h4>
                      <p className="text-xs text-gray-400">Add visualizations to generated reports</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeCharts}
                        onChange={(e) => setSettings(prev => ({ ...prev, includeCharts: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-white mb-2">Export Formats</label>
                    <div className="space-y-2">
                      {[
                        { value: 'pdf', label: 'PDF Documents' },
                        { value: 'xlsx', label: 'Excel Spreadsheets' },
                        { value: 'csv', label: 'CSV Data Files' },
                        { value: 'json', label: 'JSON Data Files' }
                      ].map((format) => (
                        <label key={format.value} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.exportFormats.includes(format.value as any)}
                            onChange={(e) => {
                              const value = format.value as any;
                              setSettings(prev => ({
                                ...prev,
                                exportFormats: e.target.checked
                                  ? [...prev.exportFormats, value]
                                  : prev.exportFormats.filter(f => f !== value)
                              }));
                            }}
                            className="rounded border-gray-500 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-300">{format.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Advanced Configuration</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-white mb-2">Sampling Rate (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.samplingRate}
                      onChange={(e) => setSettings(prev => ({ ...prev, samplingRate: parseInt(e.target.value) }))}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Percentage of events to capture (lower values reduce storage but may affect accuracy)</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Enable Caching</h4>
                      <p className="text-xs text-gray-400">Cache frequently accessed analytics data for better performance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.cacheEnabled}
                        onChange={(e) => setSettings(prev => ({ ...prev, cacheEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-white">Real-time Updates</h4>
                      <p className="text-xs text-gray-400">Enable live data streaming and real-time dashboard updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.realTimeUpdates}
                        onChange={(e) => setSettings(prev => ({ ...prev, realTimeUpdates: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-red-400">Debug Mode</h4>
                      <p className="text-xs text-gray-400">Enable detailed logging and debugging information (not recommended for production)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.debugMode}
                        onChange={(e) => setSettings(prev => ({ ...prev, debugMode: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-red-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-400 mb-2">⚠️ Advanced Settings Warning</h4>
                <p className="text-xs text-red-300">
                  Changing these settings may affect system performance and data accuracy. Only modify if you understand the implications.
                  Consider consulting with a technical expert before making changes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSettings;
