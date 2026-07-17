/** API client for Vanguard Co-Pilot backend. */

import { z } from 'zod';

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
  context_type: z.enum(['crowd_routing', 'fan_translation', 'facility_alert']),
  input_text: z.string().min(1).max(8192),
  target_language: z.string().min(2).max(10),
  gate_data: z.array(gateDataSchema).optional(),
});

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /** Phase 1: Calculate crowd density from gate sensor data. */
  async calculate(data: z.infer<typeof calculateRequestSchema>) {
    const validated = calculateRequestSchema.parse(data);
    return this.request<any>('POST', '/calculate', validated);
  }

  /** Phase 2: Save a volunteer activity entry. */
  async createEntry(data: z.infer<typeof entryRequestSchema>) {
    const validated = entryRequestSchema.parse(data);
    return this.request<any>('POST', '/entries', validated);
  }

  /** Phase 2: Retrieve entries for a device. */
  async getEntries(deviceId: string) {
    return this.request<any>('GET', `/entries/${encodeURIComponent(deviceId)}`);
  }

  /** Phase 3: Generate AI insights via Gemini. */
  async generateInsights(data: z.infer<typeof insightsRequestSchema>) {
    const validated = insightsRequestSchema.parse(data);
    return this.request<any>('POST', '/insights', validated);
  }

  /** Check backend health. */
  async health() {
    return this.request<any>('GET', '/../health');
  }
}

export const apiClient = new ApiClient();
