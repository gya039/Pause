'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PauseIcon, ClockIcon, BarChartIcon, SettingsIcon } from './Icons';
import { useBadge } from '@/hooks/useBadge';

const NAV = [
  { href: '/',         label: 'Today',    Icon: PauseIcon    },
  { href: '/history',  label: 'History',  Icon: ClockIcon    },
  { href: '/insights', label: 'Insights', Icon: BarChartIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
];

function normalize(p) { return p === '/' ? p : p.replace(/\/$/, ''); }

export default function BottomNav() {
  const current   = normalize(usePathname());
  const { count } = useBadge();

  return (
    <nav className="bottom-nav">
      {NAV.map(({ href, label, Icon }) => {
        const active    = current === normalize(href);
        const showBadge = href === '/' && !active && count > 0;

        return (
          <Link
            key={href}
            href={href}
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            5,
              paddingTop:     6,
              position:       'relative',
              color:          active ? 'var(--accent)' : 'var(--t3)',
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Active pill — sits at the very top of each nav slot */}
            {active && (
              <div style={{
                position:     'absolute',
                top:          0,
                left:         '50%',
                transform:    'translateX(-50%)',
                width:        22,
                height:       3,
                borderRadius: 2,
                background:   'var(--accent)',
              }} />
            )}

            {/* Icon wrapper — opacity dims inactive tabs */}
            <div style={{ position: 'relative', opacity: active ? 1 : 0.25 }}>
              <Icon size={22} strokeWidth={active ? 2.4 : 1.6} />
              {showBadge && (
                <span style={{
                  position:     'absolute',
                  top:          -3,
                  right:        -5,
                  width:        8,
                  height:       8,
                  borderRadius: '50%',
                  background:   'var(--danger)',
                  border:       '2px solid var(--bg)',
                }} />
              )}
            </div>

            <span style={{
              fontSize:      9,
              fontWeight:    active ? 700 : 500,
              letterSpacing: active ? 0.3 : 0.5,
              textTransform: 'uppercase',
              color:         active ? 'var(--accent)' : 'var(--t3)',
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
