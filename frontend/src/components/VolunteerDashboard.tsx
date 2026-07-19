import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';
import OnboardingBanner from './OnboardingBanner';
import CrowdHeatmap from './CrowdHeatmap';
import PlayerCard from './PlayerCard';
import AIChat from './AIChat';
import type { TelemetryState } from '../hooks/useTelemetry';

const CalculatePanel = lazy(() => import('./CalculatePanel'));
const EntryLogPanel = lazy(() => import('./EntryLogPanel'));
const InsightsPanel = lazy(() => import('./InsightsPanel'));
const JuryUploadPanel = lazy(() => import('./JuryUploadPanel'));

type TabKey = 'calculate' | 'entry' | 'insights' | 'jury';

interface Props {
  telemetry: TelemetryState | null;
  isConnected: boolean;
}

export default function VolunteerDashboard({ telemetry, isConnected }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('calculate');

  const TABS: { key: TabKey; labelKey: string; icon: string }[] = [
    { key: 'calculate', labelKey: 'tab.understand', icon: '\uD83E\uDDEE' },
    { key: 'entry', labelKey: 'tab.track', icon: '\uD83D\uDCCB' },
    { key: 'insights', labelKey: 'tab.reduce', icon: '\uD83E\uDDE0' },
    { key: 'jury', labelKey: 'tab.jury', icon: '\uD83D\uDCE4' },
  ];

  const panelComponent = (() => {
    switch (activeTab) {
      case 'calculate': return <CalculatePanel />;
      case 'entry': return <EntryLogPanel />;
      case 'insights': return <InsightsPanel />;
      case 'jury': return <JuryUploadPanel />;
    }
  })();

  return (
    <div className="dashboard-volunteer">
      <nav className="vol-nav" aria-label="Phase navigation">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`vol-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key ? 'page' : undefined}
            type="button"
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{t(tab.labelKey)}</span>
          </button>
        ))}
      </nav>

      <OnboardingBanner />

      <CrowdHeatmap telemetry={telemetry} isConnected={isConnected} />

      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner label="Loading panel..." size="lg" />}>
          {panelComponent}
        </Suspense>
      </ErrorBoundary>

      <PlayerCard />
      <AIChat />
    </div>
  );
}
