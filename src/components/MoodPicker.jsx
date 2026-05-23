'use client';

import { MOODS } from '@/constants/moods';

export default function MoodPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {MOODS.map(mood => {
        const selected = value === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            onClick={() => onChange(mood.id)}
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            8,
              padding:        '14px 4px 12px',
              border:         `2px solid ${selected ? mood.text : 'transparent'}`,
              borderRadius:   'var(--r)',
              background:     selected ? mood.bg : 'var(--surface)',
              cursor:         'pointer',
              transition:     'all 0.15s',
              outline:        'none',
              boxShadow:      selected ? 'var(--shadow-sm)' : 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1 }}>{mood.emoji}</span>
            <span style={{
              fontSize:      10,
              fontWeight:    700,
              color:         selected ? mood.text : 'var(--t3)',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              lineHeight:    1,
            }}>
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
