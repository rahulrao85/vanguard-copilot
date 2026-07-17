/** Zustand store for AI-generated insights and recommendations. */

import { create } from 'zustand';
import type { InsightsRequest, InsightsResponse } from '@/types';
import { apiClient } from '@/api/client';

interface InsightsState {
  insightResult: InsightsResponse | null;
  isLoading: boolean;
  error: string | null;
  generateInsights: (payload: InsightsRequest) => Promise<void>;
  clearInsights: () => void;
}

export const useInsightsStore = create<InsightsState>((set) => ({
  insightResult: null,
  isLoading: false,
  error: null,

  generateInsights: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.generateInsights(payload);
      set({ insightResult: result, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Insight generation failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearInsights: () => set({ insightResult: null, error: null }),
}));
