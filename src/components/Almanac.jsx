'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Hairline rule ──
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

// ── Mood placeholder palette ──
const MOOD_PH = {
  anxious: { bg: 'var(--mood-anxious-bg)', letter: 'var(--mood-anxious-text)' },
  happy:   { bg: 'var(--mood-happy-bg)',   letter: 'var(--mood-happy-text)'   },
  calm:    { bg: 'var(--mood-calm-bg)',     letter: 'var(--mood-calm-text)'     },
  bored:   { bg: 'var(--mood-bored-bg)',   letter: 'var(--mood-bored-text)'   },
  tired:   { bg: 'var(--mood-tired-bg)',   letter: 'var(--mood-tired-text)'   },
};

// ── Product image / mood-tinted placeholder ──
export function Thumb({ label, mood, size = 52, src, alt }) {
  const radius = Math.round(size * 0.2);
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
      fontSize: Math.round(size * 0.44),
      fontWeight: 700,
      color: ph.letter,
      letterSpacing: '-0.02em',
      userSelect: 'none',
      fontFamily: 'var(--sans)',
    }}>
      {initial}
    </div>
  );
}

// ── Mood chip — colored pill, uses CSS variables (auto dark-mode) ──
export function Mood({ word }) {
  const vars = {
    anxious: { bg: 'var(--mood-anxious-bg)', text: 'var(--mood-anxious-text)' },
    tired:   { bg: 'var(--mood-tired-bg)',   text: 'var(--mood-tired-text)'   },
    happy:   { bg: 'var(--mood-happy-bg)',   text: 'var(--mood-happy-text)'   },
    bored:   { bg: 'var(--mood-bored-bg)',   text: 'var(--mood-bored-text)'   },
    calm:    { bg: 'var(--mood-calm-bg)',     text: 'var(--mood-calm-text)'     },
  };
  const v = vars[word] || { bg: 'var(--paper-3)', text: 'var(--ink-3)' };
  return (
    <span style={{
      display:       'inline-block',
      background:    v.bg,
      color:         v.text,
      padding:       '2px 8px',
      borderRadius:  999,
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: '0.01em',
      lineHeight:    1.65,
      fontFamily:    'var(--sans)',
      whiteSpace:    'nowrap',
    }}>
      {word}
    </span>
  );
}

// ── Big currency figure ──
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

// ── Nav icons — minimal, single-stroke SVG ──
function IconToday({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5" fill={active ? 'currentColor' : 'none'} stroke="none" />
      <circle cx="10" cy="10" r="6.5" />
    </svg>
  );
}
function IconHistory({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6.5V10l2.5 2" />
    </svg>
  );
}
function IconInsights({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14.5l4.5-4.5 3 3 6-7" />
    </svg>
  );
}
function IconSettings({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 3.5v1M10 15.5v1M3.5 10h1M15.5 10h1M5.4 5.4l.7.7M13.9 13.9l.7.7M14.6 5.4l-.7.7M6.1 13.9l-.7.7" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: '/',         label: 'Today',    Icon: IconToday    },
  { href: '/history',  label: 'History',  Icon: IconHistory  },
  { href: '/insights', label: 'Insights', Icon: IconInsights },
  { href: '/settings', label: 'Settings', Icon: IconSettings },
];

function normalize(p) { return p === '/' ? p : p.replace(/\/$/, ''); }

// ── Bottom nav with icons ──
export function BottomNav() {
  const current = normalize(usePathname());
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = current === normalize(href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
          >
            <Icon active={active} />
            <span>{label}</span>
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

// ── Arrow glyph ──
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
