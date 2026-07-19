import { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import NationsBanner from './components/NationsBanner';
import OnboardingBanner from './components/OnboardingBanner';
import PlayerCard from './components/PlayerCard';
import AIChat from './components/AIChat';
import CrowdHeatmap from './components/CrowdHeatmap';
import DemoControls from './components/DemoControls';
import { apiClient } from './api/client';
import { STADIUMS } from './theme';
import { useStadiumStore } from './store/useStadiumStore';
import { useTelemetry } from './hooks/useTelemetry';
import type { HealthResponse } from './types';
import type { TelemetryState } from './hooks/useTelemetry';

const CalculatePanel = lazy(() => import('./components/CalculatePanel'));
const EntryLogPanel = lazy(() => import('./components/EntryLogPanel'));
const InsightsPanel = lazy(() => import('./components/InsightsPanel'));
const JuryUploadPanel = lazy(() => import('./components/JuryUploadPanel'));

type TabKey = 'calculate' | 'entry' | 'insights' | 'jury';

interface TabDef {
  key: TabKey;
  label: string;
  subtitle: string;
  icon: string;
}

const TABS: TabDef[] = [
  { key: 'calculate', label: 'Understand', subtitle: 'Calculate', icon: '\uD83E\uDDEE' },
  { key: 'entry', label: 'Track', subtitle: 'Log Entry', icon: '\uD83D\uDCCB' },
  { key: 'insights', label: 'Reduce', subtitle: 'Insights', icon: '\uD83E\uDDE0' },
  { key: 'jury', label: 'Jury Upload', subtitle: 'Custom Logs', icon: '\uD83D\uDCE4' },
];

const THEME_KEY = 'vanguard-theme';

function getInitialTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* noop */ }
  return 'dark';
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch { /* noop */ }
}

const S = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    background: 'var(--color-bg-glass)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-glass)',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  } as React.CSSProperties,
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  } as React.CSSProperties,
  title: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  footballEmoji: {
    fontSize: '1.3rem',
    lineHeight: 1,
  } as React.CSSProperties,
  subtitle: {
    fontSize: '0.7rem',
    color: 'var(--color-turf-green)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    fontWeight: 600,
  } as React.CSSProperties,
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  stadiumSelect: {
    padding: '0.4rem 0.6rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
    maxWidth: 220,
  } as React.CSSProperties,
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    lineHeight: 1,
  } as React.CSSProperties,
  healthRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  healthDot: (healthy: boolean, loading: boolean): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: loading
      ? 'var(--color-accent-warning)'
      : healthy
        ? 'var(--color-accent-success)'
        : 'var(--color-accent-danger)',
    boxShadow: loading
      ? '0 0 8px var(--color-accent-warning)'
      : healthy
        ? '0 0 8px var(--color-accent-success)'
        : '0 0 8px var(--color-accent-danger)',
    display: 'inline-block',
    animation: loading ? 'football-spin 1s linear infinite' : 'none',
  }),
  healthLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
  } as React.CSSProperties,
  stadiumBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.45rem 1.5rem',
    background: 'var(--color-bg-glass)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: '0.78rem',
    color: 'var(--color-text-secondary)',
  } as React.CSSProperties,
  stadiumBarIcon: {
    fontSize: '0.9rem',
  } as React.CSSProperties,
  stadiumBarName: {
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  } as React.CSSProperties,
  nav: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.75rem 1.5rem',
    background: 'var(--color-bg-glass)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--color-border)',
    overflowX: 'auto',
  } as React.CSSProperties,
  tab: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0.5rem 1rem',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    background: active ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
    borderColor: active
      ? 'var(--color-accent-primary)'
      : 'var(--color-border)',
    color: active
      ? 'var(--color-text-primary)'
      : 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    gap: '0.1rem',
  }),
  tabMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  } as React.CSSProperties,
  tabSub: (active: boolean): React.CSSProperties => ({
    fontSize: '0.65rem',
    color: active
      ? 'var(--color-accent-primary)'
      : 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }),
  main: {
    flex: 1,
    padding: '1.5rem',
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
  } as React.CSSProperties,
};

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
];

export default function App() {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [activeTab, setActiveTab] = useState<TabKey>('calculate');
  const [healthStatus, setHealthStatus] = useState<string>('loading');
  const [demoState, setDemoState] = useState<TelemetryState | null>(null);
  const { selectedStadium, setStadium } = useStadiumStore();
  const { telemetry, isConnected } = useTelemetry(!demoState);
  const activeTelemetry = demoState ?? telemetry;
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .health()
      .then((data: HealthResponse) => {
        if (!cancelled) {
          setHealthStatus(data.status || 'healthy');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHealthStatus('degraded');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isHealthy = healthStatus === 'healthy';
  const isLoading = healthStatus === 'loading';

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  const panelComponent = (() => {
    switch (activeTab) {
      case 'calculate': return <CalculatePanel />;
      case 'entry': return <EntryLogPanel />;
      case 'insights': return <InsightsPanel />;
      case 'jury': return <JuryUploadPanel />;
      default: return null;
    }
  })();

  return (
    <div style={S.app} dir={dir}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header style={S.header} role="banner">
        <div style={S.headerRow}>
          <div style={S.headerInfo}>
            <div style={S.titleRow}>
              <span style={S.footballEmoji} aria-hidden="true">⚽</span>
              <h1 style={S.title}>Vanguard Co-Pilot</h1>
            </div>
            <p style={S.subtitle}>FIFA World Cup 2026</p>
          </div>
          <select
            style={S.stadiumSelect}
            value={selectedStadium.id}
            onChange={(e) => {
              const found = STADIUMS.find((s) => s.id === e.target.value);
              if (found) setStadium(found);
            }}
            aria-label="Select stadium"
          >
            {STADIUMS.map((s) => (
              <option key={s.id} value={s.id}>
                [{s.country}] {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        <div style={S.headerActions}>
          {/* Language selector */}
          <select
            id="language-selector"
            value={i18n.language.split('-')[0]}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label="Select language"
            style={{ ...S.stadiumSelect, maxWidth: 70, fontSize: '0.75rem', fontWeight: 600 }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          {/* Demo mode toggle */}
          <DemoControls demoState={demoState} onStateChange={setDemoState} />

          <button
            type="button"
            style={S.themeBtn}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div style={S.healthRow} aria-live="polite">
            <span
              style={S.healthDot(isHealthy, isLoading)}
              role="status"
              aria-label={
                isLoading
                  ? 'Checking system status'
                  : isHealthy
                    ? 'System healthy'
                    : 'System degraded'
              }
            />
            <span style={S.healthLabel}>
              {isLoading ? 'Checking...' : isHealthy ? 'Operational' : 'Degraded'}
            </span>
          </div>
        </div>
      </header>

      <div style={S.stadiumBar} aria-label="Current stadium info">
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.15rem 0.4rem',
          borderRadius: 3,
          background: selectedStadium.country === 'Mexico' ? '#006847' : '#1a365d',
          color: '#fff',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          lineHeight: 1.2,
        }}>{selectedStadium.country}</span>
        <span style={S.stadiumBarName}>{selectedStadium.name}</span>
        <span>&mdash;</span>
        <span>{selectedStadium.city}, {selectedStadium.country}</span>
        <span>&bull;</span>
        <span>{selectedStadium.capacity.toLocaleString()} capacity</span>
        <span>&bull;</span>
        <span style={{ color: 'var(--color-trophy-gold)', fontWeight: 600 }}>{selectedStadium.role}</span>
      </div>

      <nav style={S.nav} aria-label="Phase navigation">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            style={S.tab(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key ? 'page' : undefined}
            aria-label={`${tab.label}: ${tab.subtitle}`}
            type="button"
          >
            <span style={S.tabMain}>
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </span>
            <span style={S.tabSub(activeTab === tab.key)}>
              {tab.subtitle}
            </span>
          </button>
        ))}
      </nav>

      <NationsBanner />

      <main id="main-content" style={{ ...S.main, paddingTop: '0.75rem' }} role="main" aria-label="Active panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <OnboardingBanner />
          {/* Live crowd heatmap — always visible on dashboard */}
          <CrowdHeatmap telemetry={activeTelemetry} isConnected={isConnected} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner label="Loading panel..." size="lg" />}>
                {panelComponent}
              </Suspense>
            </ErrorBoundary>
            <PlayerCard />
          </div>
        </div>
      </main>

      {/* Floating AI chat assistant */}
      <AIChat />
    </div>
  );
}
