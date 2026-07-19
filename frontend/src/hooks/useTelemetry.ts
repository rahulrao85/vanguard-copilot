import { useCallback, useEffect, useRef, useState } from 'react';

export interface TelemetryState {
  timestamp: number;
  phase: number;
  gates: Record<string, number>;
  zones: Record<string, number>;
  concessions: Record<string, number>;
  // demo fields
  tick?: number;
  step?: number;
  total_steps?: number;
  event?: string;
}

interface UseTelemetryReturn {
  telemetry: TelemetryState | null;
  isConnected: boolean;
  error: string | null;
}

/**
 * Connects to /api/stream via EventSource and provides live telemetry.
 * Auto-reconnects on disconnect.
 */
export function useTelemetry(enabled = true): UseTelemetryReturn {
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }
    const es = new EventSource('/api/stream');
    esRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as TelemetryState;
        setTelemetry(data);
      } catch {
        // ignore malformed data
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      // auto-reconnect after 5 s
      retryRef.current = setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect, enabled]);

  return { telemetry, isConnected, error };
}
