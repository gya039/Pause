import { Plus_Jakarta_Sans, Lora } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { BadgeProvider } from '@/hooks/useBadge';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallBanner from '@/components/InstallBanner';
import './globals.css';

// Primary UI font — variable weight 200–800, dramatic weight range.
const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  axes:     ['wght'],
  style:    ['normal', 'italic'],
  variable: '--font-jakarta',
  display:  'swap',
});

// Serif — italic only, for emotional moments (held./bought., quotes, figures).
const lora = Lora({
  subsets:  ['latin'],
  style:    ['italic'],
  weight:   ['400', '700'],
  variable: '--font-lora',
  display:  'swap',
});

export const metadata = {
  title:       'Pause',
  description: 'Your emotional spending mirror',
  manifest:    '/manifest.json',
};

export const viewport = {
  themeColor:          '#F5F0EB',
  colorScheme:         'light dark',
  minimumScale:        1,
  initialScale:        1,
  width:               'device-width',
  viewportFit:         'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${lora.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pause" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Apply saved theme before first paint — also syncs to system preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var saved = localStorage.getItem('pause_theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (saved === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch(e) {}
})();`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <BadgeProvider>
            {children}
            <InstallBanner />
          </BadgeProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
