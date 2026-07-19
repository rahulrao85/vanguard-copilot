import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTelemetry } from '../src/hooks/useTelemetry';

class MockEventSource {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(_url: string) {
    setTimeout(() => {
      this.onopen?.();
    }, 0);
  }
}

describe('useTelemetry', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns initial state with isConnected false', () => {
    const { result } = renderHook(() => useTelemetry(true));
    expect(result.current.telemetry).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('connects when enabled', async () => {
    const { result } = renderHook(() => useTelemetry(true));
    await vi.waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('does not connect when disabled', () => {
    const { result } = renderHook(() => useTelemetry(false));
    expect(result.current.telemetry).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });
});
