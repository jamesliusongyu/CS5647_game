// src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Create a context for WebSocket
const WebSocketContext = createContext<WebSocket | null>(null);

interface WebSocketProviderProps {
  children: ReactNode; // Define children as ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000');
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setSocket(ws);
    };

    return () => {
      // Cleanup WebSocket connection
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socket}>
      {children} {/* Render children inside the provider */}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
