'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MOODS } from '@/constants/moods';

export function useInsights(userId) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!userId) return;

    async function compute() {
      setLoading(true);
      setError(false);

      const snap = await getDocs(query(
        collection(db, 'items'),
        where('userId', '==', userId),
        where('status', 'in', ['bought', 'saved']),
      ));

      const items = snap.docs.map(d => d.data());

      const moodStats = {};
      MOODS.forEach(m => { moodStats[m.id] = { total: 0, saved: 0 }; });

      items.forEach(item => {
        if (moodStats[item.mood]) {
          moodStats[item.mood].total++;
          if (item.status === 'saved') moodStats[item.mood].saved++;
        }
      });

      const moodBreakdown = MOODS
        .filter(m => moodStats[m.id].total > 0)
        .map(m => ({
          mood:     m.id,
          emoji:    m.emoji,
          label:    m.label,
          total:    moodStats[m.id].total,
          saved:    moodStats[m.id].saved,
          saveRate: Math.round((moodStats[m.id].saved / moodStats[m.id].total) * 100),
        }))
        .sort((a, b) => b.total - a.total);

      const withPrice   = items.filter(i => i.price != null && i.price >= 0);
      const totalPaused = withPrice.reduce((s, i) => s + i.price, 0);
      const totalSaved  = withPrice.filter(i => i.status === 'saved').reduce((s, i) => s + i.price, 0);
      const totalBought = withPrice.filter(i => i.status === 'bought').reduce((s, i) => s + i.price, 0);

      setData({
        totalItems:     items.length,
        totalPaused:    Math.round(totalPaused * 100) / 100,
        totalSaved:     Math.round(totalSaved  * 100) / 100,
        totalBought:    Math.round(totalBought * 100) / 100,
        overallSaveRate: items.length > 0
          ? Math.round((items.filter(i => i.status === 'saved').length / items.length) * 100)
          : 0,
        moodBreakdown,
      });
      setLoading(false);
    }

    compute().catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [userId]);

  return { data, loading, error };
}
