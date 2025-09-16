import React, { useState, useEffect } from 'react';
import { Match, MatchEvent } from '@/types/matchTracker';
import { loggerService } from '@/lib/loggerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Mail, 
  Share2, 
  CheckCircle, 
  AlertCircle,
  Trophy,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { ValidationErrorDisplay } from '../shared/ValidationErrorDisplay';
import { ErrorHandler } from '@/lib/errorHandler';

interface PostMatchWrapUpProps {
  match: Match;
  onClose: () => void;
  onReportGenerated?: (report: any) => void;
}

interface MatchReport {
  id: string;
  matchId: string;
  generatedAt: string;
  summary: {
    finalScore: string;
    duration: string;
    eventsCount: number;
    keyEvents: MatchEvent[];
  };
  notes: string;
}

export const PostMatchWrapUp: React.FC<PostMatchWrapUpProps> = ({
  match,
  onClose,
  onReportGenerated
}) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<MatchReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'review' | 'generate' | 'share'>('review');

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setError(null);
    
    try {
      // Call the API to generate a report
      const reportResponse = await loggerService.generateReport(match.id);
      
      if (reportResponse.success && reportResponse.data) {
        // Use the actual report data from the API
        const reportData: MatchReport = {
          id: reportResponse.data.id || `report-${Date.now()}`,
          matchId: match.id,
          generatedAt: reportResponse.data.generatedAt || new Date().toISOString(),
          summary: {
            finalScore: `${match.homeScore} - ${match.awayScore}`,
            duration: reportResponse.data.duration || '90 minutes',
            eventsCount: match.events?.length || 0,
            keyEvents: match.events?.slice(0, 5) || []
          },
          notes
        };
        
        setReport(reportData);
        setStep('generate');
        
        if (onReportGenerated) {
          onReportGenerated(reportData);
        }
      } else {
        // Fallback to mock data if API doesn't return expected data
        const mockReport: MatchReport = {
          id: `report-${Date.now()}`,
          matchId: match.id,
          generatedAt: new Date().toISOString(),
          summary: {
            finalScore: `${match.homeScore} - ${match.awayScore}`,
            duration: '90 minutes',
            eventsCount: match.events?.length || 0,
            keyEvents: match.events?.slice(0, 5) || []
          },
          notes
        };
        
        setReport(mockReport);
        setStep('generate');
        
        if (onReportGenerated) {
          onReportGenerated(mockReport);
        }
      }
    } catch (error) {
      // Fallback to mock data if API call fails
      const mockReport: MatchReport = {
        id: `report-${Date.now()}`,
        matchId: match.id,
        generatedAt: new Date().toISOString(),
        summary: {
          finalScore: `${match.homeScore} - ${match.awayScore}`,
          duration: '90 minutes',
          eventsCount: match.events?.length || 0,
          keyEvents: match.events?.slice(0, 5) || []
        },
        notes
      };
      
      setReport(mockReport);
      setStep('generate');
      
      if (onReportGenerated) {
        onReportGenerated(mockReport);
      }
      
      // Still show error to user
      const handledError = ErrorHandler.handle(error);
      setError(`Failed to generate report: ${handledError.message}. Showing mock data instead.`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'csv' | 'json') => {
    if (!report) return;
    
    try {
      // Simulate export functionality
      const dataStr = JSON.stringify(report, null, 2);
      const dataUri = `data:application/${format};charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `match-report-${match.id}.${format}`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      // Log the export action
      console.log(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      setError(`Failed to export report: ${handledError.message}`);
    }
  };

  const handleShareReport = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real implementation, this would send the report to stakeholders
      // For now, we'll just simulate the action
      // Removed artificial delay to improve performance
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('share');
      console.log('Report shared successfully');
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      setError(`Failed to share report: ${handledError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    onClose();
  };

  // Get key events for display
  const getKeyEvents = () => {
    if (!match.events) return [];
    
    // Filter for significant events
    return match.events.filter(event => 
      ['goal', 'yellow_card', 'red_card', 'substitution', 'injury'].includes(event.type)
    ).slice(0, 10);
  };

  // Get event display info
  const getEventDisplay = (event: MatchEvent) => {
    switch (event.type) {
      case 'goal':
        return { icon: '⚽', text: 'GOAL', color: 'bg-green-500' };
      case 'yellow_card':
        return { icon: '🟨', text: 'YELLOW CARD', color: 'bg-yellow-500' };
      case 'red_card':
        return { icon: '🟥', text: 'RED CARD', color: 'bg-red-500' };
      case 'substitution':
        return { icon: '🔄', text: 'SUBSTITUTION', color: 'bg-blue-500' };
      case 'injury':
        return { icon: '🩹', text: 'INJURY', color: 'bg-red-500' };
      default:
        return { icon: '⚪', text: event.type.toUpperCase().replace('_', ' '), color: 'bg-gray-500' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Post-Match Wrap-Up</h2>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
          
          {error && (
            <div className="mb-6">
              <ValidationErrorDisplay 
                errors={[error]} 
                type="error"
              />
            </div>
          )}
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'review' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'generate' ? 'bg-blue-500 text-white' : 
                step === 'review' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Generate Report</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'share' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Share</span>
            </div>
          </div>
          
          {/* Step 1: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Match Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold">
                        {match.homeTeam.name}
                      </div>
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        {match.homeScore}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Final Score
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(match.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {match.location}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold">
                        {match.awayTeam.name}
                      </div>
                      <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                        {match.awayScore}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-bold mb-3">Key Events</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {getKeyEvents().map((event, index) => {
                        const eventDisplay = getEventDisplay(event);
                        return (
                          <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${eventDisplay.color} mr-3`}></div>
                            <span className="text-2xl mr-3">{eventDisplay.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium">{eventDisplay.text}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {event.time} • {event.description || 'No description'}
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {event.teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}
                            </Badge>
                          </div>
                        );
                      })}
                      
                      {getKeyEvents().length === 0 && (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                          No significant events recorded
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes about the match, incidents, or observations..."
                    className="w-full h-32 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button onClick={() => setStep('generate')}>
                  Generate Report
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 2: Generate Report */}
          {step === 'generate' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Match Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isGeneratingReport ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p>Generating match report...</p>
                    </div>
                  ) : report ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{match.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            {new Date(report.generatedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="secondary">Final</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Match Summary
                          </h4>
                          
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="mb-2"><strong>Final Score:</strong> {report.summary.finalScore}</p>
                            <p className="mb-2"><strong>Duration:</strong> {report.summary.duration}</p>
                            <p><strong>Events Recorded:</strong> {report.summary.eventsCount}</p>
                          </div>
                          
                          {notes && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                              <h5 className="font-bold mb-2">Additional Notes</h5>
                              <p>{notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Key Events
                          </h4>
                          
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {report.summary.keyEvents.map((event, index) => {
                              const eventDisplay = getEventDisplay(event);
                              return (
                                <div key={index} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                  <span className="text-xl mr-2">{eventDisplay.icon}</span>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{eventDisplay.text}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {event.time} • {event.description || 'No description'}
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {event.teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}
                                  </Badge>
                                </div>
                              );
                            })}
                            
                            {report.summary.keyEvents.length === 0 && (
                              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                No significant events recorded
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={() => handleExportReport('pdf')}>
                          <Download className="w-4 h-4 mr-2" />
                          Export as PDF
                        </Button>
                        <Button variant="secondary" onClick={() => handleExportReport('csv')}>
                          <Download className="w-4 h-4 mr-2" />
                          Export as CSV
                        </Button>
                        <Button variant="secondary" onClick={() => handleExportReport('json')}>
                          <Download className="w-4 h-4 mr-2" />
                          Export as JSON
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep('review')}>
                  Back
                </Button>
                <Button onClick={handleShareReport} disabled={isSubmitting}>
                  {isSubmitting ? 'Sharing...' : 'Share Report'}
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Share */}
          {step === 'share' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Report Generated Successfully!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Your match report has been generated and is ready to share.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                      <Button className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Report
                      </Button>
                      <Button variant="secondary" className="flex items-center">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep('generate')}>
                  Back
                </Button>
                <Button onClick={handleComplete}>
                  Complete Wrap-Up
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};