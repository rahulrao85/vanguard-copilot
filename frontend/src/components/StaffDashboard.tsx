import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStadiumStore } from '../store/useStadiumStore';
import DemoControls from './DemoControls';
import type { TelemetryState } from '../hooks/useTelemetry';

interface Props {
  telemetry: TelemetryState | null;
  isConnected: boolean;
  demoState: TelemetryState | null;
  onDemoStateChange: (s: TelemetryState | null) => void;
}

export default function StaffDashboard({ telemetry, demoState, onDemoStateChange }: Props) {
  const { t } = useTranslation();
  const { selectedStadium } = useStadiumStore();
  const [dispatchMsg, setDispatchMsg] = useState('');

  const gatesRecord = telemetry?.gates ?? {};
  const gateList = Object.entries(gatesRecord).map(([id, occupancy]) => ({ id, occupancy }));

  const criticalGates = gateList.filter((g) => g.occupancy > 80);
  const urgentAlerts = criticalGates.map((g) => ({
    gate: g.id,
    occupancy: g.occupancy,
    message: t('staff.alertMessage', { gate: g.id, occ: g.occupancy }),
  }));

  return (
    <div className="dashboard-staff">
      <section className="staff-alerts" aria-label="Alerts">
        <h2>{t('staff.operationsHub', { stadium: selectedStadium.name })}</h2>
        <DemoControls demoState={demoState} onStateChange={onDemoStateChange} />
      </section>

      <div className="staff-grid">
        <section className="card staff-critical" aria-label="Critical alerts">
          <h3>{t('staff.alerts')} ({urgentAlerts.length})</h3>
          {urgentAlerts.length === 0 ? (
            <p className="empty-state">{t('staff.noAlerts')}</p>
          ) : (
            <ul className="alert-list">
              {urgentAlerts.map((a) => (
                <li key={a.gate} className="alert-item critical">
                  <span className="alert-icon" aria-hidden="true">{'\u26A0\uFE0F'}</span>
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card staff-dispatch" aria-label="Dispatch panel">
          <h3>{t('staff.dispatch')}</h3>
          <div className="dispatch-form">
            <label htmlFor="dispatch-input">{t('staff.dispatchLabel')}</label>
            <div className="dispatch-row">
              <input
                id="dispatch-input"
                type="text"
                value={dispatchMsg}
                onChange={(e) => setDispatchMsg(e.target.value)}
                placeholder={t('staff.dispatchPlaceholder')}
                aria-label={t('staff.dispatchLabel')}
              />
              <button type="button" className="btn-primary" disabled={!dispatchMsg.trim()}>
                {t('staff.send')}
              </button>
            </div>
          </div>
        </section>

        <section className="card staff-gate-status" aria-label="Gate status">
          <h3>{t('staff.gateStatus')}</h3>
          <table className="incident-table" aria-label={t('staff.gateTable')}>
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
    </div>
  );
}
