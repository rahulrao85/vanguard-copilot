import { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoleStore } from './store/useRoleStore';
import { useStadiumStore } from './store/useStadiumStore';
import { useTelemetry } from './hooks/useTelemetry';
import { apiClient } from './api/client';
import { STADIUMS } from './theme';
import RoleSwitcher from './components/RoleSwitcher';
import DemoControls from './components/DemoControls';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import NationsBanner from './components/NationsBanner';
import type { HealthResponse } from './types';
import type { TelemetryState } from './hooks/useTelemetry';

const FanDashboard = lazy(() => import('./components/FanDashboard'));
const OrganizerDashboard = lazy(() => import('./components/OrganizerDashboard'));
const VolunteerDashboard = lazy(() => import('./components/VolunteerDashboard'));
const StaffDashboard = lazy(() => import('./components/StaffDashboard'));

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
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* noop */ }
}

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
];

export default function App() {
  const { i18n } = useTranslation();
  const { persona } = useRoleStore();
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [healthStatus, setHealthStatus] = useState<string>('loading');
  const [demoState, setDemoState] = useState<TelemetryState | null>(null);
  const { selectedStadium, setStadium } = useStadiumStore();
  const { telemetry, isConnected } = useTelemetry(!demoState);
  const activeTelemetry = demoState ?? telemetry;
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    let cancelled = false;
    apiClient.health()
      .then((data: HealthResponse) => { if (!cancelled) setHealthStatus(data.status || 'healthy'); })
      .catch(() => { if (!cancelled) setHealthStatus('degraded'); });
    return () => { cancelled = true; };
  }, []);

  const isHealthy = healthStatus === 'healthy';
  const isLoading = healthStatus === 'loading';

  const dashboard = (() => {
    switch (persona) {
      case 'fan': return <FanDashboard telemetry={activeTelemetry} isConnected={isConnected} />;
      case 'organizer': return <OrganizerDashboard telemetry={activeTelemetry} isConnected={isConnected} />;
      case 'volunteer': return <VolunteerDashboard telemetry={activeTelemetry} isConnected={isConnected} />;
      case 'staff': return <StaffDashboard telemetry={activeTelemetry} isConnected={isConnected} demoState={demoState} onDemoStateChange={setDemoState} />;
    }
  })();

  return (
    <div className="app-shell" dir={dir}>
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <header className="app-header" role="banner">
        <div className="header-left">
          <div className="header-brand">
            <span className="header-emoji" aria-hidden="true">{'\u26BD'}</span>
            <h1 className="header-title">Vanguard Co-Pilot</h1>
          </div>
          <p className="header-subtitle">FIFA World Cup 2026</p>
        </div>

        <div className="header-center">
          <RoleSwitcher />
        </div>

        <div className="header-right">
          {/* Language selector */}
          <select
            className="header-select header-select-lang"
            value={i18n.language.split('-')[0]}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label="Select language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          {/* Stadium selector */}
          <select
            className="header-select"
            value={selectedStadium.id}
            onChange={(e) => {
              const found = STADIUMS.find((s) => s.id === e.target.value);
              if (found) setStadium(found);
            }}
            aria-label="Select stadium"
          >
            {STADIUMS.map((s) => (
              <option key={s.id} value={s.id}>
                [{s.country}] {s.name}
              </option>
            ))}
          </select>

          {/* Demo mode - only for staff/org */}
          {(persona === 'staff' || persona === 'organizer') && (
            <DemoControls demoState={demoState} onStateChange={setDemoState} />
          )}

          <button
            type="button"
            className="header-theme-btn"
            onClick={() => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>

          <div className="health-indicator" aria-live="polite">
            <span className={`health-dot ${isLoading ? 'loading' : isHealthy ? 'healthy' : 'degraded'}`}
              role="status"
              aria-label={isLoading ? 'Checking system status' : isHealthy ? 'System healthy' : 'System degraded'}
            />
            <span className="health-label">
              {isLoading ? 'Checking...' : isHealthy ? 'Operational' : 'Degraded'}
            </span>
          </div>
        </div>
      </header>

      <div className="stadium-bar" aria-label="Current stadium info">
        <span className={`country-badge country-${selectedStadium.country.toLowerCase().replace(/\s+/g, '-')}`}>
          {selectedStadium.country}
        </span>
        <span className="stadium-name">{selectedStadium.name}</span>
        <span className="stadium-sep">&mdash;</span>
        <span className="stadium-meta">{selectedStadium.city}, {selectedStadium.country}</span>
        <span className="stadium-sep">&bull;</span>
        <span className="stadium-meta">{selectedStadium.capacity.toLocaleString()} capacity</span>
        <span className="stadium-sep">&bull;</span>
        <span className="stadium-role">{selectedStadium.role}</span>
      </div>

      <NationsBanner />

      <main id="main-content" className="app-main" role="main">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner label="Loading dashboard..." size="lg" />}>
            {dashboard}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
