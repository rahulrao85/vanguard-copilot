import { describe, it, expect, beforeEach } from 'vitest';
import { useRoleStore } from '../src/store/useRoleStore';

describe('useRoleStore', () => {
  beforeEach(() => {
    useRoleStore.setState({ persona: 'volunteer' });
  });

  it('defaults to volunteer persona', () => {
    const { persona } = useRoleStore.getState();
    expect(persona).toBe('volunteer');
  });

  it('setPersona updates persona to fan', () => {
    useRoleStore.getState().setPersona('fan');
    expect(useRoleStore.getState().persona).toBe('fan');
  });

  it('setPersona updates persona to organizer', () => {
    useRoleStore.getState().setPersona('organizer');
    expect(useRoleStore.getState().persona).toBe('organizer');
  });

  it('setPersona updates persona to staff', () => {
    useRoleStore.getState().setPersona('staff');
    expect(useRoleStore.getState().persona).toBe('staff');
  });

  it('setPersona updates persona back to volunteer', () => {
    useRoleStore.getState().setPersona('fan');
    useRoleStore.getState().setPersona('volunteer');
    expect(useRoleStore.getState().persona).toBe('volunteer');
  });
});
