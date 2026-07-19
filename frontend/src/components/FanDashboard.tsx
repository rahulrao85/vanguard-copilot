import { useTranslation } from 'react-i18next';
import { useStadiumStore } from '../store/useStadiumStore';
import CrowdHeatmap from './CrowdHeatmap';
import AIChat from './AIChat';
import type { TelemetryState } from '../hooks/useTelemetry';

interface Props {
  telemetry: TelemetryState | null;
  isConnected: boolean;
}

export default function FanDashboard({ telemetry, isConnected }: Props) {
  const { t } = useTranslation();
  const { selectedStadium } = useStadiumStore();

  return (
    <div className="dashboard-fan">
      <section className="fan-greeting" aria-label="Welcome">
        <h2>{t('fan.welcome', { stadium: selectedStadium.name })}</h2>
        <p>{t('fan.subtitle')}</p>
      </section>

      <div className="fan-grid">
        <div className="card fan-info">
          <h3>{t('fan.stadiumInfo')}</h3>
          <dl>
            <dt>{t('fan.capacity')}</dt>
            <dd>{selectedStadium.capacity.toLocaleString()}</dd>
            <dt>{t('fan.location')}</dt>
            <dd>{selectedStadium.city}, {selectedStadium.country}</dd>
            <dt>{t('fan.matchRole')}</dt>
            <dd>{selectedStadium.role}</dd>
          </dl>
        </div>

        <div className="card fan-quick-actions">
          <h3>{t('fan.quickActions')}</h3>
          <ul>
            <li><span aria-hidden="true">{'\uD83C\uDF7D\uFE0F'}</span> {t('fan.findFood')}</li>
            <li><span aria-hidden="true">{'\uD83D\uDEAA'}</span> {t('fan.nearbyGate')}</li>
            <li><span aria-hidden="true">{'\uD83D\uDE8C'}</span> {t('fan.transport')}</li>
            <li><span aria-hidden="true">{'\uD83D\uDE91'}</span> {t('fan.emergency')}</li>
          </ul>
        </div>
      </div>

      <section className="card fan-crowd">
        <h3>{t('fan.crowdStatus')}</h3>
        <CrowdHeatmap telemetry={telemetry} isConnected={isConnected} />
      </section>

      <AIChat />
    </div>
  );
}
