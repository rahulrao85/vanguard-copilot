import React, { useEffect, useId, useState } from 'react';
import { useCrowdStore } from '../store/useCrowdStore';
import { useStadiumStore } from '../store/useStadiumStore';
import { STADIUMS, GATES_BY_STADIUM } from '../theme';
import type { GateData, GateStatus } from '../types';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';

const S = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  } as React.CSSProperties,
  heading: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  subheading: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
  } as React.CSSProperties,
  input: {
    padding: '0.55rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,
  textarea: {
    padding: '0.55rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
    resize: 'vertical',
    minHeight: '5rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,
  select: {
    padding: '0.55rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,
  gateRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  gateField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    flex: '1 1 140px',
  } as React.CSSProperties,
  btnRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  btnPrimary: {
    padding: '0.6rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--color-accent-primary)',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  } as React.CSSProperties,
  btnSecondary: {
    padding: '0.55rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  resultsCard: {
    padding: '1.5rem',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  } as React.CSSProperties,
  densityWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  densityCircle: (pct: number): React.CSSProperties => {
    const color =
      pct >= 80
        ? 'var(--color-accent-danger)'
        : pct >= 60
          ? '#f97316'
          : pct >= 40
            ? 'var(--color-accent-warning)'
            : 'var(--color-accent-success)';
    return {
      width: 90,
      height: 90,
      borderRadius: '50%',
      background: `conic-gradient(${color} ${pct * 3.6}deg, var(--color-bg-secondary) ${pct * 3.6}deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    };
  },
  densityInner: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    background: 'var(--color-bg-card)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  densityValue: (pct: number): React.CSSProperties => ({
    fontSize: '1.3rem',
    fontWeight: 700,
    color:
      pct >= 80
        ? 'var(--color-accent-danger)'
        : pct >= 60
          ? '#f97316'
          : pct >= 40
            ? 'var(--color-accent-warning)'
            : 'var(--color-accent-success)',
    lineHeight: 1,
  }),
  statRow: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    marginTop: '0.75rem',
  } as React.CSSProperties,
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  } as React.CSSProperties,
  statValue: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  } as React.CSSProperties,
  gateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  gateCard: {
    padding: '1rem',
    background: 'var(--color-bg-glass)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  } as React.CSSProperties,
  gateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  gateId: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  } as React.CSSProperties,
  gatePct: {
    fontSize: '1.3rem',
    fontWeight: 700,
  } as React.CSSProperties,
  gateRec: {
    fontSize: '0.78rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
  } as React.CSSProperties,
  errorBox: {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--color-accent-danger)',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  stadiumCard: {
    padding: '1rem',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    borderLeft: '4px solid var(--color-turf-green)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  stadiumFlag: {
    fontSize: '2rem',
    lineHeight: 1,
  } as React.CSSProperties,
  stadiumInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  } as React.CSSProperties,
  stadiumName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  } as React.CSSProperties,
  stadiumMeta: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  stadiumRole: {
    padding: '0.15rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(212, 168, 83, 0.15)',
    color: 'var(--color-trophy-gold)',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  } as React.CSSProperties,
};

function densityColor(pct: number): string {
  if (pct >= 80) return 'var(--color-accent-danger)';
  if (pct >= 60) return '#f97316';
  if (pct >= 40) return 'var(--color-accent-warning)';
  return 'var(--color-accent-success)';
}

export default function CalculatePanel() {
  const stadiumId = useId();
  const { selectedStadium, setStadium } = useStadiumStore();
  const stadiumGates = GATES_BY_STADIUM[selectedStadium.id] ?? [];
  const defaultGate = stadiumGates[0];
  const [gateRows, setGateRows] = useState<GateData[]>([
    { gate_id: defaultGate?.id ?? '', sensor_count: 1200, capacity: 5000 },
  ]);
  const { calculateResult, isLoading, error, calculateCrowd, clearResult } =
    useCrowdStore();

  useEffect(() => {
    const gates = GATES_BY_STADIUM[selectedStadium.id] ?? [];
    const first = gates[0];
    setGateRows([
      { gate_id: first?.id ?? '', sensor_count: 1200, capacity: 5000 },
    ]);
  }, [selectedStadium.id]);

  function addGate() {
    setGateRows((prev) => {
      const usedIds = new Set(prev.map((g) => g.gate_id));
      const next = stadiumGates.find((g) => !usedIds.has(g.id));
      const gateId = next?.id ?? '';
      return [
        ...prev,
        { gate_id: gateId, sensor_count: 0, capacity: 1000 },
      ];
    });
  }

  function removeGate(index: number) {
    setGateRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGate(
    index: number,
    field: keyof GateData,
    value: string | number,
  ) {
    setGateRows((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await calculateCrowd({ stadium_id: selectedStadium.id, gates: gateRows });
    } catch {
      // error stored in store
    }
  }

  const result = calculateResult;

  return (
    <section style={S.section} aria-label="Crowd density calculator">
      <div>
        <h2 style={S.heading}>⚽ Crowd Density Calculator</h2>
        <p style={S.subheading}>Phase 1 &mdash; Input gate sensor data to estimate crowd distribution</p>
      </div>

      {selectedStadium && (
        <div style={S.stadiumCard} aria-label="Selected stadium details">
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.2rem 0.5rem',
            borderRadius: 4,
            background: selectedStadium.country === 'Mexico' ? '#006847' : '#1a365d',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            lineHeight: 1.3,
            flexShrink: 0,
          }}>{selectedStadium.country}</span>
          <div style={S.stadiumInfo}>
            <span style={S.stadiumName}>{selectedStadium.name}</span>
            <span style={S.stadiumMeta}>
              <span>{selectedStadium.city}, {selectedStadium.country}</span>
              <span>&bull;</span>
              <span>{selectedStadium.capacity.toLocaleString()} capacity</span>
              <span style={S.stadiumRole}>{selectedStadium.role}</span>
            </span>
          </div>
        </div>
      )}

      <form style={S.form} onSubmit={handleSubmit}>
        <div style={S.field}>
          <label htmlFor={stadiumId} style={S.label}>
            Stadium
          </label>
          <select
            id={stadiumId}
            style={S.select}
            value={selectedStadium.id}
            onChange={(e) => {
              const found = STADIUMS.find((s) => s.id === e.target.value);
              if (found) setStadium(found);
            }}
            required
          >
            {STADIUMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.country} {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        <div style={S.field}>
          <span style={S.label}>Gate Data</span>
          {gateRows.map((gate, idx) => {
            const gateLabelId = `gate-${idx}`;
            return (
              <div key={idx} style={S.gateRow}>
                <div style={S.gateField}>
                  <label htmlFor={`${gateLabelId}-id`} style={{ ...S.label, fontSize: '0.72rem' }}>
                    Gate ID
                  </label>
                  <select
                    id={`${gateLabelId}-id`}
                    style={S.select}
                    value={gate.gate_id}
                    onChange={(e) => updateGate(idx, 'gate_id', e.target.value)}
                    required
                    aria-label={`Gate ${idx + 1} identifier`}
                  >
                    <option value="" disabled>Select a gate...</option>
                    {stadiumGates.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={S.gateField}>
                  <label htmlFor={`${gateLabelId}-count`} style={{ ...S.label, fontSize: '0.72rem' }}>
                    Sensor Count
                  </label>
                  <input
                    id={`${gateLabelId}-count`}
                    style={S.input}
                    type="number"
                    value={gate.sensor_count}
                    onChange={(e) =>
                      updateGate(idx, 'sensor_count', Number(e.target.value))
                    }
                    placeholder="0"
                    required
                    min={0}
                    max={100000}
                    aria-label={`Gate ${idx + 1} sensor count`}
                  />
                </div>
                <div style={S.gateField}>
                  <label htmlFor={`${gateLabelId}-cap`} style={{ ...S.label, fontSize: '0.72rem' }}>
                    Capacity
                  </label>
                  <input
                    id={`${gateLabelId}-cap`}
                    style={S.input}
                    type="number"
                    value={gate.capacity}
                    onChange={(e) =>
                      updateGate(idx, 'capacity', Number(e.target.value))
                    }
                    placeholder="1000"
                    required
                    min={1}
                    max={200000}
                    aria-label={`Gate ${idx + 1} capacity`}
                  />
                </div>
                {gateRows.length > 1 && (
                  <button
                    type="button"
                    style={{
                      ...S.btnSecondary,
                      color: 'var(--color-accent-danger)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      marginBottom: '0.15rem',
                    }}
                    onClick={() => removeGate(idx)}
                    aria-label={`Remove gate ${gate.gate_id}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
          <div style={S.btnRow}>
            <button
              type="button"
              style={S.btnSecondary}
              onClick={addGate}
            >
              + Add Gate
            </button>
          </div>
        </div>

        <div style={S.btnRow}>
          <button
            type="submit"
            style={S.btnPrimary}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? 'Calculating...' : 'Calculate Density'}
          </button>
          {result && (
            <button type="button" style={S.btnSecondary} onClick={clearResult}>
              Clear Results
            </button>
          )}
        </div>
      </form>

      {error && (
        <div style={S.errorBox} role="alert">
          {error}
        </div>
      )}

      {isLoading && <LoadingSpinner label="Calculating crowd density..." />}

      {result && (
        <div style={S.results} aria-live="polite" aria-label="Calculation results">
          <div style={S.resultsCard}>
            <h3 style={S.heading}>
              {result.stadium_id} &mdash; Overall Density
            </h3>
            <div style={S.densityWrap}>
              <div style={S.densityCircle(result.overall_density_percent)}>
                <div style={S.densityInner}>
                  <span
                    style={S.densityValue(result.overall_density_percent)}
                    aria-label={`Overall density ${result.overall_density_percent} percent`}
                  >
                    {result.overall_density_percent}%
                  </span>
                </div>
              </div>
              <div style={S.statRow}>
                <div style={S.stat}>
                  <span style={S.statLabel}>Total People</span>
                  <span style={S.statValue}>
                    {result.total_people.toLocaleString()}
                  </span>
                </div>
                <div style={S.stat}>
                  <span style={S.statLabel}>Total Capacity</span>
                  <span style={S.statValue}>
                    {result.total_capacity.toLocaleString()}
                  </span>
                </div>
                <div style={S.stat}>
                  <span style={S.statLabel}>Timestamp</span>
                  <span style={S.statValue}>
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h3 style={S.heading}>Per-Gate Status</h3>
          <div style={S.gateGrid}>
            {result.gates.map((gate: GateStatus) => (
              <article key={gate.gate_id} style={S.gateCard}>
                <div style={S.gateHeader}>
                  <span style={S.gateId}>{gate.gate_id}</span>
                  <StatusBadge status={gate.status} />
                </div>
                <div
                  style={{
                    ...S.gatePct,
                    color: densityColor(gate.density_percent),
                  }}
                  aria-label={`${gate.gate_id} density ${gate.density_percent} percent`}
                >
                  {gate.density_percent}%
                </div>
                <p style={S.gateRec}>{gate.recommendation}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
