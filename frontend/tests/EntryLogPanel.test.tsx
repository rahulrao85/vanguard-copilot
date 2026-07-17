import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { EntryResponse } from '../src/types';
import type { Mock } from 'vitest';

interface MockStore {
  entries: EntryResponse[];
  isLoading: boolean;
  error: string | null;
  createEntry: Mock;
  fetchEntries: Mock;
}

const defaultMock: MockStore = {
  entries: [],
  isLoading: false,
  error: null,
  createEntry: vi.fn().mockResolvedValue(undefined),
  fetchEntries: vi.fn().mockResolvedValue(undefined),
};

let mockStore: MockStore = { ...defaultMock };

vi.mock('../src/store/useEntriesStore', () => ({
  useEntriesStore: () => mockStore,
}));

vi.mock('../src/utils/device', () => ({
  getDeviceId: () => 'vol-test1234',
  resetDeviceId: vi.fn(),
}));

vi.mock('../src/components/LoadingSpinner', () => ({
  default: ({ label }: { label: string }) => <div data-testid="spinner">{label}</div>,
}));

vi.mock('../src/components/StatusBadge', () => ({
  default: ({ status, label }: { status: string; label?: string }) => (
    <span data-testid={`badge-${status}`}>{label ?? status}</span>
  ),
}));

import EntryLogPanel from '../src/components/EntryLogPanel';

const mockEntry: EntryResponse = {
  entry_id: 'abc12345-0001',
  device_id: 'vol-test1234',
  activity_type: 'crowd_report',
  description: 'Moderate crowd at Gate A',
  location: 'Gate A',
  severity: 'info',
  created_at: '2026-07-15T12:00:00Z',
  status: 'logged',
};

describe('EntryLogPanel', () => {
  beforeEach(() => {
    mockStore = {
      entries: [],
      isLoading: false,
      error: null,
      createEntry: vi.fn().mockResolvedValue(undefined),
      fetchEntries: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('renders form with activity_type select, severity select, description textarea, location input', () => {
    render(<EntryLogPanel />);
    expect(screen.getByLabelText('Activity Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Severity')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
  });

  it('all form controls have <label> elements', () => {
    render(<EntryLogPanel />);
    expect(screen.getByText('Activity Type').closest('label')).toBeInTheDocument();
    expect(screen.getByText('Severity').closest('label')).toBeInTheDocument();
    expect(screen.getByText('Description').closest('label')).toBeInTheDocument();
    expect(screen.getByText('Location').closest('label')).toBeInTheDocument();
  });

  it('shows "No activity logs" when entries array is empty', () => {
    render(<EntryLogPanel />);
    expect(screen.getByText('No activity logs recorded yet')).toBeInTheDocument();
  });

  it('shows entry cards when entries exist', () => {
    mockStore.entries = [mockEntry];
    render(<EntryLogPanel />);
    expect(screen.getByText('Moderate crowd at Gate A')).toBeInTheDocument();
    expect(screen.getByText(/Location: Gate A/)).toBeInTheDocument();
  });

  it('calls fetchEntries on mount', () => {
    render(<EntryLogPanel />);
    expect(mockStore.fetchEntries).toHaveBeenCalledTimes(1);
  });

  it('submit button is present', () => {
    render(<EntryLogPanel />);
    expect(screen.getByRole('button', { name: /Submit Entry/i })).toBeInTheDocument();
  });

  it('shows device ID banner', () => {
    render(<EntryLogPanel />);
    expect(screen.getByLabelText('Current device identifier')).toBeInTheDocument();
    expect(screen.getByText('vol-test1234')).toBeInTheDocument();
  });

  it('shows error message when error is set', () => {
    mockStore.error = 'Failed to create entry';
    render(<EntryLogPanel />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to create entry');
  });

  it('disables submit button and shows aria-busy when isLoading', () => {
    mockStore.isLoading = true;
    render(<EntryLogPanel />);
    const btn = screen.getByRole('button', { name: /Submitting.../i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('renders multiple entry cards with correct badges', () => {
    mockStore.entries = [
      mockEntry,
      {
        ...mockEntry,
        entry_id: 'abc12345-0002',
        activity_type: 'incident_log',
        severity: 'critical',
        description: 'Medical incident at concourse',
        location: 'Concourse B',
      },
    ];
    render(<EntryLogPanel />);
    expect(screen.getByText('Moderate crowd at Gate A')).toBeInTheDocument();
    expect(screen.getByText('Medical incident at concourse')).toBeInTheDocument();
    expect(screen.getByTestId('badge-crowd_report')).toBeInTheDocument();
    expect(screen.getByTestId('badge-incident_log')).toBeInTheDocument();
  });
});
