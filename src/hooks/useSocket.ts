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
  const listenersRef = useRef<Record<string, Array<(data: any) => void>>>({});

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

      socket.onmessage = (messageEvent: MessageEvent) => {
        try {
          const message = JSON.parse(messageEvent.data);
          const event = message.event;
          const data = message.data;
          
          // Call all listeners for this event
          if (listenersRef.current[event]) {
            listenersRef.current[event].forEach(callback => {
              callback(data);
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
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
    // Initialize listeners array for this event if it doesn't exist
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    
    // Add callback to listeners
    listenersRef.current[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      listenersRef.current[event] = listenersRef.current[event].filter(cb => cb !== callback);
    };
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (callback) {
      // Remove specific callback
      if (listenersRef.current[event]) {
        listenersRef.current[event] = listenersRef.current[event].filter(cb => cb !== callback);
      }
    } else {
      // Remove all callbacks for this event
      delete listenersRef.current[event];
    }
  };

  useEffect(() => {
    if (autoConnect && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, autoConnect]);

  return {
    emit,
    on,
    off,
    connected: isConnected,
    disconnect,
    error
  };
};