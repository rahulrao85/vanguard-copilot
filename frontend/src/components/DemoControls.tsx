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

  const btnStyle: React.CSSProperties = {
    padding: '0.35rem 0.8rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  if (!isActive) {
    return (
      <button
        id="demo-mode-toggle"
        style={{ ...btnStyle, background: 'var(--color-accent-primary)', color: '#fff', border: 'none' }}
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 'var(--radius-lg)',
        flexWrap: 'wrap',
      }}
    >
      {/* DEMO badge */}
      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.1em', padding: '0.2rem 0.5rem', background: 'rgba(245,158,11,0.15)', borderRadius: '999px' }}>
        DEMO MODE
      </span>

      {isLoading && <LoadingSpinner size="sm" label="Loading step..." />}

      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
        {t('stadium.step')} {step + 1}/{total}
        {event && <> — <strong style={{ color: 'var(--color-text-primary)' }}>{event}</strong></>}
      </span>

      <button style={btnStyle} onClick={() => callDemo('reset')} aria-label={t('demo.reset')}>⏮ {t('demo.reset')}</button>
      <button style={btnStyle} onClick={() => callDemo('prev')} aria-label="Previous step">‹ Prev</button>
      <button style={btnStyle} onClick={() => callDemo('next')} aria-label={t('demo.next')}>{t('demo.next')} ›</button>
      <button
        style={{ ...btnStyle, background: isAutoPlaying ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: isAutoPlaying ? '#ef4444' : '#22c55e', borderColor: isAutoPlaying ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)' }}
        onClick={toggleAutoPlay}
        aria-pressed={isAutoPlaying}
      >
        {isAutoPlaying ? `⏸ ${t('demo.stop')}` : `▶ ${t('demo.auto')}`}
      </button>
      <button style={{ ...btnStyle, color: 'var(--color-accent-danger)' }} onClick={stopDemo} aria-label={t('demo.disable')}>✕</button>
    </div>
  );
}
