'use client';

// Almanac design system — Direction A
// Space Grotesk (sans) + Space Mono (mono)
// Lime accent only on: CTA buttons + active nav indicator

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Hairline rule with optional centred caption ──
export function Rule({ children, accent, style }) {
  if (!children) return <div className="rule" style={style} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }}>
      <div className="rule" style={{ flex: 1 }} />
      <div className="eyebrow" style={accent ? { color: 'var(--accent-ink)' } : undefined}>
        {children}
      </div>
      <div className="rule" style={{ flex: 1 }} />
    </div>
  );
}

// ── Mood → subtle bg + text colour for placeholders ──
const MOOD_PH = {
  anxious: { bg: 'rgba(240,90,90,0.10)',  letter: 'rgba(240,90,90,0.55)'  },
  happy:   { bg: 'rgba(110,201,122,0.10)', letter: 'rgba(110,201,122,0.55)' },
  calm:    { bg: 'rgba(90,160,240,0.10)', letter: 'rgba(90,160,240,0.55)'  },
  bored:   { bg: 'rgba(240,168,58,0.10)', letter: 'rgba(240,168,58,0.55)'  },
  tired:   { bg: 'rgba(160,152,144,0.10)', letter: 'rgba(160,152,144,0.50)' },
};

// ── Product image / placeholder thumb ──
export function Thumb({ tone = 'warm', label, mood, size = 52, src, alt }) {
  const radius = Math.round(size * 0.16);
  if (src) {
    return (
      <div style={{
        width: size, height: size, flex: '0 0 auto', flexShrink: 0,
        overflow: 'hidden', borderRadius: radius,
        border: '1px solid var(--rule)',
      }}>
        <img src={src} alt={alt || label || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  const ph = MOOD_PH[mood] || { bg: 'var(--paper-3)', letter: 'var(--ink-4)' };
  const initial = (label || '?')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, flex: '0 0 auto', flexShrink: 0,
      background: ph.bg,
      borderRadius: radius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--sans)',
      fontSize: Math.round(size * 0.44),
      fontWeight: 600,
      color: ph.letter,
      letterSpacing: '-0.02em',
      userSelect: 'none',
    }}>
      {initial}
    </div>
  );
}

// ── Mood word — Space Mono, lowercase, semantic colour ──
const MOOD_COLORS = {
  anxious: 'var(--warn)',
  tired:   'var(--ink-3)',
  happy:   'var(--good)',
  bored:   'var(--amber)',
  calm:    'var(--cool)',
};
export function Mood({ word }) {
  const color = MOOD_COLORS[word] || 'var(--ink-3)';
  return <span className="mood" style={{ color }}>{word}</span>;
}

// ── Big monospaced currency figure ──
export function Figure({ amount, currency = '€', size = 64, italic = false }) {
  const [whole, cents] = String(amount.toFixed(2)).split('.');
  return (
    <span className="figure" style={{ fontSize: size, fontStyle: italic ? 'italic' : 'normal' }}>
      <span className="curr">{currency}</span>
      {whole}
      <span className="cents">.{cents}</span>
    </span>
  );
}

// ── Bottom nav — lime underline bar on active item ──
const NAV_ITEMS = [
  { href: '/',         label: 'Today'    },
  { href: '/history',  label: 'History'  },
  { href: '/insights', label: 'Insights' },
  { href: '/settings', label: 'Settings' },
];
function normalize(p) { return p === '/' ? p : p.replace(/\/$/, ''); }

export function BottomNav() {
  const current = normalize(usePathname());
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = current === normalize(href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
          >
            <span className="dot" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Toggle ──
export function Toggle({ on = false, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={'tgl' + (on ? ' on' : '')}
    >
      <i />
    </button>
  );
}

// ── Minimal arrow glyph ──
export function Arrow({ dir = 'right', size = 14, color = 'currentColor', weight = 1.2 }) {
  const rot = { right: 0, left: 180, up: -90, down: 90 }[dir] || 0;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ transform: `rotate(${rot}deg)`, flex: '0 0 auto' }}>
      <path d="M2 8 H14 M9 3 L14 8 L9 13"
        fill="none" stroke={color} strokeWidth={weight}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Roman numeral marginalia ──
const ROMANS = ['','i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv'];
export function Roman({ n }) {
  const r = ROMANS[n] || String(n);
  return <span className="marginalia">{r}</span>;
}
