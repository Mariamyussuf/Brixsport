'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Simple loading skeleton component
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
    />
  );
};

// Types
interface UserAnalyticsData {
  date: string;
  count: number;
}

interface DemographicsData {
  ageGroup: string;
  count: number;
}

interface EngagementData {
  metric: string;
  value: number;
}

const UserAnalytics: React.FC = () => {
  const [userGrowthData, setUserGrowthData] = useState<UserAnalyticsData[]>([]);
  const [demographicsData, setDemographicsData] = useState<DemographicsData[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Simulate fetching user growth data
        const mockUserGrowthData: UserAnalyticsData[] = [
          { date: '2023-01', count: 120 },
          { date: '2023-02', count: 180 },
          { date: '2023-03', count: 240 },
          { date: '2023-04', count: 300 },
          { date: '2023-05', count: 360 },
          { date: '2023-06', count: 420 },
        ];
        
        // Simulate fetching demographics data
        const mockDemographicsData: DemographicsData[] = [
          { ageGroup: '18-24', count: 120 },
          { ageGroup: '25-34', count: 180 },
          { ageGroup: '35-44', count: 90 },
          { ageGroup: '45-54', count: 60 },
          { ageGroup: '55+', count: 30 },
        ];
        
        // Simulate fetching engagement data
        const mockEngagementData: EngagementData[] = [
          { metric: 'Active Users', value: 420 },
          { metric: 'New Signups', value: 85 },
          { metric: 'Returning Users', value: 335 },
        ];
        
        setUserGrowthData(mockUserGrowthData);
        setDemographicsData(mockDemographicsData);
        setEngagementData(mockEngagementData);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Analytics</h1>
      
      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demographics Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={demographicsData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ ageGroup, count }) => `${ageGroup}: ${count}`}
                >
                  {demographicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserAnalytics;