import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../src/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders with clear status (green color via CSS)', () => {
    render(<StatusBadge status="clear" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Clear');
    expect(badge).toHaveAttribute('aria-label', 'Clear: clear');
    expect(badge).toHaveStyle({ color: 'var(--color-accent-success)' });
  });

  it('renders with critical status (red color via CSS)', () => {
    render(<StatusBadge status="critical" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Critical');
    expect(badge).toHaveAttribute('aria-label', 'Critical: critical');
    expect(badge).toHaveStyle({ color: 'var(--color-accent-danger)' });
  });

  it('renders with moderate status (amber/yellow via CSS)', () => {
    render(<StatusBadge status="moderate" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Moderate');
    expect(badge).toHaveStyle({ color: 'var(--color-accent-warning)' });
  });

  it('renders with custom label override', () => {
    render(<StatusBadge status="critical" label="Overloaded" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Overloaded');
    expect(badge).toHaveAttribute('aria-label', 'Overloaded: critical');
  });

  it('has appropriate ARIA role', () => {
    render(<StatusBadge status="info" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with busy status', () => {
    render(<StatusBadge status="busy" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Busy');
  });

  it('falls back to info style for unknown status', () => {
    render(<StatusBadge status="unknown_value" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveStyle({ color: 'var(--color-accent-primary)' });
  });

  it('merges custom style prop', () => {
    render(<StatusBadge status="clear" style={{ fontSize: '2rem' }} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveStyle({ fontSize: '2rem' });
  });
});
