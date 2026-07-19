import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StaffDashboard from '../src/components/StaffDashboard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockTelemetry = {
  gates: { A: 45, B: 92, C: 78 } as Record<string, number>,
  totalOccupancy: 72,
  timestamp: Date.now(),
};

describe('StaffDashboard', () => {
  const mockSetDemo = vi.fn();

  beforeEach(() => {
    mockSetDemo.mockClear();
  });

  it('renders operations hub heading', () => {
    render(<StaffDashboard telemetry={mockTelemetry} isConnected={true} demoState={null} onDemoStateChange={mockSetDemo} />);
    expect(screen.getByText(/staff\.operationsHub/i)).toBeInTheDocument();
  });

  it('renders active alerts for high-occupancy gates', () => {
    render(<StaffDashboard telemetry={mockTelemetry} isConnected={true} demoState={null} onDemoStateChange={mockSetDemo} />);
    expect(screen.getByText(/staff\.alerts/i)).toBeInTheDocument();
    // Gate B at 92% should trigger alert
    expect(screen.getByText(/92/)).toBeInTheDocument();
  });

  it('renders dispatch form heading', () => {
    render(<StaffDashboard telemetry={mockTelemetry} isConnected={true} demoState={null} onDemoStateChange={mockSetDemo} />);
    expect(screen.getByRole('heading', { name: /staff\.dispatch/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/staff\.dispatchPlaceholder/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /staff\.send/i })).toBeInTheDocument();
  });

  it('renders gate status overview table', () => {
    render(<StaffDashboard telemetry={mockTelemetry} isConnected={true} demoState={null} onDemoStateChange={mockSetDemo} />);
    expect(screen.getByText(/staff\.gateStatus/i)).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});
