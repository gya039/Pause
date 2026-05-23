'use client';

import { useRouter } from 'next/navigation';
import CountdownTimer from './CountdownTimer';
import { MOOD_MAP } from '@/constants/moods';
import { useAuth } from '@/hooks/useAuth';
import { getCurrencySymbol } from '@/constants/currency';

export default function ItemCard({ item }) {
  const router      = useRouter();
  const { profile } = useAuth();
  const mood        = MOOD_MAP[item.mood];
  const symbol      = getCurrencySymbol(profile?.currency);
  const hasImage    = Boolean(item.imageUrl);

  const press   = e => { e.currentTarget.style.transform = 'scale(0.974)'; e.currentTarget.style.opacity = '0.88'; };
  const release = e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = ''; };

  return (
    <button
      onClick={() => router.push(`/review?id=${item.id}`)}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        width:        '100%',
        textAlign:    'left',
        background:   'var(--surface)',
        border:       '1px solid rgba(0, 0, 0, 0.04)',
        borderRadius: 16,
        padding:      '12px 14px',
        cursor:       'pointer',
        boxShadow:    'var(--shadow-sm)',
        transition:   'transform 0.14s, opacity 0.14s',
        fontFamily:   'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Thumbnail — 44×44, mood bg if no photo */}
      <div style={{
        width:        44,
        height:       44,
        borderRadius: 10,
        flexShrink:   0,
        overflow:     'hidden',
        background:   hasImage ? 'var(--surface2)' : (mood?.bg ?? 'var(--surface2)'),
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
      }}>
        {hasImage ? (
          <img src={item.imageUrl} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 20 }}>{mood?.emoji ?? '🛍️'}</span>
        )}
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: name + timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
          <span style={{
            fontWeight:   600,
            fontSize:     13,
            color:        'var(--t1)',
            letterSpacing: '-0.2px',
            lineHeight:   1.25,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            flex:         1,
          }}>
            {item.name}
          </span>
          <CountdownTimer expiresAt={item.expiresAt} />
        </div>

        {/* Row 2: price + mood chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {item.price != null && (
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
              {symbol}{item.price}
            </span>
          )}
          {mood && (
            <span style={{
              fontSize:     10,
              fontWeight:   600,
              color:        'var(--t2)',
              background:   '#F0EDE8',
              borderRadius: 20,
              padding:      '2px 8px',
              lineHeight:   1.4,
              flexShrink:   0,
            }}>
              {mood.emoji} {mood.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
