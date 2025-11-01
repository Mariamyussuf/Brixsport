import { useState, useEffect, useRef } from 'react';

interface LiveMatchUpdate {
  matchId: number;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'scheduled' | 'completed';
  timestamp: string;
}

export const useRealTimeUpdates = () => {
  const [liveMatches, setLiveMatches] = useState<Record<number, LiveMatchUpdate>>({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket server for real-time updates
  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket('wss://api.brixsports.com/live/updates');
    wsRef.current = ws;
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connection established');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle different types of messages
        if (data.type === 'scoreUpdate') {
          const update: LiveMatchUpdate = {
            matchId: data.matchId,
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            status: data.status || 'live',
            timestamp: new Date().toISOString()
          };
          
          setLiveMatches(prev => ({
            ...prev,
            [data.matchId]: update
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket connection closed');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const subscribeToMatch = (matchId: number) => {
    // Send a subscription message to the WebSocket server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'subscribe', 
        matchId 
      }));
    }
    
    setLiveMatches(prev => ({
      ...prev,
      [matchId]: {
        matchId,
        homeScore: 0,
        awayScore: 0,
        status: 'live',
        timestamp: new Date().toISOString()
      }
    }));
  };

  const unsubscribeFromMatch = (matchId: number) => {
    // Send an unsubscribe message to the WebSocket server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'unsubscribe', 
        matchId 
      }));
    }
    
    setLiveMatches(prev => {
      const newMatches = { ...prev };
      delete newMatches[matchId];
      return newMatches;
    });
  };

  return {
    liveMatches,
    isConnected,
    subscribeToMatch,
    unsubscribeFromMatch
  };
};