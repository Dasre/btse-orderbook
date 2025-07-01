import { useRef, useCallback, useEffect } from "react";

interface WebSocketConfig {
  url: string;
  subscribeMessage: object;
  onMessage: (data: any) => void;
  onConnect?: () => void;
  reconnectOnError?: boolean;
  connectionName?: string;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(config.onMessage);
  const onConnectRef = useRef(config.onConnect);
  const subscribeMessageRef = useRef(config.subscribeMessage);

  const {
    url,
    reconnectOnError = false,
    connectionName = "WebSocket",
  } = config;

  // Update refs when config changes
  useEffect(() => {
    onMessageRef.current = config.onMessage;
    onConnectRef.current = config.onConnect;
    subscribeMessageRef.current = config.subscribeMessage;
  });

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`${connectionName} connected`);
      onConnectRef.current?.();

      ws.send(JSON.stringify(subscribeMessageRef.current));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessageRef.current(message);
      } catch (error) {
        console.error(`Error parsing ${connectionName} message:`, error);
      }
    };

    ws.onclose = () => {
      console.log(`${connectionName} disconnected`);
    };

    ws.onerror = (error) => {
      console.error(`${connectionName} error:`, error);
    };
  }, [url, connectionName, reconnectOnError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return {
    connect,
    disconnect,
  };
};
