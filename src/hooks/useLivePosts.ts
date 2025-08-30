import { useEffect, useRef, useState, useCallback } from 'react';
import type { Post } from '../types';

export interface LivePostsOptions {
  onPost: (post: Post) => void;
  qsString: string;
}

export function useLivePosts({ onPost, qsString }: LivePostsOptions) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(true);
  const onPostRef = useRef(onPost);
  useEffect(() => {
    onPostRef.current = onPost;
  }, [onPost]);

  const connect = useCallback(() => {
    const wsUrl = new URL('/ws/stream', window.location.origin);
    if (qsString) {
      const params = new URLSearchParams(qsString);
      params.forEach((v, k) => wsUrl.searchParams.set(k, v));
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    wsUrl.protocol = `${protocol}:`;

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as Post;
        onPostRef.current(data);
      } catch {
      }
    };
  }, [qsString]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    wsRef.current?.close();
    connect();
  }, [connect]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { connected, disconnect, reconnect } as const;
}


