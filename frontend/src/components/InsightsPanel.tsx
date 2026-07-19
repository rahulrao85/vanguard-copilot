import React, { memo, useEffect, useId, useState } from 'react';
import { useInsightsStore } from '../store/useInsightsStore';
import { useStadiumStore } from '../store/useStadiumStore';
import { STADIUMS, LANGUAGES, GATES_BY_STADIUM } from '../theme';
import type { GateData, InsightsRequest } from '../types';
import LoadingSpinner from './LoadingSpinner';

const CONTEXT_OPTIONS = [
  { value: 'crowd_routing', label: 'Crowd Routing' },
  { value: 'fan_translation', label: 'Fan Translation' },
  { value: 'facility_alert', label: 'Facility Alert' },
  { value: 'ticketing_support', label: 'Ticketing Support' },
] as const;

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
  } as React.CSSProperties,
  subheading: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    marginTop: '0.15rem',
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
  row: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: '1 1 200px',
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
    alignSelf: 'flex-start',
    transition: 'opacity 0.2s ease',
  } as React.CSSProperties,
  btnToggle: {
    padding: '0.4rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  } as React.CSSProperties,
  gateRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  gateField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    flex: '1 1 130px',
  } as React.CSSProperties,
  resultCard: {
    padding: '1.5rem',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  megaphoneCard: {
    padding: '1.25rem',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderLeft: '4px solid var(--color-accent-warning)',
  } as React.CSSProperties,
  megaphoneLabel: {
    fontSize: '0.7rem',
    color: 'var(--color-accent-warning)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: '0.5rem',
    display: 'block',
  } as React.CSSProperties,
  megaphoneScript: {
    fontSize: '0.95rem',
    color: 'var(--color-text-primary)',
    lineHeight: 1.7,
    fontStyle: 'italic',
    whiteSpace: 'pre-wrap',
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
    marginBottom: '0.4rem',
  } as React.CSSProperties,
  reasoningText: {
    fontSize: '0.88rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.7,
  } as React.CSSProperties,
  recList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  } as React.CSSProperties,
  recItem: {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(59, 130, 246, 0.06)',
    border: '1px solid var(--color-border)',
    fontSize: '0.85rem',
    color: 'var(--color-text-primary)',
  } as React.CSSProperties,
  errorBox: {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--color-accent-danger)',
    fontSize: '0.85rem',
  } as React.CSSProperties,
};

interface InsightGateRowProps {
  gate: GateData;
  index: number;
  stadiumGates: Array<{ id: string; label: string }>;
  totalRows: number;
  onUpdate: (index: number, field: keyof GateData, value: string | number) => void;
  onRemove: (index: number) => void;
}

const InsightGateRowComponent = memo(function InsightGateRowComponent({
  gate, index, stadiumGates, totalRows, onUpdate, onRemove,
}: InsightGateRowProps) {
  return (
    <div style={{ ...S.gateRow, marginBottom: '0.5rem' }}>
      <div style={S.gateField}>
        <label htmlFor={`insight-gate-${index}-id`} style={{ ...S.label, fontSize: '0.7rem' }}>
          Gate ID
        </label>
        <select
          id={`insight-gate-${index}-id`}
          style={S.select}
          value={gate.gate_id}
          onChange={(e) => onUpdate(index, 'gate_id', e.target.value)}
          aria-label={`Insight gate ${index + 1} identifier`}
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
        <label htmlFor={`insight-gate-${index}-count`} style={{ ...S.label, fontSize: '0.7rem' }}>
          Sensor Count
        </label>
        <input
          id={`insight-gate-${index}-count`}
          style={S.input}
          type="number"
          value={gate.sensor_count}
          onChange={(e) => onUpdate(index, 'sensor_count', Number(e.target.value))}
          placeholder="0"
          min={0}
          max={100000}
          aria-label={`Insight gate ${index + 1} sensor count`}
        />
      </div>
      <div style={S.gateField}>
        <label htmlFor={`insight-gate-${index}-cap`} style={{ ...S.label, fontSize: '0.7rem' }}>
          Capacity
        </label>
        <input
          id={`insight-gate-${index}-cap`}
          style={S.input}
          type="number"
          value={gate.capacity}
          onChange={(e) => onUpdate(index, 'capacity', Number(e.target.value))}
          placeholder="1000"
          min={1}
          max={200000}
          aria-label={`Insight gate ${index + 1} capacity`}
        />
      </div>
      {totalRows > 1 && (
        <button
          type="button"
          style={{
            ...S.btnToggle,
            color: 'var(--color-accent-danger)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            marginBottom: '0.15rem',
          }}
          onClick={() => onRemove(index)}
          aria-label={`Remove insight gate ${gate.gate_id}`}
        >
          Remove
        </button>
      )}
    </div>
  );
});

export default function InsightsPanel() {
  const stadiumIdId = useId();
  const contextId = useId();
  const langId = useId();
  const inputId = useId();

  const { selectedStadium, setStadium } = useStadiumStore();
  const stadiumGates = GATES_BY_STADIUM[selectedStadium.id] ?? [];
  const defaultGate = stadiumGates[0];
  const [contextType, setContextType] = useState<InsightsRequest['context_type']>('crowd_routing');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [inputText, setInputText] = useState('');
  const [showGateData, setShowGateData] = useState(false);
  const [gateRows, setGateRows] = useState<GateData[]>([
    { gate_id: defaultGate?.id ?? '', sensor_count: 0, capacity: 1000 },
  ]);

  const { insightResult, isLoading, error, generateInsights, clearInsights } =
    useInsightsStore();

  useEffect(() => {
    const gates = GATES_BY_STADIUM[selectedStadium.id] ?? [];
    const first = gates[0];
    setGateRows([
      { gate_id: first?.id ?? '', sensor_count: 0, capacity: 1000 },
    ]);
  }, [selectedStadium.id]);

  function addGateRow() {
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

  function removeGateRow(index: number) {
    setGateRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGateRow(
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
      await generateInsights({
        stadium_id: selectedStadium.id,
        context_type: contextType,
        input_text: inputText,
        target_language: targetLanguage,
        gate_data: showGateData ? gateRows : undefined,
      });
    } catch {
      // error stored in store
    }
  }

  const result = insightResult;

  return (
    <section style={S.section} aria-label="AI insights generator">
      <div>
        <h2 style={S.heading}>⚽ AI Insights</h2>
        <p style={S.subheading}>
          Phase 3 &mdash; Gemini-powered crowd routing, fan translation, and facility alerts
        </p>
      </div>

      <form style={S.form} onSubmit={handleSubmit}>
        <div style={S.row}>
          <div style={S.field}>
            <label htmlFor={stadiumIdId} style={S.label}>
              Stadium
            </label>
            <select
              id={stadiumIdId}
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
            <label htmlFor={contextId} style={S.label}>
              Context Type
            </label>
            <select
              id={contextId}
              style={S.select}
              value={contextType}
              onChange={(e) => setContextType(e.target.value as InsightsRequest['context_type'])}
              required
            >
              {CONTEXT_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div style={S.field}>
            <label htmlFor={langId} style={S.label}>
              Target Language
            </label>
            <select
              id={langId}
              style={S.select}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              required
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={S.field}>
          <label htmlFor={inputId} style={S.label}>
            Input Context / Query
          </label>
          <textarea
            id={inputId}
            style={S.textarea}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe the situation, provide context, or enter text to translate..."
            required
            maxLength={8192}
            rows={4}
          />
        </div>

        <button
          type="button"
          style={S.btnToggle}
          onClick={() => setShowGateData((p) => !p)}
          aria-expanded={showGateData}
          aria-controls="gate-data-section"
        >
          {showGateData ? '- Hide Gate Data' : '+ Add Gate Data (Optional)'}
        </button>

        {showGateData && (
          <div id="gate-data-section">
            {gateRows.map((gate, idx) => (
              <InsightGateRowComponent
                key={idx}
                gate={gate}
                index={idx}
                stadiumGates={stadiumGates}
                totalRows={gateRows.length}
                onUpdate={updateGateRow}
                onRemove={removeGateRow}
              />
            ))}
            <button type="button" style={S.btnToggle} onClick={addGateRow}>
              + Add Gate
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            style={S.btnPrimary}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Insights'}
          </button>
          {result && (
            <button
              type="button"
              style={S.btnToggle}
              onClick={clearInsights}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <div style={S.errorBox} role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <LoadingSpinner label="Generating AI insights..." size="lg" />
      )}

      {result && (
        <div style={S.resultCard} aria-live="polite" aria-label="AI insight results">
          <div style={S.megaphoneCard}>
            <span style={S.megaphoneLabel}>
              Megaphone Script
              {result.target_language !== 'en' &&
                ` (${result.target_language})`}
            </span>
            <p style={S.megaphoneScript}>{result.megaphone_script}</p>
          </div>

          <div>
            <span style={S.sectionLabel}>Reasoning</span>
            <p style={S.reasoningText}>{result.reasoning}</p>
          </div>

          {result.recommendations.length > 0 && (
            <div>
              <span style={S.sectionLabel}>Recommendations</span>
              <ul style={S.recList}>
                {result.recommendations.map((rec, i) => (
                  <li key={i} style={S.recItem}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.5rem',
            }}
          >
            Timestamp: {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </section>
  );
}
