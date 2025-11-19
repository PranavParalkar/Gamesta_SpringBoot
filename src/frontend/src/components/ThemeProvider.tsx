"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Keep both types for compatibility, but default to dark and remove light option.
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force dark theme as the default and single available theme.
    try {
      localStorage.setItem('theme', 'dark');
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // No-op toggle to preserve API shape if some components still call it.
  const toggleTheme = () => {
    // intentionally left blank: light theme removed
    setTheme('dark');
  };

  // Always provide the context, even when not mounted
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
