import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrganizerDashboard from '../src/components/OrganizerDashboard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockTelemetry = {
  gates: { A: 45, B: 82 },
  phase: 1,
  zones: {},
  concessions: {},
  timestamp: Date.now(),
};

describe('OrganizerDashboard', () => {
  it('renders command center heading', () => {
    render(<OrganizerDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/org\.commandCenter/i)).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    render(<OrganizerDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/org\.avgOccupancy/i)).toBeInTheDocument();
    expect(screen.getByText(/org\.highTraffic/i)).toBeInTheDocument();
    // org.status appears in both KPI label and table header — use getAllByText
    expect(screen.getAllByText(/org\.status/i).length).toBeGreaterThanOrEqual(2);
  });

  it('renders crowd heatmap', () => {
    render(<OrganizerDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/stadium\.heatmap/i)).toBeInTheDocument();
  });

  it('renders gate status board', () => {
    render(<OrganizerDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/org\.incidents/i)).toBeInTheDocument();
  });

  it('shows gate rows from telemetry', () => {
    render(<OrganizerDashboard telemetry={mockTelemetry} isConnected={true} />);
    // 'A' appears in both heatmap grid and table — check within the table
    const tableGates = screen.getAllByText('A').filter(el => el.tagName === 'TD');
    expect(tableGates.length).toBe(1);
    expect(screen.getAllByText('B').length).toBeGreaterThanOrEqual(1);
  });

  it('shows noData message when telemetry is null', () => {
    render(<OrganizerDashboard telemetry={null} isConnected={false} />);
    expect(screen.getByText(/org\.noData/i)).toBeInTheDocument();
  });
});
