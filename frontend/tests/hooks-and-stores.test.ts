import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoleStore } from '../src/store/useRoleStore';
import { useDirection } from '../src/hooks/useDirection';
import { useTelemetry } from '../src/hooks/useTelemetry';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

describe('useRoleStore', () => {
  it('has volunteer as default role and changes role', () => {
    const { result } = renderHook(() => useRoleStore());
    expect(result.current.persona).toBe('volunteer');
    
    act(() => {
      result.current.setPersona('fan');
    });
    expect(result.current.persona).toBe('fan');
  });
});

describe('useDirection', () => {
  it('returns ltr for default language', () => {
    const { result } = renderHook(() => useDirection());
    expect(result.current).toBe('ltr');
  });
});

describe('useTelemetry', () => {
  it('initializes with null telemetry and disconnected', () => {
    const { result } = renderHook(() => useTelemetry(false));
    expect(result.current.telemetry).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });
});
