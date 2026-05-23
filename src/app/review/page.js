'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getItem, reviewItem, getSavedTotal } from '@/lib/firestore';
import { getCurrencySymbol } from '@/constants/currency';
import { MOOD_MAP } from '@/constants/moods';
import { recordActivity } from '@/hooks/useStreak';
import LoadingScreen from '@/components/LoadingScreen';
import { Figure, Arrow, Rule, Mood } from '@/components/Almanac';

const MOOD_COPY = {
  anxious: { color: 'var(--warn)',   lead: 'You were anxious when you added this.', tail: 'That feeling has likely passed.'                        },
  tired:   { color: 'var(--ink-3)', lead: 'You were tired when you added this.',   tail: 'Rest first — it\'ll still be here tomorrow.'            },
  happy:   { color: 'var(--good)',  lead: 'You were happy when you added this.',   tail: 'If you\'re still happy without it, that\'s the answer.' },
  bored:   { color: 'var(--amber)', lead: 'You were bored when you added this.',   tail: 'Boredom rarely makes the best buyer.'                   },
  calm:    { color: 'var(--cool)',  lead: 'You were calm when you added this.',    tail: 'Trust that decision. Or don\'t. Either way, deliberate.'},
  default: { color: 'var(--ink-2)', lead: 'You added this 24 hours ago.',          tail: 'Whatever you felt then may have changed.'               },
};

function getHostname(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function pausedAgo(expiresAt) {
  const ts       = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const loggedMs = ts.getTime() - 24 * 60 * 60 * 1000;
  const h        = Math.round((Date.now() - loggedMs) / 3600000);
  return h < 48 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

export default function ReviewPage() {
  const router  = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const symbol  = getCurrencySymbol(profile?.currency);

  const [item,       setItem]       = useState(null);
  const [pageState,  setPageState]  = useState('loading');
  const [decision,   setDecision]   = useState(null);
  const [savedTotal, setSavedTotal] = useState(0);
  const [busy,       setBusy]       = useState(false);
  const [confetti,   setConfetti]   = useState(false);
  const [copied,     setCopied]     = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/auth'); return; }
    if (!user) return;
    const params     = new URLSearchParams(window.location.search);
    const itemId     = params.get('id');
    const autoChoice = params.get('decision');
    if (!itemId) { setPageState('error'); return; }
    async function load() {
      const data = await getItem(itemId);
      if (!data || data.userId !== user.uid) { setPageState('error'); return; }
      setItem(data);
      const total = await getSavedTotal(user.uid);
      setSavedTotal(total);
      if (data.status !== 'waiting') { setDecision(data.status); setPageState('decided'); return; }
      if (autoChoice === 'bought' || autoChoice === 'saved') {
        await doSubmit(itemId, data, autoChoice, total);
      } else {
        setPageState('ready');
      }
    }
    load().catch(() => setPageState('error'));
  }, [user, authLoading]); // eslint-disable-line

  async function doSubmit(itemId, itemData, choice, currentTotal) {
    setBusy(true);
    await reviewItem(itemId, choice);
    recordActivity();
    setDecision(choice);
    if (choice === 'saved') {
      setSavedTotal(currentTotal + (itemData?.price ?? 0));
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
    }
    setPageState('decided');
    setBusy(false);
  }

  function handleDecision(choice) {
    if (busy || !item) return;
    const id = new URLSearchParams(window.location.search).get('id');
    doSubmit(id, item, choice, savedTotal);
  }

  async function handleShare() {
    const text = `I passed on "${item?.name}"${item?.price ? ` (${symbol}${item.price})` : ''}. Saved ${symbol}${savedTotal.toFixed(2)} by pausing impulse buys. https://pause-d4fe8.web.app`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Pause', text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled */ }
  }

  const moodCopy = MOOD_COPY[item?.mood] || MOOD_COPY.default;
  const isSaved  = decision === 'saved';

  if (authLoading || (pageState === 'loading' && user)) return <LoadingScreen />;

  /* ── Error ── */
  if (pageState === 'error') {
    return (
      <div className="p-screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 26, color: 'var(--ink-2)', marginBottom: 20 }}>
          Item not found.
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 32 }}>
          This item may have already been reviewed, or the link has expired.
        </p>
        <button className="btn-primary" onClick={() => router.replace('/')} style={{ maxWidth: 240 }}>
          Back to queue
        </button>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     DECIDED — outcome screen (light, almanac)
  ════════════════════════════════════════════ */
  if (pageState === 'decided') {
    return (
      <div className="p-screen">
        {confetti && <Confetti />}

        <div className="p-body">
          {/* Back */}
          <div style={{ padding: '12px 24px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={() => router.replace('/')}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em',
                color: 'var(--ink-2)', textTransform: 'uppercase',
                padding: 4, minHeight: 44,
              }}
            >
              <Arrow dir="left" size={12} />
              BACK
            </button>
            <div className="eyebrow">{isSaved ? 'HELD' : 'BOUGHT'}</div>
          </div>

          <div className="rule" />

          {/* Outcome word */}
          <div style={{ padding: '36px 24px 8px' }}>
            <div className="display" style={{ fontSize: 52, color: isSaved ? 'var(--good)' : 'var(--warn)' }}>
              {isSaved ? 'held.' : 'bought.'}
            </div>
            <div style={{ marginTop: 14, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              {isSaved
                ? "You didn't need it. The money stays yours."
                : 'You gave it 24 hours. No regrets.'}
            </div>
          </div>

          {/* Savings counter */}
          {savedTotal > 0 && (
            <div style={{ margin: '28px 24px 0', padding: '18px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="eyebrow">HELD THIS YEAR</div>
              <Figure amount={savedTotal} currency={symbol} size={26} italic />
            </div>
          )}

          {/* Item reference */}
          {item && (
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 6 }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    {item.price != null && (
                      <span className="figure" style={{ fontSize: 16, fontStyle: 'italic' }}>
                        <span className="curr">{symbol}</span>{item.price}
                      </span>
                    )}
                    {item.mood && <Mood word={item.mood} />}
                  </div>
                </div>
                {item.imageUrl && (
                  <div style={{ width: 52, height: 52, flexShrink: 0, overflow: 'hidden' }}>
                    <img src={item.imageUrl} alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {item?.url && (
            <div style={{ padding: '20px 24px 0' }}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
                fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--ink-3)',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                {getHostname(item.url)} ↗
              </a>
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: '32px 24px 36px' }}>
            {isSaved && (
              <button onClick={handleShare} className="btn-primary" style={{ marginBottom: 10, background: 'var(--ink)' }}>
                {copied ? '✓ Copied!' : '🎉 Share this win'}
              </button>
            )}
            <button onClick={() => router.replace('/')} className="btn-ghost">
              ← Back to queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     READY — decision screen
  ════════════════════════════════════════════ */
  return (
    <div className="p-screen">
      <div className="p-body">

        {/* Top bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px 12px',
        }}>
          <button
            type="button"
            onClick={() => router.replace('/')}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, color: 'var(--ink-3)',
              padding: '4px 4px', minHeight: 44,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Arrow dir="left" size={13} color="var(--ink-3)" />
            Back
          </button>
          <div className="eyebrow">
            {item ? pausedAgo(item.expiresAt) : '…'}
          </div>
        </div>

        {/* Full-bleed product image */}
        {item?.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', aspectRatio: '1 / 1',
            background: 'var(--paper-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Large mood-coloured initial when no image */}
            <span style={{
              fontSize: 80, fontWeight: 800, letterSpacing: '-0.04em',
              color: moodCopy.color, opacity: 0.18, userSelect: 'none',
            }}>
              {item?.name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}

        {/* Item info */}
        <div style={{ padding: '20px 24px 0' }}>
          {item?.url && getHostname(item.url) && (
            <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--ink-4)' }}>
              {getHostname(item.url)}
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', gap: 12,
          }}>
            <div style={{
              fontSize: 22, fontWeight: 700, color: 'var(--ink)',
              letterSpacing: '-0.02em', lineHeight: 1.1, flex: 1, minWidth: 0,
            }}>
              {item?.name}
            </div>
            {item?.price != null && (
              <div style={{
                fontSize: 18, fontWeight: 800, color: 'var(--ink-2)',
                letterSpacing: '-0.03em', flexShrink: 0,
              }}>
                {symbol}{item.price}
              </div>
            )}
          </div>
        </div>

        {/* Mood — the centrepiece */}
        {item?.mood && (
          <div style={{ padding: '24px 24px 0' }}>
            <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--ink-4)' }}>
              When you added it
            </div>
            <div style={{
              fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em',
              lineHeight: 1, color: moodCopy.color, marginBottom: 14,
              fontStyle: 'italic',
            }}>
              {item.mood}.
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-3)', maxWidth: '32ch' }}>
              {moodCopy.lead}{' '}
              <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{moodCopy.tail}</span>
            </div>
          </div>
        )}

        {/* Held total */}
        {savedTotal > 0 && (
          <div style={{
            margin: '24px 24px 0', padding: '14px 0',
            borderTop: '1px solid var(--rule)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div className="eyebrow">Held this year</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--accent)' }}>
              {symbol}{savedTotal.toFixed(2)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '24px 24px 40px' }}>
          <button
            className="btn-accent"
            onClick={() => handleDecision('saved')}
            disabled={busy}
          >
            Let it go →
          </button>
          <button
            className="btn-ghost"
            onClick={() => handleDecision('bought')}
            disabled={busy}
            style={{ marginTop: 4 }}
          >
            Still want it — buy it ↗
          </button>
        </div>

      </div>
    </div>
  );
}

function Confetti() {
  const pieces = ['✦', '◆', '▲', '●', '■', '◇', '△'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 999 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} style={{
          position:       'absolute',
          left:           `${(i * 37) % 100}%`,
          top:            '-5%',
          fontSize:       10 + (i % 4) * 4,
          color:          i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--ink)' : 'var(--good)',
          animation:      `fall ${0.9 + (i % 5) * 0.25}s ease-in forwards`,
          animationDelay: `${(i % 7) * 0.07}s`,
          opacity:        0.7,
        }}>
          {pieces[i % pieces.length]}
        </span>
      ))}
    </div>
  );
}
