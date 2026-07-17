import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { InsightsResponse } from '../src/types';
import type { Mock } from 'vitest';

interface MockStore {
  insightResult: InsightsResponse | null;
  isLoading: boolean;
  error: string | null;
  generateInsights: Mock;
  clearInsights: Mock;
}

const defaultMock: MockStore = {
  insightResult: null,
  isLoading: false,
  error: null,
  generateInsights: vi.fn().mockResolvedValue(undefined),
  clearInsights: vi.fn(),
};

let mockStore: MockStore = { ...defaultMock };

vi.mock('../src/store/useInsightsStore', () => ({
  useInsightsStore: () => mockStore,
}));

vi.mock('../src/components/LoadingSpinner', () => ({
  default: ({ label }: { label: string }) => <div data-testid="spinner">{label}</div>,
}));

import InsightsPanel from '../src/components/InsightsPanel';

const mockResult: InsightsResponse = {
  stadium_id: 'stadium-1',
  context_type: 'crowd_routing',
  megaphone_script: 'Please move to Gate B for faster entry.',
  reasoning: 'Gate A is at 85% capacity while Gate B is at 30%.',
  target_language: 'en',
  recommendations: ['Redirect 200 fans from Gate A to Gate B.', 'Open auxiliary entrance.'],
  timestamp: '2026-07-15T12:00:00Z',
};

describe('InsightsPanel', () => {
  beforeEach(() => {
    mockStore = {
      insightResult: null,
      isLoading: false,
      error: null,
      generateInsights: vi.fn().mockResolvedValue(undefined),
      clearInsights: vi.fn(),
    };
  });

  it('renders context_type select, target_language input, input_text textarea', () => {
    render(<InsightsPanel />);
    expect(screen.getByLabelText('Context Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Input Context / Query')).toBeInTheDocument();
    expect(screen.getByLabelText('Stadium')).toBeInTheDocument();
  });

  it('form elements have <label> elements', () => {
    render(<InsightsPanel />);
    expect(screen.getByText('Context Type').closest('label')).toBeInTheDocument();
    expect(screen.getByText('Target Language').closest('label')).toBeInTheDocument();
    expect(screen.getByText('Input Context / Query').closest('label')).toBeInTheDocument();
  });

  it('shows results card with megaphone script when insightResult is set', () => {
    mockStore.insightResult = mockResult;
    render(<InsightsPanel />);
    expect(screen.getByText('Megaphone Script')).toBeInTheDocument();
    expect(screen.getByText('Please move to Gate B for faster entry.')).toBeInTheDocument();
    expect(screen.getByText('Reasoning')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    mockStore.isLoading = true;
    render(<InsightsPanel />);
    expect(screen.getByTestId('spinner')).toHaveTextContent('Generating AI insights...');
  });

  it('shows error message on error', () => {
    mockStore.error = 'Gemini API unavailable';
    render(<InsightsPanel />);
    expect(screen.getByRole('alert')).toHaveTextContent('Gemini API unavailable');
  });

  it('renders recommendations list items', () => {
    mockStore.insightResult = mockResult;
    render(<InsightsPanel />);
    expect(screen.getByText('Redirect 200 fans from Gate A to Gate B.')).toBeInTheDocument();
    expect(screen.getByText('Open auxiliary entrance.')).toBeInTheDocument();
  });

  it('shows language suffix when target_language is not en', () => {
    mockStore.insightResult = { ...mockResult, target_language: 'es' };
    render(<InsightsPanel />);
    expect(screen.getByText(/Megaphone Script.*\(es\)/)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<InsightsPanel />);
    expect(screen.getByRole('button', { name: /Generate Insights/i })).toBeInTheDocument();
  });

  it('submits form with entered data', async () => {
    render(<InsightsPanel />);
    fireEvent.change(screen.getByLabelText('Input Context / Query'), {
      target: { value: 'Gate A overcrowded' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate Insights/i }));
    expect(mockStore.generateInsights).toHaveBeenCalledWith(
      expect.objectContaining({
        input_text: 'Gate A overcrowded',
        context_type: 'crowd_routing',
        target_language: 'en',
      }),
    );
  });

  it('changing context type and language updates submission', () => {
    render(<InsightsPanel />);
    fireEvent.change(screen.getByLabelText('Context Type'), {
      target: { value: 'fan_translation' },
    });
    fireEvent.change(screen.getByLabelText('Target Language'), {
      target: { value: 'es' },
    });
    fireEvent.change(screen.getByLabelText('Input Context / Query'), {
      target: { value: 'Where is the exit?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate Insights/i }));
    expect(mockStore.generateInsights).toHaveBeenCalledWith(
      expect.objectContaining({
        context_type: 'fan_translation',
        target_language: 'es',
      }),
    );
  });

  it('toggles gate data section and includes gate data when enabled', () => {
    render(<InsightsPanel />);
    const toggle = screen.getByRole('button', { name: /Add Gate Data/i });
    fireEvent.click(toggle);
    expect(screen.getByText('- Hide Gate Data')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Input Context / Query'), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate Insights/i }));
    expect(mockStore.generateInsights).toHaveBeenCalledWith(
      expect.objectContaining({
        gate_data: expect.arrayContaining([
          expect.objectContaining({ sensor_count: 0, capacity: 1000 }),
        ]),
      }),
    );
  });

  it('omits gate_data when gate section is hidden', () => {
    render(<InsightsPanel />);
    fireEvent.change(screen.getByLabelText('Input Context / Query'), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate Insights/i }));
    const call = mockStore.generateInsights.mock.calls[0][0];
    expect(call.gate_data).toBeUndefined();
  });

  it('adds and removes gate rows', () => {
    render(<InsightsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Add Gate Data/i }));
    expect(screen.getAllByLabelText(/^Insight gate \d+ identifier$/)).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: '+ Add Gate' }));
    expect(screen.getAllByLabelText(/^Insight gate \d+ identifier$/)).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', { name: /Remove insight gate/i });
    fireEvent.click(removeButtons[0]);
    expect(screen.getAllByLabelText(/^Insight gate \d+ identifier$/)).toHaveLength(1);
  });

  it('updates gate row fields', () => {
    render(<InsightsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Add Gate Data/i }));

    fireEvent.change(screen.getByLabelText('Insight gate 1 sensor count'), {
      target: { value: '500' },
    });
    fireEvent.change(screen.getByLabelText('Insight gate 1 capacity'), {
      target: { value: '2000' },
    });
    fireEvent.change(screen.getByLabelText('Input Context / Query'), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate Insights/i }));

    const call = mockStore.generateInsights.mock.calls[0][0];
    expect(call.gate_data[0]).toMatchObject({ sensor_count: 500, capacity: 2000 });
  });

  it('changes selected stadium resets gate rows', () => {
    render(<InsightsPanel />);
    fireEvent.change(screen.getByLabelText('Stadium'), {
      target: { value: 'azteca' },
    });
    expect((screen.getByLabelText('Stadium') as HTMLSelectElement).value).toBe('azteca');
  });

  it('changes gate id selection', () => {
    render(<InsightsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Add Gate Data/i }));
    const gateSelect = screen.getByLabelText('Insight gate 1 identifier');
    const options = Array.from((gateSelect as HTMLSelectElement).options).map((o) => o.value).filter(Boolean);
    if (options.length > 1) {
      fireEvent.change(gateSelect, { target: { value: options[1] } });
      expect((gateSelect as HTMLSelectElement).value).toBe(options[1]);
    }
  });

  it('handles submission errors gracefully', async () => {
    mockStore.generateInsights = vi.fn().mockRejectedValue(new Error('API error'));
    render(<InsightsPanel />);
    fireEvent.change(screen.getByLabelText('Input Context / Query'), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate Insights/i }));
    await vi.waitFor(() => {
      expect(mockStore.generateInsights).toHaveBeenCalled();
    });
  });

  it('clears insights when Clear button clicked', () => {
    mockStore.insightResult = mockResult;
    render(<InsightsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
    expect(mockStore.clearInsights).toHaveBeenCalled();
  });
});
