'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';
import { useSavedTotal } from '@/hooks/useSavedTotal';
import { useInsights } from '@/hooks/useInsights';
import { useBadge } from '@/hooks/useBadge';
import { getCurrencySymbol } from '@/constants/currency';
import { BottomNav, Figure, Mood, Thumb } from '@/components/Almanac';
import LoadingScreen from '@/components/LoadingScreen';
import OnboardingModal from '@/components/OnboardingModal';

const FOUR_HOURS = 4 * 60 * 60 * 1000;

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

function ageLabel(expiresAt) {
  const ts       = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const loggedAt = ts.getTime() - 24 * 60 * 60 * 1000;
  const ms       = Date.now() - loggedAt;
  const h        = Math.floor(ms / 3600000);
  const m        = Math.floor((ms % 3600000) / 60000);
  if (h < 1)  return `${m}m`;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, loading: itemsLoading }        = useItems(user?.uid);
  const { total: savedTotal }                   = useSavedTotal(user?.uid);
  const { data: insightsData }                  = useInsights(user?.uid);
  const { setCount }                            = useBadge();
  const symbol                                  = getCurrencySymbol(profile?.currency);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem('pause_onboarded')) setShowOnboarding(true); } catch {}
  }, []);

  useEffect(() => {
    if (itemsLoading || !items) return;
    const expiring = items.filter(item => {
      const ts = item.expiresAt?.toDate ? item.expiresAt.toDate() : new Date(item.expiresAt);
      return ts.getTime() - Date.now() < FOUR_HOURS;
    }).length;
    setCount(expiring);
  }, [items, itemsLoading, setCount]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingScreen />;

  function handleOnboardingDone() {
    try { localStorage.setItem('pause_onboarded', 'true'); } catch {}
    setShowOnboarding(false);
  }

  const heldYTD     = savedTotal ?? 0;
  const totalItems  = insightsData?.totalItems ?? 0;
  const savedCount  = insightsData
    ? Math.round(totalItems * (insightsData.overallSaveRate / 100))
    : 0;
  const boughtCount = totalItems - savedCount;

  return (
    <div className="p-screen">
      {showOnboarding && <OnboardingModal onDone={handleOnboardingDone} />}

      <div className="p-body">

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div className="eyebrow" style={{ color: 'var(--ink-2)' }}>PAUSE</div>
          <div className="eyebrow">{todayLabel()}</div>
        </div>

        {/* ── Held total — the number is the hero ── */}
        <div style={{ padding: '4px 24px 8px' }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--ink-4)' }}>
            HELD THIS YEAR
          </div>
          <Figure amount={heldYTD} currency={symbol} size={88} />
        </div>

        {/* ── Spark + counts ── */}
        {totalItems > 0 && (
          <div style={{ padding: '0 24px 24px' }}>
            {/* Held / bought bar */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 10, height: 4 }}>
              {Array.from({ length: Math.min(totalItems, 32) }).map((_, i) => {
                const held = Math.round(savedCount / Math.max(totalItems, 1) * Math.min(totalItems, 32));
                return (
                  <div key={i} style={{
                    flex: 1, height: '100%',
                    background: i < held ? 'var(--accent)' : 'var(--paper-4)',
                    borderRadius: 2,
                  }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>{savedCount} held</span>
              <span className="eyebrow" style={{ color: 'var(--warn)' }}>{boughtCount} bought</span>
            </div>
          </div>
        )}

        <div className="rule" />

        {/* ── Queue header ── */}
        {!itemsLoading && (
          <div style={{
            padding: '20px 24px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {items.length === 0
                ? 'Nothing waiting'
                : `${items.length} waiting`}
            </div>
            {items.length > 0 && (
              <Link href={`/review?id=${items[0].id}`} style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--accent)',
              }}>
                Review →
              </Link>
            )}
          </div>
        )}

        {/* ── Queue items ── */}
        {itemsLoading ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div className="eyebrow">LOADING…</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '40px 24px 32px' }}>
            <div style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              Add something you're thinking about buying.<br />
              Check back in 24 hours.
            </div>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(`/review?id=${item.id}`)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 24px',
                  borderBottom: '1px solid var(--rule)',
                  width: '100%', boxSizing: 'border-box',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Thumb
                  src={item.imageUrl || undefined}
                  mood={item.mood}
                  label={item.name}
                  size={48}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: 'var(--ink)',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 3,
                  }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.price != null && (
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--ink-2)',
                        letterSpacing: '-0.02em',
                      }}>
                        {symbol}{item.price}
                      </span>
                    )}
                    {item.mood && <Mood word={item.mood} />}
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 500, color: 'var(--ink-4)',
                  letterSpacing: '0.02em', flexShrink: 0,
                }}>
                  {ageLabel(item.expiresAt)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Add button ── */}
        <div style={{ padding: '20px 24px 40px' }}>
          <Link href="/log" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, width: '100%', minHeight: 48,
            border: '1.5px dashed var(--rule)',
            borderRadius: 'var(--r)',
            color: 'var(--ink-4)',
            textDecoration: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              + Add an item
            </span>
          </Link>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
