import { useState, useEffect, useRef } from 'react';

interface SocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useSocket = (url?: string, options: SocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const connect = () => {
    if (!url) return null;

    try {
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      socket.onclose = () => {
        setIsConnected(false);
        
        // Attempt reconnection if within limits
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (event) => {
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      socketRef.current = socket;
      return socket;
    } catch (err) {
      setError('Failed to create WebSocket connection');
      return null;
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsConnected(false);
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event, data }));
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (!socketRef.current) return;

    const handleMessage = (messageEvent: MessageEvent) => {
      try {
        const message = JSON.parse(messageEvent.data);
        if (message.event === event) {
          callback(message.data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socketRef.current.addEventListener('message', handleMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.removeEventListener('message', handleMessage);
      }
    };
  };

  const off = (event: string, callback?: (data: any) => void) => {
    // In a real implementation, you'd track listeners and remove specific ones
    // For now, this is a placeholder
  };

  useEffect(() => {
    if (autoConnect && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, autoConnect]);

  // Mock socket object for compatibility with existing code
  const socket = {
    emit,
    on,
    off,
    connected: isConnected,
    disconnect
  };

  return isConnected ? socket : null;
};
