'use client';

import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pause_theme') || 'light';
      setTheme(saved);
    } catch {}
  }, []);

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('pause_theme', next);
      document.documentElement.setAttribute('data-theme', next);
    } catch {}
  }

  return { theme, isDark: theme === 'dark', toggle };
}
