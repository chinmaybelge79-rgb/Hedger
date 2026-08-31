import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  isReading: boolean;
  toggleDark: () => void;
  toggleReading: () => void;
  setDark: (value: boolean) => void;
  setReading: (value: boolean) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      isReading: false,
      toggleDark: () => {
        const newValue = !get().isDark;
        set({ isDark: newValue });
        if (newValue) document.body.classList.add('dark');
        else document.body.classList.remove('dark');
      },
      toggleReading: () => {
        const newValue = !get().isReading;
        set({ isReading: newValue });
        if (newValue) document.body.classList.add('reading-mode');
        else document.body.classList.remove('reading-mode');
      },
      setDark: (value: boolean) => {
        set({ isDark: value });
        if (value) document.body.classList.add('dark');
        else document.body.classList.remove('dark');
      },
      setReading: (value: boolean) => {
        set({ isReading: value });
        if (value) document.body.classList.add('reading-mode');
        else document.body.classList.remove('reading-mode');
      },
    }),
    { name: 'hedger-theme' }
  )
);