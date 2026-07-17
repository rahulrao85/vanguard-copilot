import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
