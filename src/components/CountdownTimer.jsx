'use client';

import { useEffect, useState } from 'react';

function msLeft(expiresAt) {
  const ts = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);
  return ts.getTime() - Date.now();
}

function format(ms) {
  if (ms <= 0) return null;
  const totalMins = Math.floor(ms / 60000);
  const h         = Math.floor(totalMins / 60);
  const m         = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (h < 6)   return `${h}h ${m}m`;
  return `${h}h`;
}

export default function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState(() => msLeft(expiresAt));

  useEffect(() => {
    setRemaining(msLeft(expiresAt));
    const id = setInterval(() => setRemaining(msLeft(expiresAt)), 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const urgent  = remaining > 0 && remaining < 2 * 60 * 60 * 1000;
  const expired = remaining <= 0;

  if (expired) {
    return (
      <span style={{
        fontSize:     11,
        fontWeight:   700,
        color:        'var(--accent)',
        background:   'var(--saved-bg)',
        borderRadius: 'var(--r-full)',
        padding:      '2px 8px',
        whiteSpace:   'nowrap',
      }}>
        Ready
      </span>
    );
  }

  if (urgent) {
    return (
      <span style={{
        fontSize:     11,
        fontWeight:   700,
        color:        '#92400E',
        background:   'rgba(245, 158, 11, 0.12)',
        borderRadius: 'var(--r-full)',
        padding:      '2px 7px',
        whiteSpace:   'nowrap',
      }}>
        ⏰ {format(remaining)}
      </span>
    );
  }

  return (
    <span style={{ fontSize: 11, fontWeight: 500, color: '#BBBBBB', whiteSpace: 'nowrap' }}>
      {format(remaining)}
    </span>
  );
}
