'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth, logout } from '@/hooks/useAuth';
import { updateUserProfile, deleteUserData, exportUserData } from '@/lib/firestore';
import { CURRENCIES } from '@/constants/currency';
import { useTheme } from '@/hooks/useTheme';
import { BottomNav, Toggle, Arrow } from '@/components/Almanac';
import LoadingScreen from '@/components/LoadingScreen';

export default function SettingsPage() {
  const router  = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { isDark, toggle: toggleTheme, followsSystem, setFollowSystem } = useTheme();

  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError,   setDeleteError]   = useState(null);   // 1.5

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingScreen />;

  async function handleToggleNotifications() {
    const next = !(profile?.emailNotifications ?? true);
    setSaving(true);
    await updateUserProfile(user.uid, { emailNotifications: next });
    await refreshProfile();
    setSaving(false);
  }

  async function handleCurrencyChange(code) {
    setSaving(true);
    await updateUserProfile(user.uid, { currency: code });
    await refreshProfile();
    setSaving(false);
  }

  async function handleExport() {
    const data  = await exportUserData(user.uid);
    const blob  = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href = url; a.download = 'pause-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSignOut() {
    await logout();
    router.replace('/auth');
  }

  async function handleDeleteAccount() {
    setDeleteError(null);   // 1.5 — clear on each attempt
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      await deleteUserData(user.uid);
      await deleteUser(auth.currentUser);
      router.replace('/auth');
    } catch (err) {
      setDeleting(false);
      setDeleteConfirm(false);
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out and sign back in, then try again.');   // 1.5
      }
    }
  }

  return (
    <div className="p-screen">
      <div className="p-body">

        {/* ── Header ── */}
        <div style={{ padding: '12px 24px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          {/* 2.6 — smaller, non-italic */}
          <div className="display" style={{ fontSize: 32, fontStyle: 'normal', fontWeight: 600 }}>Settings</div>
          {saving && <div className="eyebrow accent">SAVING…</div>}
        </div>

        <div className="rule" />

        {/* ── Appearance ── 1.3: two rows */}
        <SectionLabel>APPEARANCE</SectionLabel>
        <Row
          label="Dark mode"
          note={followsSystem ? 'Synced to device' : 'Manual override'}
        >
          <Toggle
            on={isDark}
            onToggle={followsSystem ? undefined : toggleTheme}
            label="Dark mode"
          />
        </Row>
        <Row label="Follow system" note="Match device appearance" last>
          <Toggle
            on={followsSystem}
            onToggle={() => setFollowSystem(!followsSystem)}
            label="Follow system"
          />
        </Row>
        <div className="rule" />

        {/* ── Reminders ── */}
        <SectionLabel>REMINDERS</SectionLabel>
        <Row label="24-hour pause nudges" note="Email at 09:00">
          <Toggle
            on={profile?.emailNotifications ?? true}
            onToggle={handleToggleNotifications}
            label="Email notifications"
          />
        </Row>
        {/* 2.7 — Weekly digest: non-interactive SOON pill */}
        <Row label="Weekly digest" note="Coming soon" last>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em',
            color: 'var(--ink-3)', border: '1px solid var(--rule)',
            padding: '3px 8px', borderRadius: 'var(--r-xs)',
          }}>
            SOON
          </span>
        </Row>
        <div className="rule" />

        {/* ── Preferences ── */}
        <SectionLabel>PREFERENCES</SectionLabel>
        <Row label="Currency" last>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={profile?.currency ?? 'GBP'}
              onChange={e => handleCurrencyChange(e.target.value)}
              style={{
                appearance:  'none',
                background:  'none',
                border:      'none',
                fontFamily:  'var(--mono)',
                fontSize:    12,
                letterSpacing: '0.06em',
                color:       'var(--ink-2)',
                cursor:      'pointer',
                outline:     'none',
              }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
            <Arrow dir="right" size={11} color="var(--ink-3)" />
          </div>
        </Row>
        <div className="rule" />

        {/* ── Account ── */}
        <SectionLabel>ACCOUNT</SectionLabel>
        <Row label="Signed in as">
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)', letterSpacing: '0.06em', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
        </Row>
        <Row label="Export my data" onClick={handleExport}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)', letterSpacing: '0.06em' }}>JSON</span>
            <Arrow dir="right" size={11} color="var(--ink-3)" />
          </div>
        </Row>
        <Row label="Sign out" onClick={handleSignOut} last>
          <Arrow dir="right" size={11} color="var(--ink-3)" />
        </Row>
        <div className="rule" />

        {/* ── Danger ── */}
        <SectionLabel>DANGER</SectionLabel>
        <Row
          label={deleting ? 'Deleting…' : deleteConfirm ? 'Tap again to confirm' : 'Delete account'}
          note="Removes all entries permanently"
          onClick={deleting ? undefined : handleDeleteAccount}
          danger
          last
        >
          {!deleting && <Arrow dir="right" size={11} color="var(--warn)" />}
        </Row>

        {/* 1.5 — Inline delete error */}
        {deleteError && (
          <div style={{ padding: '0 24px 16px' }}>
            <div style={{
              fontSize: 13, color: 'var(--warn)', lineHeight: 1.5,
              fontFamily: 'var(--mono)', letterSpacing: '0.02em',
            }}>
              {deleteError}
            </div>
          </div>
        )}

        {/* ── Footer quote ── */}
        <div style={{ padding: '40px 24px 36px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            &ldquo;The space between desire and purchase<br />is where freedom lives.&rdquo;
          </div>
          <div style={{ marginTop: 16 }}>
            <a href="/privacy" style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              PRIVACY · HELP
            </a>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ children }) {
  return (
    <div style={{ padding: '24px 24px 12px' }}>
      <div className="eyebrow">{children}</div>
    </div>
  );
}

function Row({ label, note, children, onClick, danger, last }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{
        all:           'unset',
        display:       'flex',
        justifyContent: 'space-between',
        alignItems:    'center',
        padding:       '18px 24px',
        borderBottom:  last ? '0' : '1px solid var(--rule)',
        cursor:        onClick ? 'pointer' : 'default',
        minHeight:     56,
        width:         '100%',
        boxSizing:     'border-box',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div>
        <div style={{ fontSize: 15, color: danger ? 'var(--warn)' : 'var(--ink)', fontWeight: 400 }}>
          {label}
        </div>
        {note && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 4, textTransform: 'uppercase' }}>
            {note}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {children}
      </div>
    </Tag>
  );
}
