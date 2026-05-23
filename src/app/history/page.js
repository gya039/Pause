'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToHistory } from '@/lib/firestore';
import { MOOD_MAP } from '@/constants/moods';
import { getCurrencySymbol } from '@/constants/currency';
import { BottomNav, Thumb, Mood } from '@/components/Almanac';
import LoadingScreen from '@/components/LoadingScreen';

const MOOD_TONE = { anxious: 'terra', tired: 'cool', happy: 'warm', bored: 'ink', calm: 'cool' };

// Returns a day-label string for grouping: "Today", "Yesterday", "21 May", etc.
function dayLabel(ts) {
  if (!ts) return '';
  const date  = ts.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const diff  = Math.floor((today.setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Group an array of items by their dayLabel
function groupByDay(items) {
  const groups = [];
  for (const item of items) {
    const label = dayLabel(item.reviewedAt);
    const last  = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

const FILTERS = [
  { id: 'all',    label: 'All'    },
  { id: 'saved',  label: 'Held'   },   // our DB uses 'saved'; display as 'Held'
  { id: 'bought', label: 'Bought' },
];

export default function HistoryPage() {
  const router  = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const symbol  = getCurrencySymbol(profile?.currency);

  const [filter,  setFilter]  = useState('all');
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/auth'); return; }
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToHistory(user.uid, filter, data => {
      setItems(data);
      setLoading(false);
    });
    return unsub;
  }, [user, authLoading, filter, router]);

  if (authLoading || !user) return <LoadingScreen />;

  const groups = groupByDay(items);

  return (
    <div className="p-screen">
      <div className="p-body">

        {/* ── Header ── */}
        <div style={{ padding: '12px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="display" style={{ fontSize: 42, fontStyle: 'italic' }}>History</div>
          {!loading && <div className="eyebrow">{items.length} ENTRIES</div>}
        </div>

        {/* ── Filter tabs ── */}
        <div style={{ padding: '18px 24px 14px', display: 'flex', gap: 20, alignItems: 'center' }}>
          {FILTERS.map(f => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  all: 'unset', cursor: 'pointer', padding: '4px 0',
                  fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color:        active ? 'var(--ink)' : 'var(--ink-3)',
                  borderBottom: active ? '1px solid var(--accent)' : '1px solid transparent',
                  minHeight: 32,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="rule" />

        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div className="eyebrow">LOADING…</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.3 }}>
              {filter === 'all' ? 'No history yet.' : `No ${filter === 'saved' ? 'held' : 'bought'} items.`}
            </div>
            <Link href="/log" style={{
              fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--accent-ink)',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              ADD YOUR FIRST PAUSE ↗
            </Link>
          </div>
        ) : (
          <>
            {groups.map((group, gi) => (
              <div key={gi}>
                {/* Day header */}
                <div style={{
                  padding: '16px 24px 8px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  background: 'var(--paper)',
                }}>
                  <div className="eyebrow ink">{group.label.toUpperCase()}</div>
                  <div className="eyebrow">
                    {group.items.length} ENTR{group.items.length === 1 ? 'Y' : 'IES'}
                  </div>
                </div>

                {/* Items */}
                {group.items.map((item, ei) => {
                  const isSaved = item.status === 'saved';
                  const mood    = MOOD_MAP[item.mood];
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/review?id=${item.id}`)}
                      style={{
                        all: 'unset', cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr auto',
                        gap: 14, alignItems: 'center',
                        padding: '14px 24px',
                        borderTop: '1px solid var(--rule)',
                        width: '100%', boxSizing: 'border-box',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Thumb
                        src={item.imageUrl || undefined}
                        mood={item.mood}
                        label={item.name}
                        size={40}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 500, color: 'var(--ink)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          marginBottom: 3,
                        }}>
                          {item.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          {item.price != null && (
                            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-2)' }}>
                              {symbol}{item.price}
                            </span>
                          )}
                          {item.price != null && item.mood && (
                            <span style={{ color: 'var(--ink-4)' }}>·</span>
                          )}
                          {item.mood && <Mood word={item.mood} />}
                        </div>
                      </div>
                      {/* Status — serif italic in semantic color */}
                      <div style={{
                        fontFamily:  'var(--serif)',
                        fontStyle:   'italic',
                        fontSize:    14,
                        color:       isSaved ? 'var(--good)' : 'var(--warn)',
                        letterSpacing: '0.005em',
                        flexShrink: 0,
                      }}>
                        {isSaved ? 'held.' : 'bought.'}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* End marker */}
            <div style={{ padding: '24px 24px 36px', textAlign: 'center' }}>
              <div className="eyebrow">END</div>
            </div>
          </>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
