import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Theme, ThemeContextValue } from '@/types';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const defaultTheme: Theme = {
  mode: 'light',
  primaryColor: 'blue',
};

const colorMap = {
  blue: {
    light: 'hsl(207, 90%, 54%)',
    dark: 'hsl(207, 90%, 54%)',
  },
  green: {
    light: 'hsl(142, 71%, 45%)',
    dark: 'hsl(142, 71%, 45%)',
  },
  purple: {
    light: 'hsl(262, 83%, 58%)',
    dark: 'hsl(262, 83%, 58%)',
  },
  red: {
    light: 'hsl(0, 84%, 60%)',
    dark: 'hsl(0, 84%, 60%)',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('financeai-theme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  useEffect(() => {
    localStorage.setItem('financeai-theme', JSON.stringify(theme));
    
    // Apply theme to document
    const root = document.documentElement;
    
    if (theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply primary color
    const colors = colorMap[theme.primaryColor as keyof typeof colorMap];
    if (colors) {
      root.style.setProperty('--primary', colors[theme.mode]);
      root.style.setProperty('--primary-foreground', theme.mode === 'dark' ? 'hsl(0, 0%, 98%)' : 'hsl(211, 100%, 99%)');
    }
  }, [theme]);

  const setTheme = (updates: Partial<Theme>) => {
    setThemeState(prev => ({ ...prev, ...updates }));
  };

  const toggleMode = () => {
    setThemeState(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
    }));
  };

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleMode,
  };

  return (
    <ThemeContext.Provider value={value}>
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
