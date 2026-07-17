import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CalculateResponse, GateStatus } from '../src/types';

const { mockStore } = vi.hoisted(() => ({
  mockStore: {
    calculateResult: null as CalculateResponse | null,
    isLoading: false,
    error: null as string | null,
    calculateCrowd: vi.fn(),
    clearResult: vi.fn(),
  },
}));

vi.mock('../src/store/useCrowdStore', () => ({
  useCrowdStore: () => mockStore,
}));

vi.mock('../src/components/LoadingSpinner', () => ({
  default: ({ label }: { label: string }) => <div data-testid="spinner">{label}</div>,
}));

import CalculatePanel from '../src/components/CalculatePanel';

const mockResult: CalculateResponse = {
  stadium_id: 'stadium-1',
  overall_density_percent: 45,
  total_people: 2250,
  total_capacity: 5000,
  gates: [
    {
      gate_id: 'gate-a',
      density_percent: 45,
      status: 'moderate' as const,
      recommendation: 'Keep monitoring flow rate.',
    },
  ] as GateStatus[],
  timestamp: '2026-07-15T12:00:00Z',
};

describe('CalculatePanel', () => {
  beforeEach(() => {
    mockStore.calculateResult = null;
    mockStore.isLoading = false;
    mockStore.error = null;
    mockStore.calculateCrowd = vi.fn();
    mockStore.clearResult = vi.fn();
  });

  it('renders form with stadium_id input and gate data inputs', () => {
    render(<CalculatePanel />);
    expect(screen.getByText('Crowd Density Calculator')).toBeInTheDocument();
    expect(screen.getByLabelText('Stadium ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Gate 1 identifier')).toBeInTheDocument();
    expect(screen.getByLabelText('Gate 1 sensor count')).toBeInTheDocument();
    expect(screen.getByLabelText('Gate 1 capacity')).toBeInTheDocument();
  });

  it('form inputs have associated <label> elements', () => {
    render(<CalculatePanel />);
    const stadiumInput = screen.getByLabelText('Stadium ID');
    expect(stadiumInput).toBeInTheDocument();
    expect(stadiumInput).toHaveAttribute('type', 'text');
    expect(document.querySelector('label[for]')).toBeInTheDocument();
  });

  it('has submit button', () => {
    render(<CalculatePanel />);
    expect(screen.getByRole('button', { name: /Calculate Density/i })).toBeInTheDocument();
  });

  it('shows loading state with aria-busy when isLoading is true', () => {
    mockStore.isLoading = true;
    render(<CalculatePanel />);
    const btn = screen.getByRole('button', { name: /Calculating.../i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
  });

  it('shows error message when error is set', () => {
    mockStore.error = 'Gate capacity exceeded';
    render(<CalculatePanel />);
    expect(screen.getByRole('alert')).toHaveTextContent('Gate capacity exceeded');
  });

  it('shows results when calculateResult is not null', () => {
    mockStore.calculateResult = mockResult;
    render(<CalculatePanel />);
    expect(screen.getByLabelText('Calculation results')).toBeInTheDocument();
    expect(screen.getByText(/2[,.]?250/)).toBeInTheDocument();
    expect(screen.getByText(/5[,.]?000/)).toBeInTheDocument();
    expect(screen.getByLabelText('Overall density 45 percent')).toBeInTheDocument();
  });

  it('renders gate status cards with correct status badges', () => {
    mockStore.calculateResult = mockResult;
    render(<CalculatePanel />);
    expect(screen.getByText('gate-a')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByLabelText('gate-a density 45 percent')).toBeInTheDocument();
  });

  it('renders multiple gate cards when multiple gates exist in result', () => {
    mockStore.calculateResult = {
      ...mockResult,
      overall_density_percent: 52,
      gates: [
        { gate_id: 'gate-a', density_percent: 20, status: 'clear' as const, recommendation: 'All clear.' },
        { gate_id: 'gate-b', density_percent: 85, status: 'critical' as const, recommendation: 'Redirect!' },
      ] as GateStatus[],
    };
    render(<CalculatePanel />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('calls clearResult when Clear Results button is clicked', () => {
    mockStore.calculateResult = mockResult;
    render(<CalculatePanel />);
    const clearBtn = screen.getByRole('button', { name: /Clear Results/i });
    clearBtn.click();
    expect(mockStore.clearResult).toHaveBeenCalled();
  });
});
