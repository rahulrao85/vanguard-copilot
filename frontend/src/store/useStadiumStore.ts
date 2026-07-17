import { create } from 'zustand';
import { STADIUMS, type Stadium } from '../theme';

interface StadiumState {
  selectedStadium: Stadium;
  setStadium: (stadium: Stadium) => void;
}

export const useStadiumStore = create<StadiumState>((set) => ({
  selectedStadium: STADIUMS[0],
  setStadium: (stadium) => set({ selectedStadium: stadium }),
}));
