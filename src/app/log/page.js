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
  const [moodShake,       setMoodShake]       = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingScreen />;

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="screen-full" style={{ alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div className="pop-in" style={{
          width: 88, height: 88, borderRadius: 'var(--r-full)',
          background: 'var(--accent-bg)', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 24,
        }}>
          ⏸
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-2px', color: 'var(--t1)', marginBottom: 10, lineHeight: 1 }}>
          Paused.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--t3)', lineHeight: 1.65, maxWidth: 220 }}>
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
      await logItem(user.uid, { name: name.trim(), price, mood, url: url.trim() || null, imageUrl: imageUrl || null });
      recordActivity();
      setSubmitted(true);
      setTimeout(() => router.replace('/'), 1600);
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Modal header ── */}
      <div className="sticky-header" style={{ justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 'var(--r-full)',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--t2)', fontSize: 20, fontWeight: 400,
            fontFamily: 'inherit', flexShrink: 0, boxShadow: 'var(--shadow-xs)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ×
        </button>
        <span className="sticky-header-title">Pause something</span>
        <div style={{ width: 36, flexShrink: 0 }} />
      </div>

      {/* ── Intent cue ── */}
      <div style={{ padding: '20px 22px 4px' }}>
        <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.65, fontStyle: 'italic' }}>
          Name what you want. You'll decide tomorrow if you still need it.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>

        {/* Item name */}
        <div>
          <label className="label">What do you want?</label>
          <input
            className="input-field"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Air Jordan 1s, that lamp, anything…"
            required
            autoFocus
          />
        </div>

        {/* Price */}
        <div>
          <label className="label">
            Price <span style={{ fontWeight: 400, color: 'var(--t3)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--t2)', pointerEvents: 'none', fontWeight: 700, fontSize: 15,
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
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="label">
            Product link <span style={{ fontWeight: 400, color: 'var(--t3)', textTransform: 'none', letterSpacing: 0 }}>(optional — auto-fetches photo)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--t3)', pointerEvents: 'none', display: 'flex',
            }}>
              <LinkIcon size={16} strokeWidth={2} />
            </div>
            <input
              className="input-field"
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setImageUrl(''); }}
              onBlur={handleUrlBlur}
              placeholder="https://..."
              autoComplete="off"
              style={{ paddingLeft: 40 }}
            />
            {fetchingPreview && (
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: 'var(--t3)', fontWeight: 500,
              }}>
                Fetching…
              </span>
            )}
          </div>

          {imageUrl && (
            <div style={{ marginTop: 12, position: 'relative', display: 'inline-block' }}>
              <img src={imageUrl} alt="Preview" style={{
                width: 88, height: 88, objectFit: 'cover',
                borderRadius: 'var(--r-sm)', display: 'block',
                background: 'var(--surface2)', boxShadow: 'var(--shadow-sm)',
              }} />
              <button type="button" onClick={() => setImageUrl('')} style={{
                position: 'absolute', top: -6, right: -6,
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--t1)', color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}>
                ×
              </button>
            </div>
          )}
        </div>

        {/* Mood */}
        <div>
          <label className="label" style={{ color: !mood && moodShake ? 'var(--danger)' : undefined }}>
            How are you feeling right now? <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div className={moodShake ? 'shake' : ''}>
            <MoodPicker value={mood} onChange={v => { setMood(v); setError(''); }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 10, lineHeight: 1.55 }}>
            Your mood is recorded with the item — you'll see it tomorrow.
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', borderRadius: 'var(--r-sm)',
            padding: '11px 14px', fontSize: 13, color: 'var(--danger)', lineHeight: 1.5,
            border: '1px solid rgba(185,28,28,0.12)',
          }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
          <button className="btn-accent" type="submit" disabled={busy || !name.trim()}>
            {busy ? '…' : 'Pause it for 24 hours ⏸'}
          </button>
        </div>
      </form>
    </div>
  );
}
