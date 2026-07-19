import { useTranslation } from 'react-i18next';
import { useStadiumStore } from '../store/useStadiumStore';
import CrowdHeatmap from './CrowdHeatmap';
import type { TelemetryState } from '../hooks/useTelemetry';

interface Props {
  telemetry: TelemetryState | null;
  isConnected: boolean;
}

export default function OrganizerDashboard({ telemetry, isConnected }: Props) {
  const { t } = useTranslation();
  const { selectedStadium } = useStadiumStore();

  const gatesRecord = telemetry?.gates ?? {};
  const gateList = Object.entries(gatesRecord).map(([id, occupancy]) => ({ id, occupancy }));
  const avgOccupancy = gateList.length
    ? Math.round(gateList.reduce((s, g) => s + g.occupancy, 0) / gateList.length)
    : 0;
  const highTraffic = gateList.filter((g) => g.occupancy > 80).length;
  const status = avgOccupancy > 75 ? t('org.critical') : avgOccupancy > 50 ? t('org.moderate') : t('org.normal');

  const summary = [
    { label: t('org.avgOccupancy'), value: `${avgOccupancy}%` },
    { label: t('org.highTraffic'), value: highTraffic.toString() },
    { label: t('org.status'), value: status },
    { label: t('org.venue'), value: selectedStadium.name },
  ];

  return (
    <div className="dashboard-organizer">
      <section className="org-summary" aria-label="Command overview">
        <h2>{t('org.commandCenter', { stadium: selectedStadium.name })}</h2>
        <div className="org-kpi-grid">
          {summary.map((s) => (
            <div key={s.label} className="kpi-card">
              <span className="kpi-value">{s.value}</span>
              <span className="kpi-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card org-heatmap">
        <h3>{t('org.crowdHeatmap')}</h3>
        <CrowdHeatmap telemetry={telemetry} isConnected={isConnected} />
      </section>

      <section className="card org-incidents" aria-label="Incident board">
        <h3>{t('org.incidents')}</h3>
        <table className="incident-table" aria-label={t('org.incidentList')}>
          <thead>
            <tr>
              <th>{t('org.gate')}</th>
              <th>{t('org.occupancy')}</th>
              <th>{t('org.status')}</th>
            </tr>
          </thead>
          <tbody>
            {gateList.slice(0, 8).map((g) => (
              <tr key={g.id}>
                <td>{g.id}</td>
                <td>{g.occupancy}%</td>
                <td>
                  <span className={`status-badge${g.occupancy > 80 ? ' danger' : g.occupancy > 60 ? ' warning' : ' ok'}`}>
                    {g.occupancy > 80 ? t('org.critical') : g.occupancy > 60 ? t('org.moderate') : t('org.normal')}
                  </span>
                </td>
              </tr>
            ))}
            {gateList.length === 0 && (
              <tr><td colSpan={3} className="empty-state">{t('org.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
