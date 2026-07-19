import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TelemetryState } from '../hooks/useTelemetry';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  demoState: TelemetryState | null;
  onStateChange: (state: TelemetryState | null) => void;
}

export default function DemoControls({ demoState, onStateChange }: Props) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const callDemo = useCallback(async (endpoint: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/demo/${endpoint}`, { method: endpoint === 'status' ? 'GET' : 'POST' });
      const data = await res.json() as { state?: TelemetryState } & TelemetryState;
      onStateChange(data.state ?? data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [onStateChange]);

  const startDemo = useCallback(async () => {
    setIsActive(true);
    await callDemo('start');
  }, [callDemo]);

  const stopDemo = useCallback(() => {
    setIsActive(false);
    setIsAutoPlaying(false);
    if (autoRef.current) clearInterval(autoRef.current);
    onStateChange(null);
  }, [onStateChange]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => {
      if (prev) {
        if (autoRef.current) clearInterval(autoRef.current);
        return false;
      } else {
        autoRef.current = setInterval(() => callDemo('next'), 3000);
        return true;
      }
    });
  }, [callDemo]);

  useEffect(() => () => { if (autoRef.current) clearInterval(autoRef.current); }, []);

  const step = demoState?.step ?? 0;
  const total = demoState?.total_steps ?? 20;
  const event = demoState?.event ?? '';

  if (!isActive) {
    return (
      <button
        id="demo-mode-toggle"
        className="demo-enable-btn"
        onClick={startDemo}
        aria-label={t('demo.enable')}
      >
        🎬 {t('stadium.demo')}
      </button>
    );
  }

  return (
    <div
      role="toolbar"
      aria-label="Demo mode controls"
      className="demo-toolbar"
    >
      <span className="demo-badge">
        DEMO MODE
      </span>

      {isLoading && <LoadingSpinner size="sm" label="Loading step..." />}

      <span className="demo-step-text">
        {t('stadium.step')} {step + 1}/{total}
        {event && <> — <strong className="demo-event-highlight">{event}</strong></>}
      </span>

      <button className="demo-btn" onClick={() => callDemo('reset')} aria-label={t('demo.reset')}>⏮ {t('demo.reset')}</button>
      <button className="demo-btn" onClick={() => callDemo('prev')} aria-label="Previous step">‹ Prev</button>
      <button className="demo-btn" onClick={() => callDemo('next')} aria-label={t('demo.next')}>{t('demo.next')} ›</button>
      <button
        className={`demo-btn ${isAutoPlaying ? 'demo-autoplay-btn-on' : 'demo-autoplay-btn-off'}`}
        onClick={toggleAutoPlay}
        aria-pressed={isAutoPlaying}
      >
        {isAutoPlaying ? `⏸ ${t('demo.stop')}` : `▶ ${t('demo.auto')}`}
      </button>
      <button className="demo-btn demo-btn-danger" onClick={stopDemo} aria-label={t('demo.disable')}>✕</button>
    </div>
  );
}
