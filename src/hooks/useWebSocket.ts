// src/hooks/useWebSocket.ts
import { useState, useEffect, useRef, useCallback } from "react";
import type { WebSocketMessage } from "../types/api";

export const WebSocketReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type WebSocketReadyState =
  (typeof WebSocketReadyState)[keyof typeof WebSocketReadyState];

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectLimit?: number; // Max reconnection attempts
  reconnectInterval?: number; // Delay between reconnections in ms
}

const useWebSocket = (url: string | null, options?: UseWebSocketOptions) => {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectLimit = 5,
    reconnectInterval = 3000,
  } = options || {};

  // Refs for callbacks to avoid re-connecting on render if parent doesn't memoize
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onClose, onError]);

  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [readyState, setReadyState] = useState<WebSocketReadyState>(
    WebSocketReadyState.CLOSED,
  );
  const [error, setError] = useState<Event | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExplicitlyClosed = useRef<boolean>(false);
  const [connectTrigger, setConnectTrigger] = useState(0);

  // Keep track of the latest URL to access it inside the effect without triggering it
  const urlRef = useRef(url);
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  const connect = useCallback(() => {
    isExplicitlyClosed.current = false;
    setReadyState(WebSocketReadyState.CONNECTING);
    setError(null);
    setConnectTrigger((prev) => prev + 1);
  }, []);

  const disconnect = useCallback(() => {
    isExplicitlyClosed.current = true;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (ws.current) {
      setReadyState(WebSocketReadyState.CLOSING);
      ws.current.close();
    }
  }, []);

  // Trigger connection when URL changes
  useEffect(() => {
    if (url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      connect();
    } else {
      disconnect();
    }
  }, [url, connect, disconnect]);

  const sendMessage = useCallback((message: string | object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        typeof message === "string" ? message : JSON.stringify(message),
      );
    } else {
      console.warn("WebSocket is not open. Cannot send message.");
    }
  }, []);

  useEffect(() => {
    // We access the URL via ref to avoid adding it to the dependency array
    // which would cause a double-connection loop (url change -> connect() -> trigger change -> effect runs twice)
    const currentUrl = urlRef.current;

    if (!currentUrl) {
      return;
    }

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    isExplicitlyClosed.current = false;

    const websocket = new WebSocket(currentUrl);
    ws.current = websocket;

    websocket.onopen = (event) => {
      setReadyState(WebSocketReadyState.OPEN);
      reconnectAttempts.current = 0;
      onOpenRef.current?.(event);
    };

    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        onMessageRef.current?.(message);
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    websocket.onerror = (event) => {
      setError(event);
      onErrorRef.current?.(event);
    };

    websocket.onclose = (event) => {
      setReadyState(WebSocketReadyState.CLOSED);
      onCloseRef.current?.(event);

      if (!isExplicitlyClosed.current) {
        if (reconnectAttempts.current < reconnectLimit) {
          reconnectAttempts.current++;
          console.warn(
            `WebSocket closed unexpectedly. Attempting to reconnect in ${reconnectInterval}ms (Attempt ${reconnectAttempts.current}/${reconnectLimit})...`,
          );
          reconnectTimer.current = setTimeout(() => {
            setConnectTrigger((prev) => prev + 1);
          }, reconnectInterval);
        } else {
          console.error("WebSocket reconnection limit reached.");
        }
      }
    };

    return () => {
      if (ws.current === websocket) {
        websocket.close();
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [connectTrigger, reconnectLimit, reconnectInterval]);

  return {
    lastMessage,
    readyState,
    error,
    sendMessage,
    disconnect,
    connect,
  };
};

export default useWebSocket;
