import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VolunteerDashboard from '../src/components/VolunteerDashboard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('../src/store/useCrowdStore', () => ({
  useCrowdStore: vi.fn(() => ({
    calculateResult: null,
    isLoading: false,
    error: null,
    calculateCrowd: vi.fn(),
    clearResult: vi.fn(),
  })),
}));

vi.mock('../src/store/useEntriesStore', () => ({
  useEntriesStore: vi.fn(() => ({
    entries: [],
    isLoading: false,
    error: null,
    createEntry: vi.fn().mockResolvedValue(undefined),
    fetchEntries: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../src/store/useInsightsStore', () => ({
  useInsightsStore: vi.fn(() => ({
    insightResult: null,
    isLoading: false,
    error: null,
    generateInsights: vi.fn(),
    clearInsights: vi.fn(),
  })),
}));

vi.mock('../src/store/useJuryStore', () => ({
  useJuryStore: vi.fn(() => ({
    entries: [],
    isLoading: false,
    uploadJuryEntry: vi.fn(),
    fetchJuryEntries: vi.fn(),
  })),
}));

const mockTelemetry = {
  gates: { A: 45 } as Record<string, number>,
  totalOccupancy: 45,
  timestamp: Date.now(),
};

describe('VolunteerDashboard', () => {
  it('renders all 4 phase tabs (Understand, Track, Reduce, Jury)', () => {
    render(<VolunteerDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/tab\.understand/i)).toBeInTheDocument();
    expect(screen.getByText(/tab\.track/i)).toBeInTheDocument();
    expect(screen.getByText(/tab\.reduce/i)).toBeInTheDocument();
    expect(screen.getByText(/tab\.jury/i)).toBeInTheDocument();
  });

  it('defaults to the Understand tab', () => {
    render(<VolunteerDashboard telemetry={mockTelemetry} isConnected={true} />);
    const understandBtn = screen.getByText(/tab\.understand/i).closest('button');
    expect(understandBtn).toHaveAttribute('aria-current', 'page');
  });

  it('clicking tabs switches the active panel', () => {
    render(<VolunteerDashboard telemetry={mockTelemetry} isConnected={true} />);
    fireEvent.click(screen.getByText(/tab\.track/i));
    expect(screen.getByText(/tab\.track/i).closest('button')).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByText(/tab\.jury/i));
    expect(screen.getByText(/tab\.jury/i).closest('button')).toHaveAttribute('aria-current', 'page');
  });

  it('renders heatmap and AI Chat sections', () => {
    render(<VolunteerDashboard telemetry={mockTelemetry} isConnected={true} />);
    expect(screen.getByText(/stadium\.heatmap/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open stadium assistant' })).toBeInTheDocument();
  });
});
