// useRealTimeTournamentUpdates.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface MatchUpdate {
  matchId: string;
  homeScore?: number;
  awayScore?: number;
  status?: string;
  minute?: number;
}

export const useRealTimeTournamentUpdates = (competitionId: string) => {
  const [matchUpdates, setMatchUpdates] = useState<Record<string, MatchUpdate>>({});
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!competitionId) return;

    // Connect to WebSocket server
    setConnectionStatus('connecting');
    
    const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      // Join competition room
      newSocket.emit('joinCompetition', { competitionId });
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    // Listen for match updates
    newSocket.on('matchUpdate', (update: MatchUpdate) => {
      setMatchUpdates(prev => ({
        ...prev,
        [update.matchId]: update
      }));
    });

    // Cleanup function
    return () => {
      if (newSocket) {
        newSocket.emit('leaveCompetition', { competitionId });
        newSocket.disconnect();
        setConnectionStatus('disconnected');
      }
    };
  }, [competitionId]);

  const triggerUpdate = (update: MatchUpdate) => {
    setMatchUpdates(prev => ({
      ...prev,
      [update.matchId]: update
    }));
    
    // Emit the update to the server
    if (socket) {
      socket.emit('matchUpdate', update);
    }
  };

  return {
    matchUpdates,
    connectionStatus,
    triggerUpdate
  };
};

export default useRealTimeTournamentUpdates;