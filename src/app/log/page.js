'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { logItem } from '@/lib/firestore';
import { fetchLinkPreview } from '@/lib/metadata';
import { getCurrencySymbol } from '@/constants/currency';
import { recordActivity } from '@/hooks/useStreak';
import MoodPicker from '@/components/MoodPicker';
import LoadingScreen from '@/components/LoadingScreen';
import { LinkIcon } from '@/components/Icons';

export default function LogPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const symbol = getCurrencySymbol(profile?.currency);

  const [name,            setName]            = useState('');
  const [price,           setPrice]           = useState('');
  const [mood,            setMood]            = useState('');
  const [url,             setUrl]             = useState('');
  const [imageUrl,        setImageUrl]        = useState('');
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [error,           setError]           = useState('');
  const [busy,            setBusy]            = useState(false);
  const [submitted,       setSubmitted]       = useState(false);
  const [loggedName,      setLoggedName]      = useState('');
  const [loggedMood,      setLoggedMood]      = useState('');
  const [moodShake,       setMoodShake]       = useState(false);

  // 3.1 — PWA share target: pre-fill from browser share sheet params
  useEffect(() => {
    const params      = new URLSearchParams(window.location.search);
    const sharedTitle = params.get('shared_title') || params.get('title') || '';
    const sharedUrl   = params.get('shared_url')   || params.get('url')   || '';
    if (sharedTitle) setName(sharedTitle);
    if (sharedUrl)   setUrl(sharedUrl);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingScreen />;

  /* ── Success state ── */
  if (submitted) {
    const MOOD_COLORS = {
      anxious: { bg: 'var(--mood-anxious-bg)', text: 'var(--mood-anxious-text)' },
      tired:   { bg: 'var(--mood-tired-bg)',   text: 'var(--mood-tired-text)'   },
      happy:   { bg: 'var(--mood-happy-bg)',   text: 'var(--mood-happy-text)'   },
      bored:   { bg: 'var(--mood-bored-bg)',   text: 'var(--mood-bored-text)'   },
      calm:    { bg: 'var(--mood-calm-bg)',     text: 'var(--mood-calm-text)'     },
    };
    const mc = MOOD_COLORS[loggedMood] || { bg: 'var(--paper-3)', text: 'var(--ink-3)' };

    return (
      <div style={{
        minHeight: '100dvh', background: 'var(--paper)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px', textAlign: 'center',
      }}>
        {/* Pause mark */}
        <div className="pop-in" style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 28,
        }}>
          ⏸
        </div>

        <div className="eyebrow" style={{ color: 'var(--ink-4)', marginBottom: 14 }}>PAUSED</div>

        {loggedName ? (
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 28, fontWeight: 400, lineHeight: 1.2,
            letterSpacing: '-0.01em', color: 'var(--ink)',
            marginBottom: 16, maxWidth: 280,
          }}>
            "{loggedName}"
          </div>
        ) : null}

        {loggedMood ? (
          <span style={{
            display: 'inline-block',
            background: mc.bg, color: mc.text,
            padding: '3px 10px', borderRadius: 999,
            fontSize: 12, fontWeight: 600,
            letterSpacing: '0.01em', marginBottom: 24,
            fontFamily: 'var(--sans)',
          }}>
            {loggedMood}
          </span>
        ) : <div style={{ marginBottom: 24 }} />}

        <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.65, maxWidth: 240 }}>
          Check back in 24 hours.<br />Your future self gets a vote.
        </p>
      </div>
    );
  }

  async function handleUrlBlur() {
    const trimmed = url.trim();
    if (!trimmed || (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))) return;
    setFetchingPreview(true);
    try {
      const preview = await fetchLinkPreview(trimmed);
      if (preview?.title && !name.trim()) setName(preview.title.slice(0, 120));
      if (preview?.imageUrl) setImageUrl(preview.imageUrl);
    } catch {}
    finally { setFetchingPreview(false); }
  }

  function triggerMoodShake() {
    setMoodShake(true);
    setTimeout(() => setMoodShake(false), 450);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!mood) { triggerMoodShake(); setError('Pick a mood to continue.'); return; }
    if (price && parseFloat(price) < 0) { setError('Price must be positive.'); return; }
    setError('');
    setBusy(true);
    try {
      setLoggedName(name.trim());
      setLoggedMood(mood);
      await logItem(user.uid, { name: name.trim(), price, mood, url: url.trim() || null, imageUrl: imageUrl || null });
      recordActivity();
      setSubmitted(true);
      setTimeout(() => router.replace('/'), 1800);
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding:    'max(18px, calc(env(safe-area-inset-top) + 10px)) 24px 0',
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 'var(--r-full)',
            background: 'var(--paper-3)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--ink-2)', fontSize: 18, fontWeight: 400,
            fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
          }}
        >
          ×
        </button>
        <div className="eyebrow" style={{ color: 'var(--ink-4)' }}>NEW PAUSE</div>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Display headline ── */}
      <div style={{ padding: '28px 24px 0' }}>
        <h1 style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic',
          fontWeight: 400, fontSize: 38, lineHeight: 1.1,
          letterSpacing: '-0.02em', color: 'var(--ink)', margin: 0,
        }}>
          What do you want?
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{
        padding: '24px 24px 0',
        display: 'flex', flexDirection: 'column', gap: 28, flex: 1,
      }}>

        {/* ── Name — large statement field ── */}
        <div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Air Jordans, that lamp, anything…"
            required
            autoFocus
            style={{
              width: '100%', background: 'none', border: 'none',
              borderBottom: '1.5px solid var(--rule)',
              fontSize: 20, fontWeight: 500, color: 'var(--ink)',
              fontFamily: 'var(--sans)', letterSpacing: '-0.01em',
              padding: '8px 0 12px', outline: 'none',
              borderRadius: 0,
            }}
          />
        </div>

        {/* ── Price + URL — secondary row ── */}
        <div style={{ display: 'flex', gap: 14 }}>

          {/* Price */}
          <div style={{ flex: 1 }}>
            <label className="label">Price</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--ink-3)', pointerEvents: 'none', fontWeight: 600, fontSize: 14,
              }}>
                {symbol}
              </span>
              <input
                className="input-field"
                type="number"
                inputMode="decimal"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{ paddingLeft: 34, fontSize: 15 }}
              />
            </div>
          </div>

          {/* Link */}
          <div style={{ flex: 1.4 }}>
            <label className="label">Link <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-4)' }}>→ photo</span></label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--ink-4)', pointerEvents: 'none', display: 'flex',
              }}>
                <LinkIcon size={15} strokeWidth={2} />
              </div>
              <input
                className="input-field"
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setImageUrl(''); }}
                onBlur={handleUrlBlur}
                placeholder="https://…"
                autoComplete="off"
                style={{ paddingLeft: 34, fontSize: 15 }}
              />
              {fetchingPreview && (
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 11, color: 'var(--ink-4)',
                }}>
                  …
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Image preview */}
        {imageUrl && (
          <div style={{ position: 'relative', display: 'inline-block', marginTop: -12 }}>
            <img src={imageUrl} alt="Preview" style={{
              width: 80, height: 80, objectFit: 'cover',
              borderRadius: 'var(--r-sm)', display: 'block',
              border: '1px solid var(--rule)',
            }} />
            <button type="button" onClick={() => setImageUrl('')} style={{
              position: 'absolute', top: -6, right: -6,
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--ink)', color: 'var(--paper)', border: 'none',
              cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              ×
            </button>
          </div>
        )}

        {/* ── Mood ── */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: 'var(--serif)', fontStyle: 'italic',
              fontSize: 20, color: 'var(--ink)', marginBottom: 4,
            }}>
              How are you feeling?
              <span style={{ color: 'var(--warn)', fontStyle: 'normal', fontSize: 14, marginLeft: 4 }}>*</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              Your mood is recorded with the item — you'll see it tomorrow.
            </div>
          </div>
          <div className={moodShake ? 'shake' : ''}>
            <MoodPicker value={mood} onChange={v => { setMood(v); setError(''); }} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--bought-bg)', borderRadius: 'var(--r-sm)',
            padding: '10px 14px', fontSize: 13, color: 'var(--warn)', lineHeight: 1.5,
            border: '1px solid rgba(184,50,50,0.15)',
          }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* ── Submit ── */}
        <div style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <button
            className="btn-accent"
            type="submit"
            disabled={busy || !name.trim()}
            style={{ fontSize: 16 }}
          >
            {busy ? '…' : 'Pause it for 24 hours ⏸'}
          </button>
        </div>
      </form>
    </div>
  );
}
