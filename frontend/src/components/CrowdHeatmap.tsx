import { memo } from 'react';
import type { TelemetryState } from '../hooks/useTelemetry';
import { useTranslation } from 'react-i18next';

const COLS = 4;
const ROWS = 4;

function occupancyColor(pct: number): string {
  // green (0%) → yellow (50%) → red (100%)
  const r = Math.round(Math.min(255, (pct / 50) * 255));
  const g = Math.round(Math.min(255, ((100 - pct) / 50) * 255));
  return `rgb(${r},${g},30)`;
}

interface Props {
  telemetry: TelemetryState | null;
  isConnected: boolean;
}

const CrowdHeatmap = memo(function CrowdHeatmap({ telemetry, isConnected }: Props) {
  const { t } = useTranslation();
  const gates = telemetry?.gates ?? {};
  const gateEntries = Object.entries(gates);

  return (
    <section
      aria-label={t('stadium.heatmap')}
      style={{
        padding: '1.5rem',
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          🗺️ {t('stadium.heatmap')}
        </h2>
        <span
          aria-live="polite"
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            background: isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: isConnected ? '#22c55e' : '#ef4444',
            border: `1px solid ${isConnected ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          }}
        >
          {isConnected ? '● LIVE' : '○ Connecting...'}
        </span>
      </div>

      {gateEntries.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
          Awaiting telemetry data...
        </p>
      ) : (
        <div
          role="grid"
          aria-label="Stadium gate occupancy grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gap: '0.5rem',
          }}
        >
          {gateEntries.slice(0, COLS * ROWS).map(([gateId, pct]) => (
            <div
              key={gateId}
              role="gridcell"
              aria-label={`${t('stadium.gate')} ${gateId}: ${pct}%`}
              style={{
                background: occupancyColor(pct),
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 0.25rem',
                textAlign: 'center',
                transition: 'background 0.6s ease',
                cursor: 'default',
              }}
              title={`${t('stadium.gate')} ${gateId}: ${pct.toFixed(1)}%`}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', opacity: 0.85 }}>
                {gateId}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                {pct.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>Low</span>
        <div style={{ background: 'linear-gradient(to right, rgb(0,255,30), rgb(255,255,30), rgb(255,0,30))', height: 8, width: 80, borderRadius: 4 }} aria-hidden="true" />
        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>High</span>
      </div>
    </section>
  );
});

export default CrowdHeatmap;
