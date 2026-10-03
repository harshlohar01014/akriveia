import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { ThemeColors, lightColors, darkColors } from '../constants/colors';
import { getStoredTheme, saveStoredTheme } from '../services/storage';

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    async function loadTheme() {
      const saved = await getStoredTheme();
      if (saved) {
        setThemeState(saved);
      }
    }
    loadTheme();
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    saveStoredTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      saveStoredTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const colors = useMemo(() => {
    return theme === 'dark' ? darkColors : lightColors;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      colors,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme,
    }),
    [theme, colors, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
