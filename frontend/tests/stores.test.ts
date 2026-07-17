import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockApiClient } = vi.hoisted(() => ({
  mockApiClient: {
    calculate: vi.fn(),
    createEntry: vi.fn(),
    getEntries: vi.fn(),
    generateInsights: vi.fn(),
    health: vi.fn(),
  },
}));

vi.mock('../src/api/client', () => ({
  apiClient: mockApiClient,
}));

vi.mock('../src/utils/device', () => ({
  getDeviceId: vi.fn(() => 'vol-test1234'),
  resetDeviceId: vi.fn(),
}));

import { useCrowdStore } from '../src/store/useCrowdStore';
import { useEntriesStore } from '../src/store/useEntriesStore';
import { useInsightsStore } from '../src/store/useInsightsStore';

describe('useCrowdStore', () => {
  beforeEach(() => {
    useCrowdStore.setState({
      calculateResult: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useCrowdStore.getState();
    expect(state.calculateResult).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('calculateCrowd sets isLoading true during call, false after', async () => {
    mockApiClient.calculate.mockResolvedValueOnce({
      stadium_id: 's1',
      overall_density_percent: 50,
      total_people: 2000,
      total_capacity: 4000,
      gates: [],
      timestamp: '2026-01-01T00:00:00Z',
    });

    const promise = useCrowdStore.getState().calculateCrowd({
      stadium_id: 's1',
      gates: [{ gate_id: 'g1', sensor_count: 100, capacity: 2000 }],
    });

    expect(useCrowdStore.getState().isLoading).toBe(true);

    await promise;

    expect(useCrowdStore.getState().isLoading).toBe(false);
  });

  it('calculateCrowd updates calculateResult on success', async () => {
    const mockResult = {
      stadium_id: 'stadium-1',
      overall_density_percent: 75,
      total_people: 3750,
      total_capacity: 5000,
      gates: [{ gate_id: 'gate-a', density_percent: 75, status: 'busy' as const, recommendation: 'Reduce flow.' }],
      timestamp: '2026-07-15T12:00:00Z',
    };
    mockApiClient.calculate.mockResolvedValueOnce(mockResult);

    await useCrowdStore.getState().calculateCrowd({
      stadium_id: 'stadium-1',
      gates: [{ gate_id: 'gate-a', sensor_count: 3750, capacity: 5000 }],
    });

    expect(useCrowdStore.getState().calculateResult).toEqual(mockResult);
    expect(useCrowdStore.getState().error).toBeNull();
  });

  it('sets error on failure', async () => {
    mockApiClient.calculate.mockRejectedValueOnce(new Error('Server error'));

    try {
      await useCrowdStore.getState().calculateCrowd({
        stadium_id: 's1',
        gates: [{ gate_id: 'g1', sensor_count: 100, capacity: 1000 }],
      });
    } catch {
      // expected
    }

    expect(useCrowdStore.getState().error).toBe('Server error');
    expect(useCrowdStore.getState().isLoading).toBe(false);
    expect(useCrowdStore.getState().calculateResult).toBeNull();
  });

  it('clearResult resets calculateResult and error', () => {
    useCrowdStore.setState({
      calculateResult: { stadium_id: 's1', overall_density_percent: 50, total_people: 1, total_capacity: 2, gates: [], timestamp: '' },
      error: 'some error',
    });

    useCrowdStore.getState().clearResult();

    expect(useCrowdStore.getState().calculateResult).toBeNull();
    expect(useCrowdStore.getState().error).toBeNull();
  });

  it('uses fallback message for non-Error rejection', async () => {
    mockApiClient.calculate.mockRejectedValueOnce('string failure');

    await expect(
      useCrowdStore.getState().calculateCrowd({
        stadium_id: 's1',
        gates: [{ gate_id: 'g1', sensor_count: 100, capacity: 1000 }],
      }),
    ).rejects.toBe('string failure');

    expect(useCrowdStore.getState().error).toBe('Calculation failed');
  });
});

describe('useEntriesStore', () => {
  beforeEach(() => {
    useEntriesStore.setState({
      entries: [],
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useEntriesStore.getState();
    expect(state.entries).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('createEntry adds entry to beginning of array', async () => {
    const newEntry = {
      entry_id: 'e1',
      device_id: 'vol-test1234',
      activity_type: 'crowd_report',
      description: 'Moderate crowd',
      severity: 'info',
      created_at: '2026-07-15T12:00:00Z',
      status: 'logged',
    };
    mockApiClient.createEntry.mockResolvedValueOnce(newEntry);

    await useEntriesStore.getState().createEntry({
      activity_type: 'crowd_report',
      description: 'Moderate crowd',
      severity: 'info',
    });

    const state = useEntriesStore.getState();
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]).toEqual(newEntry);
  });

  it('createEntry prepends entries for multiple additions', async () => {
    mockApiClient.createEntry
      .mockResolvedValueOnce({ entry_id: 'e1', device_id: 'vol-test1234', activity_type: 'crowd_report', description: 'first', severity: 'info', created_at: '', status: '' })
      .mockResolvedValueOnce({ entry_id: 'e2', device_id: 'vol-test1234', activity_type: 'incident_log', description: 'second', severity: 'info', created_at: '', status: '' });

    await useEntriesStore.getState().createEntry({ activity_type: 'crowd_report', description: 'first', severity: 'info' });
    await useEntriesStore.getState().createEntry({ activity_type: 'incident_log', description: 'second', severity: 'info' });

    const entries = useEntriesStore.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries[0].entry_id).toBe('e2');
    expect(entries[1].entry_id).toBe('e1');
  });

  it('fetchEntries populates entries array', async () => {
    const fetchedEntries = [
      { entry_id: 'e1', device_id: 'vol-test1234', activity_type: 'a', description: 'd1', severity: 'info', created_at: '', status: '' },
      { entry_id: 'e2', device_id: 'vol-test1234', activity_type: 'b', description: 'd2', severity: 'warning', created_at: '', status: '' },
    ];
    mockApiClient.getEntries.mockResolvedValueOnce({ entries: fetchedEntries, total: 2 });

    await useEntriesStore.getState().fetchEntries();

    expect(useEntriesStore.getState().entries).toEqual(fetchedEntries);
    expect(useEntriesStore.getState().isLoading).toBe(false);
  });

  it('fetchEntries sets error on failure', async () => {
    mockApiClient.getEntries.mockRejectedValueOnce(new Error('Network error'));

    try {
      await useEntriesStore.getState().fetchEntries();
    } catch {
      // expected
    }

    expect(useEntriesStore.getState().error).toBe('Network error');
    expect(useEntriesStore.getState().isLoading).toBe(false);
  });

  it('createEntry sets error on failure', async () => {
    mockApiClient.createEntry.mockRejectedValueOnce(new Error('Validation error'));

    try {
      await useEntriesStore.getState().createEntry({
        activity_type: 'crowd_report',
        description: 'Test',
        severity: 'info',
      });
    } catch {
      // expected
    }

    expect(useEntriesStore.getState().error).toBe('Validation error');
  });

  it('createEntry uses fallback message for non-Error rejection', async () => {
    mockApiClient.createEntry.mockRejectedValueOnce('raw string error');

    await expect(
      useEntriesStore.getState().createEntry({
        activity_type: 'crowd_report',
        description: 'Test',
        severity: 'info',
      }),
    ).rejects.toBe('raw string error');

    expect(useEntriesStore.getState().error).toBe('Failed to create entry');
  });

  it('fetchEntries uses fallback message for non-Error rejection', async () => {
    mockApiClient.getEntries.mockRejectedValueOnce(42);

    await expect(
      useEntriesStore.getState().fetchEntries(),
    ).rejects.toBe(42);

    expect(useEntriesStore.getState().error).toBe('Failed to fetch entries');
  });

  it('fetchEntries handles missing entries field', async () => {
    mockApiClient.getEntries.mockResolvedValueOnce({ device_id: 'd', entries: undefined, total: 0 });

    await useEntriesStore.getState().fetchEntries();
    expect(useEntriesStore.getState().entries).toEqual([]);
  });
});

describe('useInsightsStore', () => {
  beforeEach(() => {
    useInsightsStore.setState({
      insightResult: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useInsightsStore.getState();
    expect(state.insightResult).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('generateInsights sets insightResult on success', async () => {
    const mockResult = {
      stadium_id: 'stadium-1',
      context_type: 'crowd_routing',
      megaphone_script: 'Please move to Gate B.',
      reasoning: 'Gate A is full.',
      target_language: 'en',
      recommendations: ['Redirect traffic'],
      timestamp: '2026-07-15T12:00:00Z',
    };
    mockApiClient.generateInsights.mockResolvedValueOnce(mockResult);

    await useInsightsStore.getState().generateInsights({
      stadium_id: 'stadium-1',
      context_type: 'crowd_routing',
      input_text: 'Test',
      target_language: 'en',
    });

    expect(useInsightsStore.getState().insightResult).toEqual(mockResult);
    expect(useInsightsStore.getState().error).toBeNull();
  });

  it('generateInsights sets isLoading true during call, false after', async () => {
    mockApiClient.generateInsights.mockResolvedValueOnce({
      stadium_id: 's1',
      context_type: 'crowd_routing',
      megaphone_script: 'script',
      reasoning: 'reason',
      target_language: 'en',
      recommendations: [],
      timestamp: '',
    });

    const promise = useInsightsStore.getState().generateInsights({
      stadium_id: 's1',
      context_type: 'crowd_routing',
      input_text: 'Test',
      target_language: 'en',
    });

    expect(useInsightsStore.getState().isLoading).toBe(true);

    await promise;

    expect(useInsightsStore.getState().isLoading).toBe(false);
  });

  it('generateInsights sets error on failure', async () => {
    mockApiClient.generateInsights.mockRejectedValueOnce(new Error('Gemini timeout'));

    try {
      await useInsightsStore.getState().generateInsights({
        stadium_id: 's1',
        context_type: 'crowd_routing',
        input_text: 'Test',
        target_language: 'en',
      });
    } catch {
      // expected
    }

    expect(useInsightsStore.getState().error).toBe('Gemini timeout');
    expect(useInsightsStore.getState().isLoading).toBe(false);
  });

  it('clearInsights resets insightResult and error', () => {
    useInsightsStore.setState({
      insightResult: {
        stadium_id: 's1',
        context_type: 'crowd_routing',
        megaphone_script: 'x',
        reasoning: 'y',
        target_language: 'en',
        recommendations: [],
        timestamp: '',
      },
      error: 'some error',
    });

    useInsightsStore.getState().clearInsights();

    expect(useInsightsStore.getState().insightResult).toBeNull();
    expect(useInsightsStore.getState().error).toBeNull();
  });

  it('uses fallback message for non-Error rejection', async () => {
    mockApiClient.generateInsights.mockRejectedValueOnce('plain text error');

    await expect(
      useInsightsStore.getState().generateInsights({
        stadium_id: 's1',
        context_type: 'crowd_routing',
        input_text: 'Test',
        target_language: 'en',
      }),
    ).rejects.toBe('plain text error');

    expect(useInsightsStore.getState().error).toBe('Insight generation failed');
  });
});
