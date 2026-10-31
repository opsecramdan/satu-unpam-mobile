import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState(null); // null = follow system, 'dark', 'light'

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('theme-mode');
        if (saved) setMode(saved);
      } catch {}
    })();
  }, []);

  const isDark = mode === 'dark' ? true : mode === 'light' ? false : systemScheme === 'dark';

  const toggle = async () => {
    const next = isDark ? 'light' : 'dark';
    setMode(next);
    try { await SecureStore.setItemAsync('theme-mode', next); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle, mode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
