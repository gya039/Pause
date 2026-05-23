export default function LoadingScreen() {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '100dvh',
      background:     'var(--bg)',
    }}>
      <span style={{
        fontSize:      28,
        fontWeight:    800,
        letterSpacing: -1.5,
        color:         'var(--t1)',
        opacity:       0.15,
        userSelect:    'none',
      }}>
        Pause
      </span>
    </div>
  );
}
