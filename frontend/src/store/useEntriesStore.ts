/** Zustand store for volunteer activity log entries. */

import { create } from 'zustand';
import type { EntryResponse } from '@/types';
import { apiClient } from '@/api/client';
import { getDeviceId } from '@/utils/device';

interface EntriesState {
  entries: EntryResponse[];
  isLoading: boolean;
  error: string | null;
  createEntry: (payload: {
    activity_type: string;
    description: string;
    location?: string;
    severity: string;
  }) => Promise<void>;
  fetchEntries: () => Promise<void>;
}

export const useEntriesStore = create<EntriesState>((set) => ({
  entries: [],
  isLoading: false,
  error: null,

  createEntry: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const deviceId = getDeviceId();
      const result = await apiClient.createEntry({
        device_id: deviceId,
        ...payload,
      } as any);
      set((state) => ({
        entries: [result, ...state.entries],
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create entry';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  fetchEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const deviceId = getDeviceId();
      const result = await apiClient.getEntries(deviceId);
      set({ entries: result.entries || [], isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch entries';
      set({ error: message, isLoading: false });
      throw err;
    }
  },
}));
