import React from 'react';

interface StatusBadgeProps {
  status: 'clear' | 'moderate' | 'busy' | 'critical' | 'info' | 'warning' | 'error' | string;
  label?: string;
  style?: React.CSSProperties;
}

const STATUS_MAP: Record<
  string,
  { bg: string; text: string; border: string; defaultLabel: string }
> = {
  clear: {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: 'var(--color-accent-success)',
    border: 'rgba(16, 185, 129, 0.3)',
    defaultLabel: 'Clear',
  },
  moderate: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: 'var(--color-accent-warning)',
    border: 'rgba(245, 158, 11, 0.3)',
    defaultLabel: 'Moderate',
  },
  busy: {
    bg: 'rgba(249, 115, 22, 0.12)',
    text: '#f97316',
    border: 'rgba(249, 115, 22, 0.3)',
    defaultLabel: 'Busy',
  },
  critical: {
    bg: 'rgba(239, 68, 68, 0.12)',
    text: 'var(--color-accent-danger)',
    border: 'rgba(239, 68, 68, 0.3)',
    defaultLabel: 'Critical',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.12)',
    text: 'var(--color-accent-primary)',
    border: 'rgba(59, 130, 246, 0.3)',
    defaultLabel: 'Info',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: 'var(--color-accent-warning)',
    border: 'rgba(245, 158, 11, 0.3)',
    defaultLabel: 'Warning',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.12)',
    text: 'var(--color-accent-danger)',
    border: 'rgba(239, 68, 68, 0.3)',
    defaultLabel: 'Error',
  },
  crowd_report: {
    bg: 'rgba(59, 130, 246, 0.12)',
    text: 'var(--color-accent-primary)',
    border: 'rgba(59, 130, 246, 0.3)',
    defaultLabel: 'Crowd Report',
  },
  incident_log: {
    bg: 'rgba(239, 68, 68, 0.12)',
    text: 'var(--color-accent-danger)',
    border: 'rgba(239, 68, 68, 0.3)',
    defaultLabel: 'Incident',
  },
  shift_checkin: {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: 'var(--color-accent-success)',
    border: 'rgba(16, 185, 129, 0.3)',
    defaultLabel: 'Shift Checkin',
  },
  facility_issue: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: 'var(--color-accent-warning)',
    border: 'rgba(245, 158, 11, 0.3)',
    defaultLabel: 'Facility Issue',
  },
  fan_assist: {
    bg: 'rgba(99, 102, 241, 0.12)',
    text: 'var(--color-accent-secondary)',
    border: 'rgba(99, 102, 241, 0.3)',
    defaultLabel: 'Fan Assist',
  },
  other: {
    bg: 'rgba(148, 163, 184, 0.12)',
    text: 'var(--color-text-secondary)',
    border: 'rgba(148, 163, 184, 0.3)',
    defaultLabel: 'Other',
  },
};

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.6rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  lineHeight: 1.4,
  border: '1px solid transparent',
  whiteSpace: 'nowrap',
};

export default function StatusBadge({
  status,
  label,
  style,
}: StatusBadgeProps) {
  const mapping = STATUS_MAP[status] ?? STATUS_MAP.info;
  const displayLabel = label ?? mapping.defaultLabel;

  const combinedStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: mapping.bg,
    color: mapping.text,
    borderColor: mapping.border,
    ...style,
  };

  return (
    <span
      style={combinedStyle}
      role="status"
      aria-label={`${displayLabel}: ${status}`}
    >
      {displayLabel}
    </span>
  );
}
