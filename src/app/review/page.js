'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getItem, reviewItem, getSavedTotal } from '@/lib/firestore';
import { getCurrencySymbol } from '@/constants/currency';
import { MOOD_MAP } from '@/constants/moods';
import { recordActivity } from '@/hooks/useStreak';
import LoadingScreen from '@/components/LoadingScreen';
import { Figure, Arrow } from '@/components/Almanac';

const MOOD_COPY = {
  anxious: { color: 'var(--warn)',   lead: 'You were anxious when you added this.', tail: 'That feeling has likely passed.'                        },
  tired:   { color: 'var(--ink-3)', lead: 'You were tired when you added this.',   tail: 'Rest first — it\'ll still be here tomorrow.'            },
  happy:   { color: 'var(--good)',  lead: 'You were happy when you added this.',   tail: 'If you\'re still happy without it, that\'s the answer.' },
  bored:   { color: 'var(--amber)', lead: 'You were bored when you added this.',   tail: 'Boredom rarely makes the best buyer.'                   },
  calm:    { color: 'var(--cool)',  lead: 'You were calm when you added this.',    tail: 'Trust that decision. Or don\'t. Either way, deliberate.'},
  default: { color: 'var(--ink-2)', lead: 'You added this 24 hours ago.',          tail: 'Whatever you felt then may have changed.'               },
};

const SWIPE_THRESHOLD = 90;

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

  // ── Swipe state ──
  const bodyRef    = useRef(null);
  const cardRef    = useRef(null);   // direct DOM transform — no re-renders during drag
  const heldOverRef  = useRef(null); // overlay refs — updated via style directly
  const buyOverRef   = useRef(null);
  const hintRef      = useRef(null);
  const touchData  = useRef({ x: 0, y: 0, dir: null });
  const dragXRef   = useRef(0);
  const isDragging = useRef(false);

  // Keep mutable refs current so touch handlers don't go stale
  const itemRef       = useRef(item);
  const savedTotalRef = useRef(savedTotal);
  const busyRef       = useRef(busy);
  useEffect(() => { itemRef.current = item; },       [item]);
  useEffect(() => { savedTotalRef.current = savedTotal; }, [savedTotal]);
  useEffect(() => { busyRef.current = busy; },       [busy]);

  // Direct DOM update — called on every touchmove, no React state, no re-renders
  function applyDragUI(dx) {
    if (cardRef.current) {
      cardRef.current.style.transform  = `translateX(${dx}px) rotate(${dx * 0.012}deg)`;
      cardRef.current.style.transition = 'none';
    }
    const heldOp   = Math.min(0.7, Math.max(0, ( dx - 15) / 80));
    const buyingOp = Math.min(0.7, Math.max(0, (-dx - 15) / 80));
    if (heldOverRef.current)  heldOverRef.current.style.opacity  = heldOp;
    if (buyOverRef.current)   buyOverRef.current.style.opacity   = buyingOp;
    if (hintRef.current)      hintRef.current.style.opacity      = dx !== 0 ? '0' : '0.4';
  }

  function snapBack() {
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      cardRef.current.style.transform  = 'translateX(0px) rotate(0deg)';
    }
    if (heldOverRef.current)  heldOverRef.current.style.opacity  = '0';
    if (buyOverRef.current)   buyOverRef.current.style.opacity   = '0';
    if (hintRef.current)      hintRef.current.style.opacity      = '0.4';
    dragXRef.current = 0;
  }

  // ── Data load ──
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

  // ── Swipe touch handlers ──
  // touch-action: pan-y on the container (set inline below) tells the browser
  // "only intercept vertical scrolls natively — leave horizontal to JS".
  // Non-passive touchmove lets us call preventDefault() to stop any scroll bleed.
  useEffect(() => {
    if (pageState !== 'ready') return;
    const el = bodyRef.current;
    if (!el) return;

    function onStart(e) {
      touchData.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dir: null };
      isDragging.current = false;
    }

    function onMove(e) {
      if (busyRef.current) return;
      const dx = e.touches[0].clientX - touchData.current.x;
      const dy = e.touches[0].clientY - touchData.current.y;

      // Commit direction once movement clears 8 px
      if (!touchData.current.dir && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        touchData.current.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }

      if (touchData.current.dir === 'h') {
        e.preventDefault(); // stop browser from scrolling
        isDragging.current = true;
        const clamped = Math.max(-170, Math.min(170, dx));
        dragXRef.current = clamped;
        applyDragUI(clamped); // direct DOM update — zero re-renders
      }
    }

    function onEnd() {
      isDragging.current = false;
      const dx = dragXRef.current;

      if (Math.abs(dx) >= SWIPE_THRESHOLD && !busyRef.current && itemRef.current) {
        const id = new URLSearchParams(window.location.search).get('id');
        doSubmit(id, itemRef.current, dx > 0 ? 'saved' : 'bought', savedTotalRef.current);
      } else {
        snapBack();
      }
      touchData.current.dir = null;
    }

    el.addEventListener('touchstart', onStart, { passive: true  });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true  });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, [pageState]); // eslint-disable-line

  async function doSubmit(itemId, itemData, choice, currentTotal) {
    setBusy(true);
    dragXRef.current = 0;
    setDragX(0);
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

  /* ── Decided ── */
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

          {/* Outcome */}
          <div style={{ padding: '36px 24px 8px' }}>
            <div className="display" style={{ fontSize: 52, color: isSaved ? 'var(--good)' : 'var(--warn)', fontStyle: 'italic' }}>
              {isSaved ? 'held.' : 'bought.'}
            </div>
            <div style={{ marginTop: 14, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              {isSaved
                ? "You didn't need it. The money stays yours."
                : 'You gave it 24 hours. No regrets.'}
            </div>
          </div>

          {savedTotal > 0 && (
            <div style={{ margin: '28px 24px 0', padding: '18px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="eyebrow">HELD THIS YEAR</div>
              <Figure amount={savedTotal} currency={symbol} size={26} italic />
            </div>
          )}

          {item && (
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 6 }}>
                {item.name}
              </div>
              {item.price != null && (
                <span className="figure" style={{ fontSize: 16, fontStyle: 'italic' }}>
                  <span className="curr">{symbol}</span>{item.price}
                </span>
              )}
            </div>
          )}

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

  /* ── Ready — decision screen with swipe ── */
  return (
    <div className="p-screen" style={{ overflow: 'hidden' }}>

      {/* touch-action: pan-y — browser handles vertical scroll, JS handles horizontal */}
      <div ref={bodyRef} className="p-body" style={{ touchAction: 'pan-y' }}>

        {/* Swipeable card — transform controlled directly via cardRef, not React state */}
        <div ref={cardRef} style={{ willChange: 'transform' }}>

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
            <div className="eyebrow">{item ? pausedAgo(item.expiresAt) : '…'}</div>
          </div>

          {/* Full-bleed image with swipe overlays */}
          <div style={{ position: 'relative' }}>
            {item?.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item?.name}
                style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
                draggable={false}
              />
            ) : (
              <div style={{
                width: '100%', aspectRatio: '1 / 1',
                background: `var(--mood-${item?.mood}-bg, var(--paper-3))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: 80, fontWeight: 800, letterSpacing: '-0.04em',
                  color: moodCopy.color, opacity: 0.2, userSelect: 'none',
                }}>
                  {item?.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}

            {/* HELD overlay — always rendered, opacity driven by ref */}
            <div ref={heldOverRef} style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'rgba(28,74,48,0)',
              display: 'flex', alignItems: 'center', padding: '0 28px',
              opacity: 0,
            }}>
              <span style={{
                color: '#fff', fontSize: 26, fontWeight: 800,
                letterSpacing: '-0.03em', textShadow: '0 1px 8px rgba(0,0,0,0.3)',
              }}>
                HELD ✓
              </span>
            </div>

            {/* BUYING overlay — always rendered */}
            <div ref={buyOverRef} style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'rgba(184,50,50,0)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 28px',
              opacity: 0,
            }}>
              <span style={{
                color: '#fff', fontSize: 26, fontWeight: 800,
                letterSpacing: '-0.03em', textShadow: '0 1px 8px rgba(0,0,0,0.3)',
              }}>
                BUYING ↗
              </span>
            </div>
          </div>

          {/* Item info */}
          <div style={{ padding: '20px 24px 0' }}>
            {item?.url && getHostname(item.url) && (
              <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--ink-4)' }}>
                {getHostname(item.url)}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{
                fontSize: 22, fontWeight: 700, color: 'var(--ink)',
                letterSpacing: '-0.02em', lineHeight: 1.1, flex: 1, minWidth: 0,
              }}>
                {item?.name}
              </div>
              {item?.price != null && (
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-2)', letterSpacing: '-0.03em', flexShrink: 0 }}>
                  {symbol}{item.price}
                </div>
              )}
            </div>
          </div>

          {/* Mood — centrepiece with tinted bg */}
          {item?.mood && (
            <div style={{
              margin: '20px 0 0',
              padding: '24px 24px 22px',
              background: `var(--mood-${item.mood}-bg, var(--paper-3))`,
            }}>
              <div className="eyebrow" style={{ marginBottom: 12, opacity: 0.6 }}>
                When you added it
              </div>
              <div style={{
                fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em',
                lineHeight: 1, color: moodCopy.color, marginBottom: 16,
                fontStyle: 'italic',
              }}>
                {item.mood}.
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: '30ch' }}>
                {moodCopy.lead}{' '}
                <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{moodCopy.tail}</span>
              </div>
            </div>
          )}

          {/* Held total */}
          {savedTotal > 0 && (
            <div style={{
              margin: '0 24px', padding: '16px 0',
              borderTop: '1px solid var(--rule)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div className="eyebrow">Held this year</div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--accent)' }}>
                {symbol}{savedTotal.toFixed(2)}
              </div>
            </div>
          )}

          {/* Swipe hint — opacity driven by ref */}
          <div ref={hintRef} style={{
            textAlign: 'center', padding: '20px 24px 4px',
            opacity: 0.4,
            pointerEvents: 'none',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
              ← SWIPE TO DECIDE · OR TAP BELOW →
            </span>
          </div>

          {/* Actions */}
          <div style={{ padding: '12px 24px 48px' }}>
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
