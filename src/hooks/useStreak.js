'use client';

const KEY = 'pause_streak';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { lastDate: null, current: 0, longest: 0 };
  } catch {
    return { lastDate: null, current: 0, longest: 0 };
  }
}

/** Call this whenever the user takes a meaningful action (log or review). */
export function recordActivity() {
  if (typeof window === 'undefined') return;
  const today     = todayStr();
  const yesterday = yesterdayStr();
  const streak    = read();

  if (streak.lastDate === today) return streak; // Already counted today

  const newCurrent = streak.lastDate === yesterday ? streak.current + 1 : 1;
  const updated = {
    lastDate: today,
    current:  newCurrent,
    longest:  Math.max(streak.longest, newCurrent),
  };
  try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
  return updated;
}

/** Read the current streak state (client-side only). */
export function getStreakData() {
  if (typeof window === 'undefined') return null;
  const today     = todayStr();
  const yesterday = yesterdayStr();
  const streak    = read();

  if (!streak.lastDate) return { current: 0, longest: 0, active: false };

  // If last action wasn't today or yesterday, streak is broken
  if (streak.lastDate !== today && streak.lastDate !== yesterday) {
    return { current: 0, longest: streak.longest, active: false };
  }
  return { ...streak, active: streak.current > 0 };
}
