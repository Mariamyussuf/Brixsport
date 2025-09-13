import React, { useState, useEffect } from 'react';
import { LoggerMatch } from '@/lib/loggerService';
import { TeamStats, PlayerStats } from '@/types/matchEvents';
import { loggerService } from '@/lib/loggerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { ErrorHandler } from '@/lib/errorHandler';

interface AnalyticsDashboardProps {
  matches: LoggerMatch[];
}

interface AggregatedStats {
  totalMatches: number;
  totalGoals: number;
  totalCards: number;
  totalSubstitutions: number;
  avgPossession: number;
  avgShots: number;
  teamStats: TeamAggregatedStats[];
  playerStats: PlayerAggregatedStats[];
}

interface TeamAggregatedStats {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  possession: number;
  shots: number;
  shotsOnTarget: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
}

interface PlayerAggregatedStats {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passesCompleted: number;
  tackles: number;
  interceptions: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ matches }) => {
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedTeam]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch real analytics data from the API
      const statsResponse = await loggerService.getAnalyticsData();
      if (statsResponse.success && statsResponse.data) {
        setAggregatedStats(statsResponse.data);
        return;
      }
      
      // If API call fails, set error state
      setError('Failed to load analytics data');
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    if (!aggregatedStats) return;
    
    try {
      // Export functionality
      const dataStr = JSON.stringify(aggregatedStats, null, 2);
      const dataUri = `data:application/${format};charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      // Log the export action
      console.log(`Analytics report exported as ${format.toUpperCase()}`);
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

  if (!aggregatedStats) {
    return (
      <div className="text-center py-8 text-gray-500">
        No analytics data available
      </div>
    );
  }

  // Prepare data for charts
  const goalsPerTeamData = aggregatedStats.teamStats.map(team => ({
    name: team.teamName,
    goals: team.goalsFor
  }));

  const cardsPerTeamData = aggregatedStats.teamStats.map(team => ({
    name: team.teamName,
    yellow: team.yellowCards,
    red: team.redCards
  }));

  const topScorersData = aggregatedStats.playerStats
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5)
    .map(player => ({
      name: player.playerName,
      goals: player.goals
    }));

  const teamPerformanceData = aggregatedStats.teamStats.map(team => ({
    name: team.teamName,
    wins: team.wins,
    draws: team.draws,
    losses: team.losses
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Comprehensive statistics and insights
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <select 
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="all">All Teams</option>
              {aggregatedStats.teamStats.map(team => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>
          
          <Button variant="secondary" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.totalMatches}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.totalGoals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cards Issued</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.totalCards}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Substitutions</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.totalSubstitutions}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals per Team */}
        <Card>
          <CardHeader>
            <CardTitle>Goals per Team</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={goalsPerTeamData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="goals" fill="#0088FE" name="Goals" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wins" fill="#00C49F" name="Wins" />
                <Bar dataKey="draws" fill="#FFBB28" name="Draws" />
                <Bar dataKey="losses" fill="#FF8042" name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Cards per Team */}
        <Card>
          <CardHeader>
            <CardTitle>Cards per Team</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardsPerTeamData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="yellow" fill="#FFBB28" name="Yellow Cards" />
                <Bar dataKey="red" fill="#FF8042" name="Red Cards" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Top Scorers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Scorers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topScorersData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="goals"
                  nameKey="name"
                  label={({ name, goals }) => `${name}: ${goals}`}
                >
                  {topScorersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Team</th>
                  <th className="text-center py-2">MP</th>
                  <th className="text-center py-2">W</th>
                  <th className="text-center py-2">D</th>
                  <th className="text-center py-2">L</th>
                  <th className="text-center py-2">GF</th>
                  <th className="text-center py-2">GA</th>
                  <th className="text-center py-2">GD</th>
                  <th className="text-center py-2">Poss%</th>
                  <th className="text-center py-2">Shots</th>
                  <th className="text-center py-2">Cards</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedStats.teamStats.map(team => (
                  <tr key={team.teamId} className="border-b">
                    <td className="py-2 font-medium">{team.teamName}</td>
                    <td className="text-center py-2">{team.matchesPlayed}</td>
                    <td className="text-center py-2">{team.wins}</td>
                    <td className="text-center py-2">{team.draws}</td>
                    <td className="text-center py-2">{team.losses}</td>
                    <td className="text-center py-2">{team.goalsFor}</td>
                    <td className="text-center py-2">{team.goalsAgainst}</td>
                    <td className="text-center py-2">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                    <td className="text-center py-2">{team.possession}%</td>
                    <td className="text-center py-2">{team.shots}</td>
                    <td className="text-center py-2">
                      <span className="text-yellow-500">{team.yellowCards}</span> / 
                      <span className="text-red-500"> {team.redCards}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Player Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Player</th>
                  <th className="text-left py-2">Team</th>
                  <th className="text-center py-2">MP</th>
                  <th className="text-center py-2">Goals</th>
                  <th className="text-center py-2">Assists</th>
                  <th className="text-center py-2">Shots</th>
                  <th className="text-center py-2">Passes</th>
                  <th className="text-center py-2">Tackles</th>
                  <th className="text-center py-2">Interceptions</th>
                  <th className="text-center py-2">Cards</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedStats.playerStats.map(player => (
                  <tr key={player.playerId} className="border-b">
                    <td className="py-2 font-medium">{player.playerName}</td>
                    <td className="py-2">{player.teamName}</td>
                    <td className="text-center py-2">{player.matchesPlayed}</td>
                    <td className="text-center py-2">{player.goals}</td>
                    <td className="text-center py-2">{player.assists}</td>
                    <td className="text-center py-2">{player.shots} ({player.shotsOnTarget})</td>
                    <td className="text-center py-2">{player.passes} ({player.passesCompleted})</td>
                    <td className="text-center py-2">{player.tackles}</td>
                    <td className="text-center py-2">{player.interceptions}</td>
                    <td className="text-center py-2">
                      <span className="text-yellow-500">{player.yellowCards}</span> / 
                      <span className="text-red-500"> {player.redCards}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};