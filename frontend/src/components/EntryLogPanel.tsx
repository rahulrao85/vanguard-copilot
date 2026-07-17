import React, { useEffect, useId, useState } from 'react';
import { useEntriesStore } from '../store/useEntriesStore';
import { getDeviceId } from '../utils/device';
import type { EntryResponse } from '../types';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';

const ACTIVITY_TYPES = [
  { value: 'crowd_report', label: 'Crowd Report' },
  { value: 'incident_log', label: 'Incident Log' },
  { value: 'shift_checkin', label: 'Shift Check-In' },
  { value: 'facility_issue', label: 'Facility Issue' },
  { value: 'fan_assist', label: 'Fan Assist' },
  { value: 'other', label: 'Other' },
] as const;

const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
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
  } as React.CSSProperties,
  deviceBanner: {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    alignSelf: 'flex-start',
  } as React.CSSProperties,
  deviceCode: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-accent-primary)',
    fontSize: '0.75rem',
  } as React.CSSProperties,
  entriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  entryCard: {
    padding: '1rem',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  } as React.CSSProperties,
  entryBadges: {
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  entryDesc: {
    fontSize: '0.88rem',
    color: 'var(--color-text-primary)',
    lineHeight: 1.5,
  } as React.CSSProperties,
  entryMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.72rem',
    color: 'var(--color-text-muted)',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  emptyState: {
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-lg)',
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

export default function EntryLogPanel() {
  const activityId = useId();
  const severityId = useId();
  const locationId = useId();
  const descId = useId();

  const deviceId = getDeviceId();

  const [activityType, setActivityType] = useState('crowd_report');
  const [severity, setSeverity] = useState('info');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const { entries, isLoading, error, createEntry, fetchEntries } =
    useEntriesStore();

  useEffect(() => {
    fetchEntries().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createEntry({
        activity_type: activityType,
        severity,
        description,
        location: location || undefined,
      });
      setDescription('');
      setLocation('');
    } catch {
      // error stored in store
    }
  }

  function formatTime(ts: string): string {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  }

  return (
    <section style={S.section} aria-label="Activity log entries">
      <div>
        <h2 style={S.heading}>⚽ Activity Log Entry</h2>
        <p style={S.subheading}>
          Phase 2 &mdash; Record volunteer activity at the stadium
        </p>
      </div>

      <div style={S.deviceBanner} aria-label="Current device identifier">
        Device: <span style={S.deviceCode}>{deviceId}</span>
      </div>

      <form style={S.form} onSubmit={handleSubmit}>
        <div style={S.field}>
          <label htmlFor={activityId} style={S.label}>
            Activity Type
          </label>
          <select
            id={activityId}
            style={S.select}
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            required
          >
            {ACTIVITY_TYPES.map((at) => (
              <option key={at.value} value={at.value}>
                {at.label}
              </option>
            ))}
          </select>
        </div>

        <div style={S.field}>
          <label htmlFor={severityId} style={S.label}>
            Severity
          </label>
          <select
            id={severityId}
            style={S.select}
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            required
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div style={S.field}>
          <label htmlFor={locationId} style={S.label}>
            Location
          </label>
          <input
            id={locationId}
            style={S.input}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Gate A, Section 12"
            maxLength={256}
          />
        </div>

        <div style={S.field}>
          <label htmlFor={descId} style={S.label}>
            Description
          </label>
          <textarea
            id={descId}
            style={S.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the activity or observation..."
            required
            maxLength={8192}
            rows={4}
          />
        </div>

        <button
          type="submit"
          style={S.btnPrimary}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Entry'}
        </button>
      </form>

      {error && (
        <div style={S.errorBox} role="alert">
          {error}
        </div>
      )}

      <div aria-live="polite" aria-label="Activity log entries list">
        <h3 style={S.heading}>Past Entries</h3>

        {isLoading && <LoadingSpinner label="Loading entries..." size="sm" />}

        {!isLoading && entries.length === 0 && (
          <p style={S.emptyState}>No activity logs recorded yet</p>
        )}

        {!isLoading && entries.length > 0 && (
          <div style={S.entriesList}>
            {entries.map((entry: EntryResponse) => (
              <article key={entry.entry_id} style={S.entryCard}>
                <div style={S.entryHeader}>
                  <div style={S.entryBadges}>
                    <StatusBadge status={entry.activity_type} />
                    <StatusBadge status={entry.severity} />
                  </div>
                </div>
                <p style={S.entryDesc}>{entry.description}</p>
                <div style={S.entryMeta}>
                  {entry.location && <span>Location: {entry.location}</span>}
                  <span>{formatTime(entry.created_at)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    #{entry.entry_id?.slice(0, 8)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
