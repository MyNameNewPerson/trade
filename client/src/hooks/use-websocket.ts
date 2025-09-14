import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket(url?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3; // Reduced from 5 to avoid excessive reconnection attempts
  const reconnectDelay = 5000; // Increased from 3 seconds to 5 seconds
  const isReconnecting = useRef(false);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || isReconnecting.current) {
      return; // Already connected or reconnection in progress
    }
    
    isReconnecting.current = true;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = url || `${protocol}//${window.location.host}/ws`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        isReconnecting.current = false;
        console.log('WebSocket connected successfully');
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        isReconnecting.current = false;
        
        // Only log and attempt reconnect if it wasn't a manual close
        if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
          const backoffDelay = reconnectDelay * Math.pow(2, reconnectAttempts.current); // Exponential backoff
          console.log(`WebSocket disconnected unexpectedly. Reconnecting in ${backoffDelay}ms... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, backoffDelay);
        } else if (event.wasClean) {
          console.log('WebSocket disconnected cleanly');
        } else {
          console.log('WebSocket max reconnection attempts reached - will not attempt further reconnections');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        isReconnecting.current = false;
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnected(false);
      isReconnecting.current = false;
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
        ws.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
