'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useInsights } from '@/hooks/useInsights';
import { getCurrencySymbol } from '@/constants/currency';
import { BottomNav, Figure, Mood, Rule } from '@/components/Almanac';
import LoadingScreen from '@/components/LoadingScreen';

function barColor(saveRate) {
  if (saveRate >= 80) return 'var(--good)';
  if (saveRate >= 50) return 'var(--accent-ink)';
  return 'var(--warn)';
}

export default function InsightsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { data, loading, error } = useInsights(user?.uid);
  const symbol = getCurrencySymbol(profile?.currency);

  const now   = new Date();
  const month = now.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year  = now.getFullYear();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingScreen />;

  return (
    <div className="p-screen">
      <div className="p-body">

        {/* ── Header ── */}
        <div style={{ padding: '12px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="display" style={{ fontSize: 42, fontStyle: 'italic' }}>Insights</div>
          <div className="eyebrow">{month} · {year}</div>
        </div>

        {error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--warn)' }}>
              Failed to load insights.
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div className="eyebrow">LOADING…</div>
          </div>
        ) : !data || data.totalItems === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--ink-2)', lineHeight: 1.3, marginBottom: 20 }}>
              No patterns yet.
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 28 }}>
              Review a few items to see how your emotions drive your spending.
            </p>
            <Link href="/log" style={{
              fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--accent-ink)',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              LOG YOUR FIRST URGE ↗
            </Link>
          </div>
        ) : (
          <>
            {/* ── Hero figure ── */}
            <div style={{ padding: '36px 24px 26px' }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>
                HELD · ACROSS {data.totalItems} ITEM{data.totalItems !== 1 ? 'S' : ''}
              </div>
              <Figure amount={data.totalSaved} currency={symbol} size={80} italic />
              {/* 2.11 — per-item-held copy */}
              {(() => {
                const heldCount = data.moodBreakdown
                  ? data.moodBreakdown.reduce((sum, m) => sum + (m.saved ?? 0), 0)
                  : 0;
                const divisor  = heldCount > 0
                  ? heldCount
                  : Math.max(1, (data.totalItems || 1) - (data.totalBought || 0));
                const perItem  = data.totalSaved > 0
                  ? (data.totalSaved / divisor).toFixed(0)
                  : '0';
                return (
                  <div style={{ marginTop: 18, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                    That&apos;s{' '}
                    <span style={{ color: 'var(--ink)' }}>
                      {symbol}{perItem} per item held back
                    </span>{' '}
                    — money that stayed in your pocket.
                  </div>
                );
              })()}
            </div>

            {/* ── Triptych: logged / held / bought ── 2.8: CONSIDERED→LOGGED */}
            <div style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                { label: 'LOGGED',  value: data.totalPaused, tone: 'var(--ink)'  },   // 2.8
                { label: 'HELD',    value: data.totalSaved,  tone: 'var(--good)' },
                { label: 'BOUGHT',  value: data.totalBought, tone: 'var(--warn)' },
              ].map((c, i) => (
                <div key={i} style={{
                  padding: '20px 16px', textAlign: 'center',
                  borderRight: i < 2 ? '1px solid var(--rule)' : 'none',
                }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>{c.label}</div>
                  <span className="figure" style={{ fontSize: 26, fontStyle: 'italic', color: c.tone }}>
                    <span className="curr" style={{ fontSize: '0.55em' }}>{symbol}</span>
                    {c.value.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Mood patterns ── */}
            <div style={{ padding: '28px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="display" style={{ fontSize: 26, fontStyle: 'italic' }}>Your moods</div>
              <div className="eyebrow">% HELD</div>
            </div>

            <div style={{ padding: '6px 24px 8px' }}>
              {data.moodBreakdown.map((m, i) => (
                <div key={m.mood} style={{
                  padding: '16px 0',
                  borderBottom: i < data.moodBreakdown.length - 1 ? '1px solid var(--rule)' : '0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <Mood word={m.mood} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em' }}>
                        {m.total} {m.total === 1 ? 'ITEM' : 'ITEMS'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* 2.2 — AT RISK badge: add borderRadius */}
                      {m.saveRate < 40 && (
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.15em',
                          color: 'var(--warn)', border: '1px solid var(--warn)', padding: '2px 6px',
                          borderRadius: 'var(--r-xs)',
                        }}>
                          AT RISK
                        </span>
                      )}
                      <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>
                        {m.saveRate}%
                      </span>
                    </div>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${m.saveRate}%`, background: barColor(m.saveRate) }} />
                  </div>
                </div>
              ))}
            </div>

            {/* ── 1.4: Coming soon block (replaces Pro paywall / UNLOCK button) ── */}
            <div style={{ margin: '28px 24px 36px', padding: '22px', border: '1px solid var(--rule)', borderRadius: 'var(--r)' }}>
              <div className="eyebrow accent" style={{ marginBottom: 10 }}>COMING SOON</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.2, color: 'var(--ink)' }}>
                Hour-of-day, merchant<br />and category breakdowns.
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
                  PRO INSIGHTS · ARRIVING SOON
                </span>
              </div>
            </div>
          </>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
