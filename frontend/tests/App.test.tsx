import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

let mockHealthStatus: string | null = null;
let mockHealthError: boolean = false;

vi.mock('../src/api/client', () => ({
  apiClient: {
    health: vi.fn().mockImplementation(() => {
      if (mockHealthError) return Promise.reject(new Error('down'));
      return Promise.resolve({ status: mockHealthStatus ?? 'healthy', database: 'ok', gemini_configured: true, version: '1.0' });
    }),
  },
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

function setupDocument() {
  if (!document.documentElement.lang) {
    document.documentElement.lang = 'en';
  }
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0';
    document.head.appendChild(meta);
  }
}

describe('App', () => {
  beforeEach(() => {
    mockHealthStatus = 'healthy';
    mockHealthError = false;
    setupDocument();
  });

  it('renders header with app title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Vanguard Co-Pilot', level: 1 })).toBeInTheDocument();
  });

  it('renders navigation with tab buttons for all 4 phases', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Understand: Calculate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Track: Log Entry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reduce: Insights/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jury Upload: Custom Logs/i })).toBeInTheDocument();
  });

  it('has skip-link element with "Skip to main content" text', () => {
    render(<App />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink.closest('a')).toHaveAttribute('href', '#main-content');
    expect(skipLink.closest('a')).toHaveClass('skip-link');
  });

  it('has <main> element with id="main-content"', () => {
    render(<App />);
    expect(document.getElementById('main-content')).toBeInTheDocument();
    expect(document.getElementById('main-content')!.tagName).toBe('MAIN');
  });

  it('default active tab is "calculate"', () => {
    render(<App />);
    const calcTab = screen.getByRole('button', { name: /Understand: Calculate/i });
    expect(calcTab).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('⚽ Crowd Density Calculator')).toBeInTheDocument();
  });

  it('clicking tab buttons changes the visible panel', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Track: Log Entry/i }));
    expect(screen.getByText('⚽ Activity Log Entry')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reduce: Insights/i }));
    expect(screen.getByText('⚽ AI Insights')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Jury Upload: Custom Logs/i }));
    expect(screen.getByRole('heading', { name: /Jury Upload/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Understand: Calculate/i }));
    expect(screen.getByText('⚽ Crowd Density Calculator')).toBeInTheDocument();
  });

  it('<html> has lang="en"', () => {
    render(<App />);
    expect(document.documentElement.lang).toBe('en');
  });

  it('viewport meta tag is present', () => {
    render(<App />);
    const meta = document.querySelector('meta[name="viewport"]');
    expect(meta).not.toBeNull();
  });

  it('shows healthy status indicator', async () => {
    render(<App />);
    expect(await screen.findByText('Operational')).toBeInTheDocument();
  });

  it('shows degraded status on health check failure', async () => {
    mockHealthError = true;
    render(<App />);
    expect(await screen.findByText('Degraded')).toBeInTheDocument();
  });

  it('theme toggle switches from dark to light mode', async () => {
    render(<App />);
    const toggleBtn = screen.getByRole('button', { name: /Switch to light mode/i });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Switch to dark mode/i })).toBeInTheDocument();
  });

  it('stadium select changes selected stadium', async () => {
    render(<App />);
    const select = screen.getByLabelText('Select stadium');
    fireEvent.change(select, { target: { value: 'azteca' } });
    expect((select as HTMLSelectElement).value).toBe('azteca');
  });

  it('health status shows Operational when healthy', async () => {
    render(<App />);
    expect(await screen.findByText('Operational')).toBeInTheDocument();
  });

  it('health status shows Degraded when unhealthy', async () => {
    mockHealthError = true;
    render(<App />);
    expect(await screen.findByText('Degraded')).toBeInTheDocument();
  });

  it('health status shows Checking... during load', () => {
    mockHealthStatus = null;
    render(<App />);
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  it('health dot has correct aria-label for healthy status', async () => {
    render(<App />);
    await screen.findByText('Operational');
    expect(screen.getByLabelText('System healthy')).toBeInTheDocument();
  });

  it('health dot has correct aria-label for degraded status', async () => {
    mockHealthError = true;
    render(<App />);
    await screen.findByText('Degraded');
    expect(screen.getByLabelText('System degraded')).toBeInTheDocument();
  });
});
