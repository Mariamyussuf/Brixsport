'use client';

import React, { useState, useEffect } from 'react';
import MetricCard from '@/components/analytics/charts/MetricCard';
import LineChart from '@/components/analytics/charts/LineChart';
import BarChart from '@/components/analytics/charts/BarChart';
import AreaChart from '@/components/analytics/charts/AreaChart';
import PieChart from '@/components/analytics/charts/PieChart';

interface BusinessIntelligenceProps {
  className?: string;
}

const BusinessIntelligence: React.FC<BusinessIntelligenceProps> = ({ className = '' }) => {
  const [businessMetrics, setBusinessMetrics] = useState({
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    averageRevenuePerUser: 0,
    customerLifetimeValue: 0,
    churnRate: 0,
    customerAcquisitionCost: 0,
    conversionRate: 0,
    engagementScore: 0
  });

  const [revenueData, setRevenueData] = useState({
    monthlyRevenue: [],
    revenueBySource: [],
    customerSegments: [],
    growthMetrics: []
  });

  const [engagementData, setEngagementData] = useState({
    userEngagement: [],
    contentPerformance: [],
    featureUsage: [],
    retentionCohorts: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading business intelligence data
    const loadData = async () => {
      try {
        // Mock business metrics
        setBusinessMetrics({
          totalRevenue: 456780,
          monthlyRecurringRevenue: 23450,
          averageRevenuePerUser: 36.50,
          customerLifetimeValue: 184.20,
          churnRate: 5.3,
          customerAcquisitionCost: 28.40,
          conversionRate: 12.8,
          engagementScore: 78.5
        });

        // Mock revenue data
        setRevenueData({
          monthlyRevenue: [
            { month: 'Jan', revenue: 34500 },
            { month: 'Feb', revenue: 38200 },
            { month: 'Mar', revenue: 42100 },
            { month: 'Apr', revenue: 39800 },
            { month: 'May', revenue: 45600 },
            { month: 'Jun', revenue: 47800 }
          ],
          revenueBySource: [
            { source: 'Subscriptions', amount: 234500 },
            { source: 'Premium Features', amount: 123400 },
            { source: 'In-app Purchases', amount: 67200 },
            { source: 'Advertisements', amount: 31680 }
          ],
          customerSegments: [
            { segment: 'Premium Users', value: 2847, percentage: 22.8 },
            { segment: 'Regular Users', value: 6872, percentage: 55.0 },
            { segment: 'Free Users', value: 2824, percentage: 22.2 }
          ],
          growthMetrics: [
            { metric: 'User Growth', value: 15.2, trend: 'up' },
            { metric: 'Revenue Growth', value: 18.7, trend: 'up' },
            { metric: 'Engagement Growth', value: 12.3, trend: 'up' },
            { metric: 'Retention Rate', value: 78.5, trend: 'up' }
          ]
        });

        // Mock engagement data
        setEngagementData({
          userEngagement: [
            { date: '2024-01', sessions: 28400, pageViews: 142000 },
            { date: '2024-02', sessions: 31200, pageViews: 156000 },
            { date: '2024-03', sessions: 34600, pageViews: 173000 },
            { date: '2024-04', sessions: 32100, pageViews: 160500 },
            { date: '2024-05', sessions: 35800, pageViews: 179000 }
          ],
          contentPerformance: [
            { content: 'Live Matches', views: 45230, engagement: 89.2 },
            { content: 'Player Profiles', views: 32150, engagement: 76.8 },
            { content: 'Team Stats', views: 28340, engagement: 82.1 },
            { content: 'Tournament Info', views: 19870, engagement: 71.5 },
            { content: 'News Articles', views: 15620, engagement: 65.3 }
          ],
          featureUsage: [
            { feature: 'Live Scoring', usage: 89.2 },
            { feature: 'Match Notifications', usage: 76.5 },
            { feature: 'Player Statistics', usage: 68.9 },
            { feature: 'Team Comparisons', usage: 54.3 },
            { feature: 'Tournament Tracking', usage: 45.7 }
          ],
          retentionCohorts: [
            { cohort: 'Week 1', retention: 85 },
            { cohort: 'Week 2', retention: 72 },
            { cohort: 'Week 4', retention: 58 },
            { cohort: 'Week 8', retention: 45 },
            { cohort: 'Week 12', retention: 38 }
          ]
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading business intelligence:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Business Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${businessMetrics.totalRevenue.toLocaleString()}`}
          change="+18.7%"
          trend="up"
          icon="💰"
          color="emerald"
        />
        <MetricCard
          title="MRR"
          value={`$${businessMetrics.monthlyRecurringRevenue.toLocaleString()}`}
          change="+12.4%"
          trend="up"
          icon="📈"
          color="blue"
        />
        <MetricCard
          title="ARPU"
          value={`$${businessMetrics.averageRevenuePerUser}`}
          change="+8.2%"
          trend="up"
          icon="👤"
          color="purple"
        />
        <MetricCard
          title="CLV"
          value={`$${businessMetrics.customerLifetimeValue}`}
          change="+15.6%"
          trend="up"
          icon="🎯"
          color="indigo"
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Churn Rate"
          value={`${businessMetrics.churnRate}%`}
          change="-2.1%"
          trend="down"
          icon="📉"
          color="red"
        />
        <MetricCard
          title="CAC"
          value={`$${businessMetrics.customerAcquisitionCost}`}
          change="-5.3%"
          trend="down"
          icon="🎣"
          color="orange"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${businessMetrics.conversionRate}%`}
          change="+3.8%"
          trend="up"
          icon="🔄"
          color="cyan"
        />
        <MetricCard
          title="Engagement Score"
          value={`${businessMetrics.engagementScore}%`}
          change="+7.2%"
          trend="up"
          icon="⭐"
          color="yellow"
        />
      </div>

      {/* Revenue Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Monthly revenue</span>
            </div>
          </div>
          <AreaChart
            data={revenueData.monthlyRevenue}
            xKey="month"
            yKey="revenue"
            color="#10b981"
            height={300}
          />
        </div>

        {/* Revenue by Source */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Source</h3>
          <PieChart
            data={revenueData.revenueBySource}
            labelKey="source"
            valueKey="amount"
            colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']}
            height={300}
          />
        </div>

        {/* Customer Segments */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Customer Segments</h3>
          <div className="space-y-4">
            {revenueData.customerSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-purple-500' :
                    index === 1 ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm text-gray-300">{segment.segment}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{segment.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{segment.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Growth Metrics</h3>
          <div className="space-y-4">
            {revenueData.growthMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{metric.metric}</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {metric.trend === 'up' ? '+' : '-'}{metric.value}%
                  </span>
                  <svg className={`w-4 h-4 ${
                    metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={metric.trend === 'up'
                            ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Engagement Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Engagement Trends */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">User Engagement</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Sessions & page views</span>
            </div>
          </div>
          <LineChart
            data={engagementData.userEngagement}
            xKey="date"
            yKey="sessions"
            color="#3b82f6"
            height={300}
          />
        </div>

        {/* Content Performance */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Content Performance</h3>
          <div className="space-y-3">
            {engagementData.contentPerformance.map((content, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-300">{content.content}</p>
                  <p className="text-xs text-gray-500">{content.views.toLocaleString()} views</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-400">{content.engagement}%</p>
                  <p className="text-xs text-gray-500">engagement</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Usage */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Feature Usage</h3>
          <div className="space-y-3">
            {engagementData.featureUsage.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{feature.feature}</span>
                  <span className="text-sm font-medium text-blue-400">{feature.usage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${feature.usage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Analysis */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">User Retention</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-400">By cohort</span>
            </div>
          </div>
          <BarChart
            data={engagementData.retentionCohorts}
            xKey="cohort"
            yKey="retention"
            color="#10b981"
            height={300}
          />
        </div>
      </div>

      {/* Business Intelligence Insights */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Business Intelligence Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">💡</span>
              <h4 className="text-sm font-medium text-blue-400">Top Insight</h4>
            </div>
            <p className="text-sm text-gray-300">Live matches drive 68% of user engagement</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg p-4 border border-emerald-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">📈</span>
              <h4 className="text-sm font-medium text-emerald-400">Growth Opportunity</h4>
            </div>
            <p className="text-sm text-gray-300">Premium subscriptions up 23% this quarter</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🎯</span>
              <h4 className="text-sm font-medium text-purple-400">Retention Focus</h4>
            </div>
            <p className="text-sm text-gray-300">Week 1 retention at 85% - excellent performance</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg p-4 border border-orange-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">⚠️</span>
              <h4 className="text-sm font-medium text-orange-400">Attention Needed</h4>
            </div>
            <p className="text-sm text-gray-300">Mobile app engagement could be improved</p>
          </div>
        </div>
      </div>

      {/* Financial Projections */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Financial Projections</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-lg font-bold text-emerald-400 mb-2">Next Quarter</h4>
            <p className="text-3xl font-bold text-white mb-1">$187,450</p>
            <p className="text-sm text-gray-400">Projected revenue</p>
            <div className="mt-2 flex items-center justify-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm text-green-400">+23.4%</span>
            </div>
          </div>

          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-lg font-bold text-blue-400 mb-2">Next 6 Months</h4>
            <p className="text-3xl font-bold text-white mb-1">$1,124,700</p>
            <p className="text-sm text-gray-400">Projected revenue</p>
            <div className="mt-2 flex items-center justify-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm text-green-400">+18.7%</span>
            </div>
          </div>

          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-lg font-bold text-purple-400 mb-2">Next Year</h4>
            <p className="text-3xl font-bold text-white mb-1">$2,845,600</p>
            <p className="text-sm text-gray-400">Projected revenue</p>
            <div className="mt-2 flex items-center justify-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm text-green-400">+15.2%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligence;
