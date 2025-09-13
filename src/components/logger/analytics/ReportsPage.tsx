import React, { useState, useEffect } from 'react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { Match } from '@/types/matchTracker';
import { loggerService, LoggerMatch } from '@/lib/loggerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Download,
  Filter
} from 'lucide-react';
import { ErrorHandler } from '@/lib/errorHandler';

interface Report {
  id: string;
  title: string;
  generatedAt: string;
  type: 'match' | 'team' | 'player' | 'season';
  status: 'draft' | 'published' | 'archived';
}

export default function ReportsPage() {
  const [matches, setMatches] = useState<LoggerMatch[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');

  useEffect(() => {
    loadMatches();
    loadReports();
  }, []);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const matchesResponse = await loggerService.getAllMatches();
      if (matchesResponse.success && matchesResponse.data) {
        setMatches(matchesResponse.data);
      }
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      // Fetch reports from the API
      const reportsResponse = await loggerService.getReports();
      if (reportsResponse.success && reportsResponse.data) {
        setReports(reportsResponse.data);
      }
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      setError(handledError.message);
    }
  };

  const handleGenerateReport = async (type: Report['type']) => {
    try {
      // Generate a new report through the API
      const generateResponse = await loggerService.generateReport(type);
      if (generateResponse.success && generateResponse.data) {
        setReports([generateResponse.data, ...reports]);
        console.log(`Generated ${type} report`);
      }
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      setError(`Failed to generate report: ${handledError.message}`);
    }
  };

  const handleExportReport = (reportId: string, format: 'pdf' | 'csv' | 'json') => {
    try {
      // Export functionality
      const report = reports.find(r => r.id === reportId);
      if (!report) return;
      
      const dataStr = JSON.stringify(report, null, 2);
      const dataUri = `data:application/${format};charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `report-${reportId}.${format}`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      // Log the export action
      console.log(`Report ${reportId} exported as ${format.toUpperCase()}`);
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      setError(`Failed to export report: ${handledError.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
                <p className="text-gray-300 text-sm">Comprehensive statistics and reporting tools</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={activeTab === 'dashboard' ? 'default' : 'secondary'}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </Button>
              <Button 
                variant={activeTab === 'reports' ? 'default' : 'secondary'}
                onClick={() => setActiveTab('reports')}
              >
                Reports
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <AnalyticsDashboard matches={matches} />
        )}
        
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Reports Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Reports</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Generate and manage match, team, and player reports
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleGenerateReport('match')}>
                  <FileText className="w-4 h-4 mr-2" />
                  New Match Report
                </Button>
                <Button variant="secondary" onClick={() => handleGenerateReport('team')}>
                  <FileText className="w-4 h-4 mr-2" />
                  New Team Report
                </Button>
                <Button variant="secondary" onClick={() => handleGenerateReport('player')}>
                  <FileText className="w-4 h-4 mr-2" />
                  New Player Report
                </Button>
              </div>
            </div>
            
            {/* Reports List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map(report => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="text-lg">{report.title}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'published' ? 'bg-green-100 text-green-800' :
                        report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FileText className="w-4 h-4 mr-2" />
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleExportReport(report.id, 'pdf')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleExportReport(report.id, 'csv')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          CSV
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleExportReport(report.id, 'json')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          JSON
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {reports.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reports generated yet</p>
                  <p className="text-sm">Create your first report using the buttons above</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}