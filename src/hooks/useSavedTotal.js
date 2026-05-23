'use client';

import { useState, useEffect } from 'react';
import { getSavedTotal } from '@/lib/firestore';

export function useSavedTotal(userId) {
  const [total,   setTotal]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    getSavedTotal(userId)
      .then(t => { setTotal(t); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  return { total, loading };
}
