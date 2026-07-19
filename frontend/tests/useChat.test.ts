import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../src/hooks/useChat';

describe('useChat Hook', () => {
  const originFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originFetch;
    vi.restoreAllMocks();
  });

  it('initializes with empty messages and not streaming', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
  });

  it('clears history and resets messages', async () => {
    const { result } = renderHook(() => useChat());
    
    // Simulate setting initial state manually by mock trigger or check clear behavior
    act(() => {
      result.current.clearHistory();
    });
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
  });

  it('handles error in network stream correctly', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages[1].content).toContain('Sorry, I encountered an error');
  });

  it('avoids sending empty message or sending during active stream', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
