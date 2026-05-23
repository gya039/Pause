import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'sans-serif', lineHeight: 1.7, color: '#333' }}>
      <Link href="/settings" style={{ fontSize: 14, color: '#999', display: 'block', marginBottom: 24 }}>← Back</Link>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Privacy Policy</h1>

      <p style={{ marginBottom: 16 }}>
        Pause stores only what you give it: item names, optional prices, and the mood you selected when you logged them. This data is stored in Firebase (Google) and is private to your account — no one else can see it.
      </p>

      <p style={{ marginBottom: 16 }}>
        We use your email address to send you the 24-hour review reminder. We never share your data with third parties or use it for advertising.
      </p>

      <p style={{ marginBottom: 16 }}>
        You can export or permanently delete all your data at any time from the Settings screen.
      </p>

      <p style={{ color: '#999', fontSize: 13 }}>Last updated: May 2026</p>
    </div>
  );
}
