'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/LoadingScreen';

export default function AuthPage() {
  const router            = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode]   = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        createUserProfile(cred.user.uid, email).catch(console.error);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        createUserProfile(cred.user.uid, email).catch(console.error);
      }
      router.replace('/');
    } catch (err) {
      console.error('Auth error:', err.code, err.message);
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <div style={{
      minHeight:     '100dvh',
      display:       'flex',
      flexDirection: 'column',
      background:    'var(--bg)',
    }}>
      {/* Brand — fills top half */}
      <div style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding:       '60px 28px 36px',
      }}>
        <div style={{
          width:        44,
          height:       44,
          borderRadius: 14,
          background:   'var(--accent)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 22 }}>⏸</span>
        </div>
        <h1 style={{
          fontSize:      44,
          fontWeight:    800,
          letterSpacing: -2.5,
          color:         'var(--t1)',
          lineHeight:    1,
          marginBottom:  12,
        }}>
          Pause.
        </h1>
        <p style={{
          fontSize:   16,
          color:      'var(--t2)',
          lineHeight: 1.55,
          maxWidth:   280,
        }}>
          A 24-hour buffer between impulse and purchase.
        </p>
      </div>

      {/* Form — anchored to bottom, thumb-friendly */}
      <div style={{ padding: '0 20px 48px' }}>
        <div style={{
          background:   'var(--surface)',
          borderRadius: 'var(--r-lg)',
          padding:      '24px 20px',
          boxShadow:    'var(--shadow)',
          marginBottom: 16,
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoComplete="email"
            />
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Password (6+ characters)' : 'Password'}
              required
              minLength={6}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />

            {error && (
              <div style={{
                background:   '#FEF2F2',
                borderRadius: 'var(--r-sm)',
                padding:      '10px 14px',
                fontSize:     13,
                color:        'var(--danger)',
                lineHeight:   1.5,
              }}>
                {error}
              </div>
            )}

            <button
              className="btn-accent"
              type="submit"
              disabled={busy}
              style={{ marginTop: 4 }}
            >
              {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          style={{
            display:   'block',
            width:     '100%',
            background: 'none',
            border:    'none',
            color:     'var(--t2)',
            cursor:    'pointer',
            fontSize:  14,
            textAlign: 'center',
            padding:   10,
            lineHeight: 1.5,
          }}
        >
          {mode === 'login'
            ? "Don't have an account? Register →"
            : 'Already have an account? Sign in →'}
        </button>
      </div>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'No account found with those details. Try "Register" if you\'re new.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    default: return 'Something went wrong. Please try again.';
  }
}
