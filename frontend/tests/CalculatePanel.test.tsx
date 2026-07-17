import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('⚽ Crowd Density Calculator')).toBeInTheDocument();
    expect(screen.getByLabelText('Stadium')).toBeInTheDocument();
    expect(screen.getByLabelText('Gate 1 identifier')).toBeInTheDocument();
    expect(screen.getByLabelText('Gate 1 sensor count')).toBeInTheDocument();
    expect(screen.getByLabelText('Gate 1 capacity')).toBeInTheDocument();
  });

  it('form inputs have associated <label> elements', () => {
    render(<CalculatePanel />);
    const stadiumInput = screen.getByLabelText('Stadium');
    expect(stadiumInput).toBeInTheDocument();
    expect(stadiumInput.tagName).toBe('SELECT');
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

  it('submits form with gate data', () => {
    render(<CalculatePanel />);
    fireEvent.change(screen.getByLabelText('Gate 1 sensor count'), {
      target: { value: '800' },
    });
    fireEvent.change(screen.getByLabelText('Gate 1 capacity'), {
      target: { value: '2000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Calculate Density/i }));
    expect(mockStore.calculateCrowd).toHaveBeenCalledWith(
      expect.objectContaining({
        gates: expect.arrayContaining([
          expect.objectContaining({ sensor_count: 800, capacity: 2000 }),
        ]),
      }),
    );
  });

  it('adds a second gate row', () => {
    render(<CalculatePanel />);
    expect(screen.getAllByLabelText(/^Gate \d+ identifier$/)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Gate/i }));
    expect(screen.getAllByLabelText(/^Gate \d+ identifier$/)).toHaveLength(2);
  });

  it('removes a gate row when multiple exist', () => {
    render(<CalculatePanel />);
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Gate/i }));
    expect(screen.getAllByLabelText(/^Gate \d+ identifier$/)).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', { name: /Remove gate/i });
    fireEvent.click(removeButtons[0]);
    expect(screen.getAllByLabelText(/^Gate \d+ identifier$/)).toHaveLength(1);
  });

  it('changes gate id selection', () => {
    render(<CalculatePanel />);
    const gateSelect = screen.getByLabelText('Gate 1 identifier') as HTMLSelectElement;
    const options = Array.from(gateSelect.options).map((o) => o.value).filter(Boolean);
    expect(options.length).toBeGreaterThan(0);
    if (options.length > 1) {
      fireEvent.change(gateSelect, { target: { value: options[1] } });
      expect(gateSelect.value).toBe(options[1]);
    }
  });

  it('changing stadium resets gate rows', () => {
    render(<CalculatePanel />);
    fireEvent.change(screen.getByLabelText('Stadium'), {
      target: { value: 'azteca' },
    });
    expect((screen.getByLabelText('Stadium') as HTMLSelectElement).value).toBe('azteca');
    expect(screen.getAllByLabelText(/^Gate \d+ identifier$/)).toHaveLength(1);
  });

  it('handles submission errors gracefully', async () => {
    mockStore.calculateCrowd = vi.fn().mockRejectedValue(new Error('calc failed'));
    render(<CalculatePanel />);
    fireEvent.click(screen.getByRole('button', { name: /Calculate Density/i }));
    await vi.waitFor(() => {
      expect(mockStore.calculateCrowd).toHaveBeenCalled();
    });
  });

  it('renders Critical status badge for high density gates', () => {
    mockStore.calculateResult = {
      ...mockResult,
      overall_density_percent: 90,
      gates: [
        { gate_id: 'gate-a', density_percent: 90, status: 'critical', recommendation: 'Emergency redirect!' },
      ],
    };
    render(<CalculatePanel />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByLabelText('gate-a density 90 percent')).toBeInTheDocument();
  });

  it('renders Clear status badge for low density gates', () => {
    mockStore.calculateResult = {
      ...mockResult,
      overall_density_percent: 15,
      gates: [
        { gate_id: 'gate-a', density_percent: 15, status: 'clear', recommendation: 'All good.' },
      ],
    };
    render(<CalculatePanel />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('renders Busy status badge for high density', () => {
    mockStore.calculateResult = {
      ...mockResult,
      overall_density_percent: 70,
      gates: [
        { gate_id: 'gate-a', density_percent: 70, status: 'busy', recommendation: 'Open more lanes.' },
      ],
    };
    render(<CalculatePanel />);
    expect(screen.getByText('Busy')).toBeInTheDocument();
  });

  it('renders results with overall density at critical threshold', () => {
    mockStore.calculateResult = {
      ...mockResult,
      overall_density_percent: 85,
      total_people: 4250,
      total_capacity: 5000,
      gates: [
        { gate_id: 'gate-a', density_percent: 85, status: 'critical', recommendation: 'Critical!' },
      ],
    };
    render(<CalculatePanel />);
    expect(screen.getByLabelText('Overall density 85 percent')).toBeInTheDocument();
  });

  it('renders results with overall density at moderate threshold', () => {
    mockStore.calculateResult = {
      ...mockResult,
      overall_density_percent: 45,
      gates: [
        { gate_id: 'gate-a', density_percent: 45, status: 'moderate', recommendation: 'Watch closely.' },
      ],
    };
    render(<CalculatePanel />);
    expect(screen.getByLabelText('Overall density 45 percent')).toBeInTheDocument();
  });
});
