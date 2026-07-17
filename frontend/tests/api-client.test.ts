import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient, apiClient } from '../src/api/client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ApiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('singleton export', () => {
    it('exports a default apiClient instance', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });

    it('accepts a custom baseUrl', () => {
      const client = new ApiClient('/custom');
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('calculate', () => {
    const payload = {
      stadium_id: 'stadium-1',
      gates: [{ gate_id: 'gate-a', sensor_count: 1200, capacity: 5000 }],
    };

    it('sends POST to /api/calculate with validated body', async () => {
      const responseData = {
        stadium_id: 'stadium-1',
        overall_density_percent: 24,
        total_people: 1200,
        total_capacity: 5000,
        gates: [],
        timestamp: '2026-07-15T12:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

      const result = await apiClient.calculate(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/calculate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      );
      expect(result.overall_density_percent).toBe(24);
    });

    it('rejects invalid payload before fetch (empty gates)', async () => {
      await expect(
        apiClient.calculate({ stadium_id: 's1', gates: [] }),
      ).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects negative sensor_count', async () => {
      await expect(
        apiClient.calculate({
          stadium_id: 's1',
          gates: [{ gate_id: 'g1', sensor_count: -5, capacity: 100 }],
        }),
      ).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects capacity above max', async () => {
      await expect(
        apiClient.calculate({
          stadium_id: 's1',
          gates: [{ gate_id: 'g1', sensor_count: 10, capacity: 300000 }],
        }),
      ).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('createEntry', () => {
    const payload = {
      device_id: 'dev-1',
      activity_type: 'crowd_report' as const,
      description: 'Test entry',
      severity: 'info' as const,
    };

    it('sends POST to /api/entries', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ entry_id: 'e1', ...payload, created_at: '', status: 'logged' }),
      );
      const result = await apiClient.createEntry(payload);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/entries',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result.entry_id).toBe('e1');
    });

    it('rejects invalid activity_type', async () => {
      await expect(
        apiClient.createEntry({
          ...payload,
          activity_type: 'invalid' as never,
        }),
      ).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects invalid severity', async () => {
      await expect(
        apiClient.createEntry({ ...payload, severity: 'extreme' as never }),
      ).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('accepts optional location', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ entry_id: 'e2', ...payload, created_at: '', status: 'logged' }),
      );
      await apiClient.createEntry({ ...payload, location: 'Gate A' });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.location).toBe('Gate A');
    });
  });

  describe('getEntries', () => {
    it('sends GET to /api/entries/{deviceId}', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ device_id: 'dev-1', entries: [], total: 0 }),
      );
      await apiClient.getEntries('dev-1');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/entries/dev-1',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('URL-encodes special characters in deviceId', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ device_id: 'a/b c', entries: [], total: 0 }),
      );
      await apiClient.getEntries('a/b c');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/entries/a%2Fb%20c',
        expect.anything(),
      );
    });
  });

  describe('generateInsights', () => {
    const payload = {
      stadium_id: 's1',
      context_type: 'crowd_routing' as const,
      input_text: 'overcrowded gate',
      target_language: 'en',
    };

    it('sends POST to /api/insights', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          stadium_id: 's1',
          context_type: 'crowd_routing',
          megaphone_script: 'Move along',
          reasoning: 'reason',
          target_language: 'en',
          recommendations: [],
          timestamp: '',
        }),
      );
      const result = await apiClient.generateInsights(payload);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/insights',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result.megaphone_script).toBe('Move along');
    });

    it('rejects invalid context_type', async () => {
      await expect(
        apiClient.generateInsights({
          ...payload,
          context_type: 'bad' as never,
        }),
      ).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('accepts optional gate_data', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await apiClient.generateInsights({
        ...payload,
        gate_data: [{ gate_id: 'g1', sensor_count: 10, capacity: 100 }],
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.gate_data).toHaveLength(1);
    });
  });

  describe('health', () => {
    it('sends GET to /health (outside /api base)', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          status: 'healthy',
          database: 'connected',
          gemini_configured: true,
          version: '1.0.0',
        }),
      );
      const result = await apiClient.health();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/../health',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.status).toBe('healthy');
    });
  });

  describe('error handling', () => {
    it('throws Error with detail from error response', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ detail: 'Gate capacity exceeded' }, 400),
      );
      await expect(
        apiClient.calculate({
          stadium_id: 's1',
          gates: [{ gate_id: 'g1', sensor_count: 10, capacity: 100 }],
        }),
      ).rejects.toThrow('Gate capacity exceeded');
    });

    it('falls back to HTTP status when body is not JSON', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal Server Error' }),
      );
      await expect(
        apiClient.calculate({
          stadium_id: 's1',
          gates: [{ gate_id: 'g1', sensor_count: 10, capacity: 100 }],
        }),
      ).rejects.toThrow('HTTP 500');
    });

    it('falls back to HTTP status when error body lacks detail', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 422));
      await expect(
        apiClient.calculate({
          stadium_id: 's1',
          gates: [{ gate_id: 'g1', sensor_count: 10, capacity: 100 }],
        }),
      ).rejects.toThrow('HTTP 422');
    });

    it('propagates network failures', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(apiClient.health()).rejects.toThrow('Failed to fetch');
    });
  });
});
