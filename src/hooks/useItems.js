'use client';

import { useEffect, useState } from 'react';
import { subscribeToWaitingItems } from '@/lib/firestore';

export function useItems(userId) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToWaitingItems(userId, data => {
      setItems(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { items, loading };
}
