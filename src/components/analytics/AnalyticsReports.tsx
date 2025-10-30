'use client';

import React, { useState, useEffect } from 'react';
import analyticsService, { Report } from '@/services/analyticsService';

interface AnalyticsReportsProps {
  className?: string;
}

const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({ className = '' }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newReport, setNewReport] = useState({
    name: '',
    type: 'user' as 'user' | 'system' | 'business' | 'custom',
    description: '',
    format: 'pdf' as 'pdf' | 'csv' | 'json' | 'xlsx',
    parameters: {}
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const response = await analyticsService.listReports();
      if (response.success) {
        setReports(response.data || []);
      } else {
        console.error('Failed to load reports:', response.error);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    if (!newReport.name.trim()) return;

    setGeneratingReport('new');
    try {
      const response = await analyticsService.generateReport(
        newReport.type,
        newReport.parameters,
        newReport.format
      );
      
      if (response.success && response.data) {
        // Add the new report to the list
        setReports(prev => [response.data!, ...prev]);
        
        // Reset form
        setNewReport({
          name: '',
          type: 'user',
          description: '',
          format: 'pdf',
          parameters: {}
        });
        setShowCreateForm(false);
      } else {
        console.error('Failed to create report:', response.error);
      }
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await analyticsService.downloadReport(reportId);
      if (response.success) {
        // In a real app, this would trigger a download
        console.log(`Downloading report: ${reportId}`);
        // Here you would typically create a download link or open in new tab
      } else {
        console.error('Failed to download report:', response.error);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await analyticsService.deleteReport(reportId);
      if (response.success) {
        setReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        console.error('Failed to delete report:', response.error);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'ready': return 'text-green-400 bg-green-500/20';
      case 'generating': return 'text-blue-400 bg-blue-500/20';
      case 'expired': return 'text-orange-400 bg-orange-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'ready': return '✅';
      case 'generating': return '🔄';
      case 'expired': return '⏰';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Reports</h2>
          <p className="text-gray-400 mt-1">Generate and manage analytics reports</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Report</span>
        </button>
      </div>

      {/* Create Report Form */}
      {showCreateForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Create New Report</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Report Name</label>
              <input
                type="text"
                value={newReport.name}
                onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter report name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
              <select
                value={newReport.type}
                onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User Analytics</option>
                <option value="system">System Performance</option>
                <option value="business">Business Intelligence</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={newReport.description}
                onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                placeholder="Describe the report purpose and scope"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
              <select
                value={newReport.format}
                onChange={(e) => setNewReport(prev => ({ ...prev, format: e.target.value as any }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pdf">PDF Document</option>
                <option value="xlsx">Excel Spreadsheet</option>
                <option value="csv">CSV Data</option>
                <option value="json">JSON Data</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCreateReport}
                disabled={generatingReport === 'new' || !newReport.name.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {generatingReport === 'new' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Generated Reports</h3>
          <p className="text-gray-400 text-sm mt-1">Manage and download your analytics reports</p>
        </div>

        <div className="divide-y divide-gray-700">
          {reports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getStatusIcon(report.status)}</div>
                  <div>
                    <h4 className="text-lg font-medium text-white">{report.name}</h4>
                    <p className="text-gray-400 text-sm mt-1">{report.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
                        {report.status?.charAt(0).toUpperCase() + (report.status?.slice(1) || '')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {report.format?.toUpperCase()} • {report.size || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Expires: {report.expiresAt ? new Date(report.expiresAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {report.status === 'ready' && (
                    <button
                      onClick={() => handleDownloadReport(report.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>
                  )}

                  {report.status === 'generating' && (
                    <div className="flex items-center space-x-2 text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      <span className="text-sm">Generating...</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Delete report"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No reports found</h3>
            <p className="text-gray-500 mb-6">Create your first analytics report to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Create Your First Report
            </button>
          </div>
        )}
      </div>

      {/* Quick Report Templates */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Daily Summary',
              description: 'Key metrics summary for the past 24 hours',
              icon: '📊',
              type: 'system'
            },
            {
              title: 'User Growth',
              description: 'User acquisition and retention analysis',
              icon: '📈',
              type: 'user'
            },
            {
              title: 'Revenue Report',
              description: 'Financial performance and projections',
              icon: '💰',
              type: 'business'
            },
            {
              title: 'Performance Audit',
              description: 'System performance and optimization report',
              icon: '⚡',
              type: 'system'
            }
          ].map((template, index) => (
            <div 
              key={index} 
              className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors cursor-pointer border border-gray-600"
              onClick={() => {
                setNewReport({
                  name: template.title,
                  type: template.type as any,
                  description: template.description,
                  format: 'pdf',
                  parameters: {}
                });
                setShowCreateForm(true);
              }}
            >
              <div className="text-2xl mb-3">{template.icon}</div>
              <h4 className="text-sm font-medium text-white mb-1">{template.title}</h4>
              <p className="text-xs text-gray-400 mb-3">{template.description}</p>
              <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReports;