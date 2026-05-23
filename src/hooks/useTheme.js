'use client';

import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [theme,         setTheme]         = useState('light');
  const [followsSystem, setFollowsSystem] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pause_theme');
      if (saved === 'dark' || saved === 'light') {
        // Manual override set previously
        setTheme(saved);
        setFollowsSystem(false);
        document.documentElement.setAttribute('data-theme', saved);
        if (saved === 'light') document.documentElement.removeAttribute('data-theme');
      } else {
        // No manual preference — follow system
        setFollowsSystem(true);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = prefersDark ? 'dark' : 'light';
        setTheme(initial);
        if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
      }
    } catch {}
  }, []);

  // Listen for system preference changes when following system
  useEffect(() => {
    if (!followsSystem) return;
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        const next = e.matches ? 'dark' : 'light';
        setTheme(next);
        if (e.matches) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {}
  }, [followsSystem]);

  // Manual toggle — disables system-following
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    setFollowsSystem(false);
    try {
      localStorage.setItem('pause_theme', next);
      if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    } catch {}
  }

  // Enable follow-system: remove manual pref and sync immediately
  const enableFollowSystem = useCallback(() => {
    setFollowsSystem(true);
    try {
      localStorage.removeItem('pause_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const next = prefersDark ? 'dark' : 'light';
      setTheme(next);
      if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    } catch {}
  }, []);

  // Disable follow-system: write current theme as manual pref
  const disableFollowSystem = useCallback(() => {
    setFollowsSystem(false);
    try {
      localStorage.setItem('pause_theme', theme);
    } catch {}
  }, [theme]);

  return {
    theme,
    isDark: theme === 'dark',
    toggle,
    followsSystem,
    setFollowSystem: (on) => {
      if (on) enableFollowSystem();
      else disableFollowSystem();
    },
  };
}
