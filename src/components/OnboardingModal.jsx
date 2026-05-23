'use client';

import { useState } from 'react';

const SLIDES = [
  {
    emoji:    '🛍️',
    title:    'Feel the urge to buy something?',
    body:     'We all do. Pause is a 24-hour buffer between impulse and purchase — so your future self gets a vote.',
  },
  {
    emoji:    '⏸',
    title:    'Log it with your mood.',
    body:     'Record what you want and how you\'re feeling in the moment. Tired? Bored? Anxious? It matters more than you think.',
  },
  {
    emoji:    '💚',
    title:    'Then decide if you still want it.',
    body:     'Most of the time, you won\'t. Your wallet keeps the difference — and Pause keeps the score.',
  },
];

export default function OnboardingModal({ onDone }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;

  function next() {
    if (isLast) { onDone(); return; }
    setSlide(s => s + 1);
  }

  const s = SLIDES[slide];

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'rgba(26,23,20,0.6)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex:         200,
      display:        'flex',
      alignItems:     'flex-end',
      padding:        '0 0 env(safe-area-inset-bottom)',
    }}>
      <div style={{
        width:         '100%',
        maxWidth:      'var(--max-w)',
        margin:        '0 auto',
        background:    'var(--surface)',
        borderRadius:  '24px 24px 0 0',
        padding:       '32px 28px 36px',
        animation:     'fadeSlideUp 0.35s ease',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width:        i === slide ? 20 : 6,
              height:       6,
              borderRadius: 3,
              background:   i === slide ? 'var(--accent)' : 'var(--border)',
              transition:   'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Emoji */}
        <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 20, lineHeight: 1 }}>
          {s.emoji}
        </div>

        {/* Text */}
        <h2 style={{
          fontSize:      22,
          fontWeight:    800,
          letterSpacing: -0.8,
          color:         'var(--t1)',
          textAlign:     'center',
          marginBottom:  12,
          lineHeight:    1.25,
        }}>
          {s.title}
        </h2>
        <p style={{
          fontSize:   15,
          color:      'var(--t2)',
          textAlign:  'center',
          lineHeight: 1.6,
          marginBottom: 32,
        }}>
          {s.body}
        </p>

        {/* Buttons */}
        <button
          onClick={next}
          className="btn-accent"
        >
          {isLast ? 'Get started' : 'Next →'}
        </button>

        {!isLast && (
          <button
            onClick={onDone}
            style={{
              display:   'block',
              width:     '100%',
              marginTop: 12,
              background: 'none',
              border:    'none',
              color:     'var(--t3)',
              fontSize:  14,
              cursor:    'pointer',
              padding:   8,
              textAlign: 'center',
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
