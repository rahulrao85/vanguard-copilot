import React, { useState } from 'react';

const STORAGE_KEY = 'vanguard_onboarding_dismissed';

const S = {
  banner: {
    padding: '1rem 1.5rem',
    borderRadius: 'var(--radius-lg)',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.08))',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderLeft: '4px solid var(--color-accent-primary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  } as React.CSSProperties,
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  title: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  } as React.CSSProperties,
  badge: {
    padding: '0.15rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(59, 130, 246, 0.15)',
    color: 'var(--color-accent-primary)',
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  } as React.CSSProperties,
  close: {
    width: 28,
    height: 28,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  phases: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  phase: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.78rem',
    color: 'var(--color-text-secondary)',
  } as React.CSSProperties,
  phaseNum: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'var(--color-accent-primary)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  phaseText: {
    lineHeight: 1.3,
  } as React.CSSProperties,
};

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { /* noop */ }
  }

  return (
    <div style={S.banner} role="status" aria-label="App onboarding">
      <div style={S.header}>
        <div style={S.titleRow}>
          <span style={S.badge}>FIFA 2026</span>
          <span style={S.title}>Volunteer Operations Lifecycle</span>
        </div>
        <button
          type="button"
          style={S.close}
          onClick={handleDismiss}
          aria-label="Dismiss onboarding banner"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
      <div style={S.phases}>
        <div style={S.phase}>
          <span style={S.phaseNum}>1</span>
          <span style={S.phaseText}><strong>Understand</strong> — Calculate crowd density at each gate</span>
        </div>
        <div style={S.phase}>
          <span style={S.phaseNum}>2</span>
          <span style={S.phaseText}><strong>Track</strong> — Log volunteer activities and incidents</span>
        </div>
        <div style={S.phase}>
          <span style={S.phaseNum}>3</span>
          <span style={S.phaseText}><strong>Reduce</strong> — Get AI insights for crowd routing &amp; alerts</span>
        </div>
      </div>
    </div>
  );
}
