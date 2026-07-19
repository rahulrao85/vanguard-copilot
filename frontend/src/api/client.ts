/** API client for Vanguard Co-Pilot backend. */

import { z } from 'zod';
import type {
  CalculateResponse,
  EntriesListResponse,
  EntryResponse,
  HealthResponse,
  InsightsResponse,
} from '../types';

const API_BASE = '/api';

const gateDataSchema = z.object({
  gate_id: z.string().min(1).max(64),
  sensor_count: z.number().int().min(0).max(100000),
  capacity: z.number().int().min(1).max(200000),
});

const calculateRequestSchema = z.object({
  stadium_id: z.string().min(1).max(128),
  gates: z.array(gateDataSchema).min(1).max(200),
});

const entryRequestSchema = z.object({
  device_id: z.string().min(1).max(128),
  activity_type: z.enum(['crowd_report', 'incident_log', 'shift_checkin', 'facility_issue', 'fan_assist', 'other']),
  description: z.string().min(1).max(8192),
  location: z.string().max(256).optional(),
  severity: z.enum(['info', 'warning', 'critical']),
});

const insightsRequestSchema = z.object({
  stadium_id: z.string().min(1).max(128),
  context_type: z.enum(['crowd_routing', 'fan_translation', 'facility_alert', 'ticketing_support']),
  input_text: z.string().min(1).max(8192),
  target_language: z.string().min(2).max(10),
  gate_data: z.array(gateDataSchema).optional(),
});

export class ApiClient {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  cancelPending(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    this.cancelPending();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      let detail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
          detail = errorData.detail as string;
        }
      } catch {
        // fallback to default HTTP status text
      }
      throw new Error(detail);
    }

    return response.json() as Promise<T>;
  }

  async calculate(
    data: z.infer<typeof calculateRequestSchema>,
  ): Promise<CalculateResponse> {
    const validated = calculateRequestSchema.parse(data);
    return this.request<CalculateResponse>('POST', '/calculate', validated);
  }

  async createEntry(
    data: z.infer<typeof entryRequestSchema>,
  ): Promise<EntryResponse> {
    const validated = entryRequestSchema.parse(data);
    return this.request<EntryResponse>('POST', '/entries', validated);
  }

  async getEntries(deviceId: string): Promise<EntriesListResponse> {
    return this.request<EntriesListResponse>(
      'GET',
      `/entries/${encodeURIComponent(deviceId)}`,
    );
  }

  async generateInsights(
    data: z.infer<typeof insightsRequestSchema>,
  ): Promise<InsightsResponse> {
    const validated = insightsRequestSchema.parse(data);
    return this.request<InsightsResponse>('POST', '/insights', validated);
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health');
  }
}

export const apiClient = new ApiClient();
