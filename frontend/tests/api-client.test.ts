import { describe, it, expect } from 'vitest';
import { z } from 'zod';

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

describe('API client Zod validation', () => {
  describe('calculateRequestSchema', () => {
    it('validates correct payload', () => {
      const payload = {
        stadium_id: 'stadium-1',
        gates: [{ gate_id: 'gate-a', sensor_count: 1200, capacity: 5000 }],
      };
      expect(() => calculateRequestSchema.parse(payload)).not.toThrow();
      const result = calculateRequestSchema.parse(payload);
      expect(result.stadium_id).toBe('stadium-1');
      expect(result.gates).toHaveLength(1);
    });

    it('rejects empty gates array', () => {
      const payload = { stadium_id: 'stadium-1', gates: [] };
      expect(() => calculateRequestSchema.parse(payload)).toThrow();
    });

    it('rejects negative sensor_count', () => {
      const payload = {
        stadium_id: 'stadium-1',
        gates: [{ gate_id: 'gate-a', sensor_count: -5, capacity: 5000 }],
      };
      expect(() => calculateRequestSchema.parse(payload)).toThrow();
    });

    it('rejects missing stadium_id', () => {
      const payload = {
        gates: [{ gate_id: 'gate-a', sensor_count: 100, capacity: 5000 }],
      };
      expect(() => calculateRequestSchema.parse(payload)).toThrow();
    });

    it('rejects gate with zero capacity', () => {
      const payload = {
        stadium_id: 'stadium-1',
        gates: [{ gate_id: 'gate-a', sensor_count: 100, capacity: 0 }],
      };
      expect(() => calculateRequestSchema.parse(payload)).toThrow();
    });

    it('rejects non-integer sensor_count', () => {
      const payload = {
        stadium_id: 'stadium-1',
        gates: [{ gate_id: 'gate-a', sensor_count: 100.5, capacity: 5000 }],
      };
      expect(() => calculateRequestSchema.parse(payload)).toThrow();
    });

    it('rejects sensor_count exceeding max', () => {
      const payload = {
        stadium_id: 'stadium-1',
        gates: [{ gate_id: 'gate-a', sensor_count: 200000, capacity: 5000 }],
      };
      expect(() => calculateRequestSchema.parse(payload)).toThrow();
    });

    it('rejects if gates array exceeds 200 entries', () => {
      const gates = Array.from({ length: 201 }, (_, i) => ({
        gate_id: `gate-${i}`,
        sensor_count: 100,
        capacity: 1000,
      }));
      expect(() => calculateRequestSchema.parse({ stadium_id: 's1', gates })).toThrow();
    });
  });

  describe('entryRequestSchema', () => {
    it('validates correct payload', () => {
      const payload = {
        device_id: 'vol-abc12345',
        activity_type: 'crowd_report',
        description: 'Crowd forming near Gate A',
        severity: 'info',
      };
      expect(() => entryRequestSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid activity_type', () => {
      const payload = {
        device_id: 'vol-abc12345',
        activity_type: 'invalid_type',
        description: 'Test',
        severity: 'info',
      };
      expect(() => entryRequestSchema.parse(payload)).toThrow();
    });

    it('rejects invalid severity', () => {
      const payload = {
        device_id: 'vol-abc12345',
        activity_type: 'crowd_report',
        description: 'Test',
        severity: 'emergency',
      };
      expect(() => entryRequestSchema.parse(payload)).toThrow();
    });

    it('accepts optional location field', () => {
      const payload = {
        device_id: 'vol-abc12345',
        activity_type: 'shift_checkin',
        description: 'Checked in at station',
        severity: 'info',
        location: 'Concourse B',
      };
      expect(() => entryRequestSchema.parse(payload)).not.toThrow();
    });

    it('rejects empty description', () => {
      const payload = {
        device_id: 'vol-abc12345',
        activity_type: 'other',
        description: '',
        severity: 'info',
      };
      expect(() => entryRequestSchema.parse(payload)).toThrow();
    });

    it('rejects empty device_id', () => {
      const payload = {
        device_id: '',
        activity_type: 'fan_assist',
        description: 'Test',
        severity: 'info',
      };
      expect(() => entryRequestSchema.parse(payload)).toThrow();
    });
  });

  describe('insightsRequestSchema', () => {
    it('validates correct payload', () => {
      const payload = {
        stadium_id: 'stadium-1',
        context_type: 'crowd_routing',
        input_text: 'Gate A is overcrowded',
        target_language: 'en',
      };
      expect(() => insightsRequestSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid context_type', () => {
      const payload = {
        stadium_id: 'stadium-1',
        context_type: 'unknown_context',
        input_text: 'Test',
        target_language: 'en',
      };
      expect(() => insightsRequestSchema.parse(payload)).toThrow();
    });

    it('accepts optional gate_data', () => {
      const payload = {
        stadium_id: 'stadium-1',
        context_type: 'fan_translation',
        input_text: 'Welcome fans',
        target_language: 'es',
        gate_data: [{ gate_id: 'gate-a', sensor_count: 500, capacity: 3000 }],
      };
      expect(() => insightsRequestSchema.parse(payload)).not.toThrow();
    });

    it('rejects empty input_text', () => {
      const payload = {
        stadium_id: 'stadium-1',
        context_type: 'crowd_routing',
        input_text: '',
        target_language: 'en',
      };
      expect(() => insightsRequestSchema.parse(payload)).toThrow();
    });

    it('rejects target_language shorter than 2 characters', () => {
      const payload = {
        stadium_id: 'stadium-1',
        context_type: 'facility_alert',
        input_text: 'Issue at gate',
        target_language: 'e',
      };
      expect(() => insightsRequestSchema.parse(payload)).toThrow();
    });

    it('rejects target_language longer than 10 characters', () => {
      const payload = {
        stadium_id: 'stadium-1',
        context_type: 'facility_alert',
        input_text: 'Issue at gate',
        target_language: 'english-spanish',
      };
      expect(() => insightsRequestSchema.parse(payload)).toThrow();
    });
  });
});
