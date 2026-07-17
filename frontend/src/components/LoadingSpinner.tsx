import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZE_MAP: Record<string, number> = {
  sm: 20,
  md: 36,
  lg: 52,
};

const keyframes = `
@keyframes vanguard-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '2rem',
};

function spinnerStyle(size: number): React.CSSProperties {
  return {
    width: size,
    height: size,
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-accent-primary)',
    borderRadius: '50%',
    animation: 'vanguard-spin 0.8s linear infinite',
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--color-text-secondary)',
};

let injected = false;

function injectKeyframes() {
  if (typeof document === 'undefined' || injected) return;
  const styleEl = document.createElement('style');
  styleEl.textContent = keyframes;
  document.head.appendChild(styleEl);
  injected = true;
}

export default function LoadingSpinner({
  size = 'md',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  injectKeyframes();

  const px = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <div
      style={containerStyle}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <div style={spinnerStyle(px)} />
      <span style={labelStyle}>{label}</span>
    </div>
  );
}
