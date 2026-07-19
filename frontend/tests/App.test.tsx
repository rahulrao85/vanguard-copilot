import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

// ── Mock i18next so App tests don't require i18n init ──────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// ── Mock live telemetry (EventSource not available in jsdom) ───────────────
vi.mock('../src/hooks/useTelemetry', () => ({
  useTelemetry: vi.fn(() => ({ telemetry: null, isConnected: false, error: null })),
}));

vi.mock('../src/hooks/useTelemetry', () => ({
  useTelemetry: vi.fn(() => ({ telemetry: null, isConnected: false, error: null })),
}));

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

vi.mock('../src/store/useJuryStore', () => ({
  useJuryStore: vi.fn(() => ({
    entries: [],
    isLoading: false,
    uploadJuryEntry: vi.fn(),
    fetchJuryEntries: vi.fn(),
  })),
}));

vi.mock('../src/store/useRoleStore', () => ({
  useRoleStore: vi.fn(() => ({ persona: 'volunteer' as const, setPersona: vi.fn() })),
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

async function waitForApp() {
  await screen.findByRole('heading', { name: 'Vanguard Co-Pilot', level: 1 });
}

describe('App', () => {
  beforeEach(() => {
    mockHealthStatus = 'healthy';
    mockHealthError = false;
    setupDocument();
  });

  it('renders header with app title', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Vanguard Co-Pilot', level: 1 })).toBeInTheDocument();
  });

  it('renders RoleSwitcher with 4 persona buttons', async () => {
    render(<App />);
    await waitForApp();
    expect(screen.getByRole('button', { name: /role\.fan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /role\.organizer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /role\.volunteer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /role\.staff/i })).toBeInTheDocument();
  });

  it('has skip-link element with "Skip to main content" text', async () => {
    render(<App />);
    await waitForApp();
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

  it('default persona is volunteer, shows VolunteerDashboard', async () => {
    render(<App />);
    await waitForApp();
    // Volunteer dashboard renders the nav tabs (Understand, Track, Reduce, Jury)
    expect(await screen.findByText(/tab\.understand/i)).toBeInTheDocument();
    expect(await screen.findByText(/tab\.track/i)).toBeInTheDocument();
    expect(await screen.findByText(/tab\.reduce/i)).toBeInTheDocument();
    expect(await screen.findByText(/tab\.jury/i)).toBeInTheDocument();
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
    await waitForApp();
    const toggleBtn = screen.getByRole('button', { name: /Switch to light mode/i });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Switch to dark mode/i })).toBeInTheDocument();
  });

  it('stadium select changes selected stadium', async () => {
    render(<App />);
    await waitForApp();
    const select = screen.getByLabelText('Select stadium');
    fireEvent.change(select, { target: { value: 'azteca' } });
    expect((select as HTMLSelectElement).value).toBe('azteca');
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
