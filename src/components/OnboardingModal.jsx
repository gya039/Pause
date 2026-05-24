'use client';

import { useState } from 'react';

const SLIDES = [
  {
    num: '01',
    headline: 'The space\nbetween want\nand buy.',
    body:     'Pause is a 24-hour buffer between impulse and purchase — so your future self gets a vote.',
  },
  {
    num: '02',
    headline: 'Name it.\nFeel it.\nLog it.',
    body:     'Record what you want and how you\'re feeling in the moment. Your mood reveals more than the price tag ever will.',
  },
  {
    num: '03',
    headline: 'Most things\ndon\'t survive\nthe wait.',
    body:     'That\'s the point. The money that stayed is money you kept. Pause tracks every hold.',
  },
];

export default function OnboardingModal({ onDone }) {
  const [slide,   setSlide]   = useState(0);
  const [exiting, setExiting] = useState(false);

  const isLast = slide === SLIDES.length - 1;

  function advance() {
    if (isLast) { onDone(); return; }
    setExiting(true);
    setTimeout(() => {
      setSlide(s => s + 1);
      setExiting(false);
    }, 180);
  }

  const s = SLIDES[slide];

  return (
    <div
      onClick={advance}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        200,
        background:    'var(--paper)',
        display:       'flex',
        flexDirection: 'column',
        padding:       'max(36px, calc(env(safe-area-inset-top) + 28px)) 32px max(32px, calc(env(safe-area-inset-bottom) + 24px))',
        cursor:        'pointer',
        userSelect:    'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Slide counter */}
      <div className="eyebrow" style={{ color: 'var(--ink-4)' }}>
        {s.num} / 0{SLIDES.length}
      </div>

      {/* Main content — fades + slides on transition */}
      <div style={{
        flex:      1,
        display:   'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity:   exiting ? 0 : 1,
        transform: exiting ? 'translateY(10px)' : 'translateY(0)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
      }}>

        {/* Brand mark on slide 1 */}
        {slide === 0 && (
          <div style={{
            width:           44,
            height:          44,
            borderRadius:    13,
            background:      'var(--accent)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            marginBottom:    36,
            flexShrink:      0,
            userSelect:      'none',
          }}>
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
              <rect x="1"   y="1" width="5" height="16" rx="1.5" fill="white" />
              <rect x="10"  y="1" width="5" height="16" rx="1.5" fill="white" />
            </svg>
          </div>
        )}

        {/* Headline — Lora serif italic */}
        <h1 style={{
          fontFamily:    'var(--serif)',
          fontStyle:     'italic',
          fontWeight:    400,
          fontSize:      'clamp(38px, 11vw, 52px)',
          lineHeight:    1.1,
          letterSpacing: '-0.02em',
          color:         'var(--ink)',
          marginBottom:  28,
          whiteSpace:    'pre-line',
        }}>
          {s.headline}
        </h1>

        {/* Body */}
        <p style={{
          fontSize:   16,
          color:      'var(--ink-2)',
          lineHeight: 1.65,
          maxWidth:   300,
        }}>
          {s.body}
        </p>
      </div>

      {/* Bottom controls — stop propagation so tapping buttons doesn't double-fire */}
      <div onClick={e => e.stopPropagation()}>

        {/* Progress track */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              height:     2,
              flex:       1,
              borderRadius: 1,
              background: i <= slide ? 'var(--accent)' : 'var(--paper-4)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <button onClick={advance} className="btn-accent">
          {isLast ? "Let's go →" : 'Continue →'}
        </button>

        {!isLast && (
          <button
            onClick={onDone}
            className="btn-ghost"
            style={{ marginTop: 4 }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
