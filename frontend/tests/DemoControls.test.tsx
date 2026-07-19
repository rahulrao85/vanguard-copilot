import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DemoControls from '../src/components/DemoControls';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const baseState = {
  step: 0,
  total_steps: 20,
  timestamp: 0,
  phase: 1,
  gates: { A: 50, B: 30 },
  zones: { north: 40, south: 60 },
  concessions: { main: 70 },
  event: 'Kickoff',
};

describe('DemoControls', () => {
  it('renders enable button initially', () => {
    render(<DemoControls demoState={null} onStateChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /demo\.enable/i })).toBeInTheDocument();
  });

  it('calls onStateChange when start is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => baseState,
    });
    const onStateChange = vi.fn();
    render(<DemoControls demoState={null} onStateChange={onStateChange} />);
    fireEvent.click(screen.getByRole('button', { name: /demo\.enable/i }));
    await vi.waitFor(() => {
      expect(onStateChange).toHaveBeenCalled();
    });
  });

  it('shows toolbar with step info after clicking start', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => baseState,
    });
    render(<DemoControls demoState={null} onStateChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /demo\.enable/i }));
    await vi.waitFor(() => {
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
    expect(screen.getByText(/stadium\.step/i)).toBeInTheDocument();
  });
});
