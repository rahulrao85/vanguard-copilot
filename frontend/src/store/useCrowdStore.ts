/** Zustand store for crowd density and gate status state management. */

import { create } from 'zustand';
import type { CalculateResponse } from '@/types';
import { apiClient } from '@/api/client';

interface CrowdState {
  calculateResult: CalculateResponse | null;
  isLoading: boolean;
  error: string | null;
  calculateCrowd: (payload: { stadium_id: string; gates: Array<{ gate_id: string; sensor_count: number; capacity: number }> }) => Promise<void>;
  clearResult: () => void;
}

export const useCrowdStore = create<CrowdState>((set) => ({
  calculateResult: null,
  isLoading: false,
  error: null,

  calculateCrowd: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.calculate(payload);
      set({ calculateResult: result, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Calculation failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearResult: () => set({ calculateResult: null, error: null }),
}));
