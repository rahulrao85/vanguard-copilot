import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FanDashboard from '../src/components/FanDashboard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockTelemetry = {
  gates: { A: 45, B: 82 } as Record<string, number>,
  totalOccupancy: 62,
  timestamp: Date.now(),
};

describe('FanDashboard', () => {
  it('renders welcome message', () => {
    render(<FanDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/fan\.welcome/i)).toBeInTheDocument();
  });

  it('renders quick action items', () => {
    render(<FanDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/fan\.findFood/i)).toBeInTheDocument();
    expect(screen.getByText(/fan\.nearbyGate/i)).toBeInTheDocument();
    expect(screen.getByText(/fan\.transport/i)).toBeInTheDocument();
  });

  it('renders crowd heatmap section', () => {
    render(<FanDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/stadium\.heatmap/i)).toBeInTheDocument();
  });

  it('renders stadium assistant chat bubble', () => {
    render(<FanDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByRole('button', { name: 'Open stadium assistant' })).toBeInTheDocument();
  });
});
