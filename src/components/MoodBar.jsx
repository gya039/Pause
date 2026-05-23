'use client';

function barColor(saveRate) {
  if (saveRate >= 60) return '#1C4A2E';
  if (saveRate >= 34) return '#F59E0B';
  return '#E24B4A';
}

export default function MoodBar({ mood, emoji, saveRate, total, risky }) {
  const fill = barColor(saveRate);
  const isRisky = risky ?? saveRate <= 33;

  return (
    <div style={{
      background:   'var(--surface)',
      borderRadius: 'var(--r)',
      padding:      '14px 16px',
      marginBottom: 8,
      border:       '1px solid var(--border)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', lineHeight: 1.2 }}>
          {emoji} {mood}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)' }}>
          {total} item{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        background:   'rgba(0,0,0,0.06)',
        borderRadius: 'var(--r-full)',
        height:       8,
        overflow:     'hidden',
        marginBottom: 10,
      }}>
        <div style={{
          width:        `${Math.max(saveRate, 3)}%`,
          height:       '100%',
          background:   fill,
          borderRadius: 'var(--r-full)',
          transition:   'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: fill }}>
          {saveRate}% saved
        </span>
        {isRisky && (
          <span style={{
            fontSize:      9,
            fontWeight:    700,
            color:         '#CC4444',
            background:    '#FFEEE8',
            borderRadius:  'var(--r-full)',
            padding:       '3px 8px',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}>
            High risk
          </span>
        )}
      </div>
    </div>
  );
}
