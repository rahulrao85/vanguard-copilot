import { create } from 'zustand';

export type Persona = 'fan' | 'organizer' | 'volunteer' | 'staff';

interface RoleState {
  persona: Persona;
  setPersona: (p: Persona) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  persona: 'volunteer',
  setPersona: (persona) => set({ persona }),
}));
