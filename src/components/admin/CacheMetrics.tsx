'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Zap, 
  Activity, 
  Shield, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  RotateCcw
} from 'lucide-react';
import cacheService, { CacheStats } from '@/services/cacheService';

const CacheMetrics: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const result = await cacheService.getStats();
      
      if (result.success && result.data) {
        setStats(result.data);
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to fetch cache statistics');
      }
    } catch (err) {
      setError('Failed to fetch cache statistics');
      console.error('Error fetching cache stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWarmCache = async () => {
    try {
      const result = await cacheService.warmCache();
      if (result.success) {
        await fetchStats();
      } else {
        setError(result.error?.message || 'Failed to warm cache');
      }
    } catch (err) {
      setError('Failed to warm cache');
      console.error('Error warming cache:', err);
    }
  };

  const handleClearCache = async () => {
    try {
      const result = await cacheService.clearCache();
      if (result.success) {
        await fetchStats();
      } else {
        setError(result.error?.message || 'Failed to clear cache');
      }
    } catch (err) {
      setError('Failed to clear cache');
      console.error('Error clearing cache:', err);
    }
  };

  const handleResetMetrics = async () => {
    try {
      const result = await cacheService.resetMetrics();
      if (result.success) {
        await fetchStats();
      } else {
        setError(result.error?.message || 'Failed to reset metrics');
      }
    } catch (err) {
      setError('Failed to reset metrics');
      console.error('Error resetting metrics:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading cache metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            <span className="ml-2">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <span>No cache metrics available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isHealthy = stats.health.redis && stats.health.circuitBreaker;
  const hitRate = stats.cache.metrics.hitRate;
  const poolHitRate = parseFloat(stats.redis.poolHitRate) || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Metrics
            <Badge variant={isHealthy ? "default" : "destructive"}>
              {isHealthy ? "Healthy" : "Issues Detected"}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetMetrics}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset Metrics
            </Button>
            <Button variant="outline" size="sm" onClick={handleWarmCache}>
              <Zap className="h-4 w-4 mr-1" />
              Warm Cache
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearCache}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Cache
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Hit Rate</span>
            </div>
            <div className="text-2xl font-bold">{hitRate.toFixed(2)}%</div>
            <Progress value={hitRate} className="mt-2" />
            {hitRate < 80 && (
              <div className="text-xs text-yellow-600 mt-1">
                Below optimal performance
              </div>
            )}
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Pool Hit Rate</span>
            </div>
            <div className="text-2xl font-bold">{poolHitRate.toFixed(2)}%</div>
            <Progress value={poolHitRate} className="mt-2" />
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Connections</span>
            </div>
            <div className="text-2xl font-bold">{stats.redis.activeConnections}</div>
            <div className="text-xs text-gray-500">
              Pool: {stats.redis.poolSize}/{stats.redis.maxPoolSize}
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">L1 Cache</span>
            </div>
            <div className="text-2xl font-bold">{stats.cache.l1Size}</div>
            <div className="text-xs text-gray-500">
              Max: {stats.cache.l1MaxSize}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Redis Metrics</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Connections:</span>
                <span>{stats.redis.totalConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Commands Executed:</span>
                <span>{stats.redis.commandsExecuted}</span>
              </div>
              <div className="flex justify-between">
                <span>Command Errors:</span>
                <span>{stats.redis.commandErrors}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed Connections:</span>
                <span>{stats.redis.failedConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span>{stats.redis.uptime}</span>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Circuit Breaker</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>State:</span>
                <Badge variant={stats.redis.circuitBreaker.state === 'CLOSED' ? 'default' : 'destructive'}>
                  {stats.redis.circuitBreaker.state}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Requests:</span>
                <span>{stats.redis.circuitBreaker.totalRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>Failures:</span>
                <span>{stats.redis.circuitBreaker.failures}</span>
              </div>
              <div className="flex justify-between">
                <span>Rejected Requests:</span>
                <span>{stats.redis.circuitBreaker.rejectedRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>Last State Change:</span>
                <span>
                  {new Date(stats.redis.circuitBreaker.lastStateChange).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {stats.cache.health.issues.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Cache Issues Detected</span>
            </div>
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {stats.cache.health.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CacheMetrics;