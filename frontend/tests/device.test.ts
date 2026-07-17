import { describe, it, expect, beforeEach } from 'vitest';
import { getDeviceId, resetDeviceId } from '../src/utils/device';

describe('getDeviceId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a string starting with "vol-"', () => {
    const id = getDeviceId();
    expect(typeof id).toBe('string');
    expect(id.startsWith('vol-')).toBe(true);
  });

  it('returns same ID on subsequent calls', () => {
    const id1 = getDeviceId();
    const id2 = getDeviceId();
    const id3 = getDeviceId();
    expect(id1).toBe(id2);
    expect(id2).toBe(id3);
  });

  it('resetDeviceId clears the stored ID', () => {
    const id = getDeviceId();
    expect(localStorage.getItem('vanguard_device_id')).toBe(id);

    resetDeviceId();
    expect(localStorage.getItem('vanguard_device_id')).toBeNull();
  });

  it('new ID generated after reset', () => {
    const id1 = getDeviceId();
    resetDeviceId();
    const id2 = getDeviceId();
    expect(id1).not.toBe(id2);
    expect(id2.startsWith('vol-')).toBe(true);
  });

  it('returns consistent format with 12 character suffix', () => {
    const id = getDeviceId();
    expect(id).toMatch(/^vol-[a-f0-9]{8}$/);
  });
});
