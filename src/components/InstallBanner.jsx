'use client';

import { useEffect, useState } from 'react';

export default function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS       = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInstalled = window.navigator.standalone === true;
    const dismissed   = sessionStorage.getItem('install-dismissed');
    if (isIOS && !isInstalled && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    sessionStorage.setItem('install-dismissed', '1');
    setShow(false);
  }

  return (
    <div style={{
      position:   'fixed',
      bottom:     'calc(72px + env(safe-area-inset-bottom) + 12px)',
      left:       '50%',
      transform:  'translateX(-50%)',
      width:      'calc(100% - 32px)',
      maxWidth:   440,
      background: '#111',
      color:      '#fff',
      borderRadius: 14,
      padding:    '14px 16px',
      display:    'flex',
      alignItems: 'center',
      gap:        12,
      zIndex:     100,
      boxShadow:  '0 4px 24px rgba(0,0,0,0.25)',
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>📲</span>
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
        <strong>Install Pause</strong><br />
        Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> for the best experience.
      </div>
      <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer', flexShrink: 0, padding: 4 }}>
        ✕
      </button>
    </div>
  );
}
