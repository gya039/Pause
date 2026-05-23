'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';
import { useSavedTotal } from '@/hooks/useSavedTotal';
import { useInsights } from '@/hooks/useInsights';
import { useBadge } from '@/hooks/useBadge';
import { getReviewStreak } from '@/lib/firestore';
import { getCurrencySymbol } from '@/constants/currency';
import { BottomNav, Figure, Mood, Thumb } from '@/components/Almanac';
import LoadingScreen from '@/components/LoadingScreen';
import OnboardingModal from '@/components/OnboardingModal';

const FOUR_HOURS = 4 * 60 * 60 * 1000;
const TWO_HOURS  = 2 * 60 * 60 * 1000;  // 2.12

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

// 2.9 — contextual greeting based on time of day
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
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

// 2.12 — returns true when item expires in under 2 hours
function isExpiringSoon(expiresAt) {
  const ts = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const remaining = ts.getTime() - Date.now();
  return remaining < TWO_HOURS && remaining > 0;
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
  const [streak, setStreak]                 = useState(0);   // 3.3

  useEffect(() => {
    try { if (!localStorage.getItem('pause_onboarded')) setShowOnboarding(true); } catch {}
  }, []);

  // 3.3 — fetch review streak once on load
  useEffect(() => {
    if (!user) return;
    getReviewStreak(user.uid).then(setStreak).catch(() => {});
  }, [user]);

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
          {/* 2.9 — time-of-day greeting instead of static "PAUSE" */}
          <div className="eyebrow" style={{ color: 'var(--ink-2)' }}>{greeting()}</div>
          <div className="eyebrow">{todayLabel()}</div>
        </div>

        {/* ── Held total — hero number ── 2.4: more breathing room */}
        <div style={{ padding: '16px 24px 20px' }}>
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

        {/* 3.3 — Streak indicator (only when >= 3 consecutive review days) */}
        {streak >= 3 && (
          <div style={{ padding: '0 24px 20px' }}>
            <div className="eyebrow" style={{ color: 'var(--accent-ink)' }}>
              {streak}-DAY STREAK
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
          /* 2.13 — improved empty state */
          <div style={{ padding: '40px 24px 32px' }}>
            <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 16 }}>
              Your queue is clear.
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 20 }}>
              See something you want? Add it and come back in 24 hours.
            </div>
            <Link href="/history" style={{
              fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--accent-ink)',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              SEE YOUR HISTORY →
            </Link>
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
                    {/* 2.3 — serif italic for prices, consistent with History */}
                    {item.price != null && (
                      <span style={{
                        fontFamily: 'var(--serif)', fontStyle: 'italic',
                        fontSize: 13, color: 'var(--ink-2)',
                      }}>
                        {symbol}{item.price}
                      </span>
                    )}
                    {item.mood && <Mood word={item.mood} />}
                  </div>
                </div>
                {/* 2.12 — amber + ⚡ when < 2 hours remain */}
                <div style={{
                  fontSize: 11, fontWeight: 500,
                  color: isExpiringSoon(item.expiresAt) ? 'var(--amber)' : 'var(--ink-4)',
                  letterSpacing: '0.02em', flexShrink: 0,
                }}>
                  {isExpiringSoon(item.expiresAt) ? '⚡ ' : ''}{ageLabel(item.expiresAt)}
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
