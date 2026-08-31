import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useSearch = create<SearchState>()(
  persist(
    (set) => ({
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    { name: 'hedger-search' }
  )
);