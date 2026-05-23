import { Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { BadgeProvider } from '@/hooks/useBadge';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallBanner from '@/components/InstallBanner';
import './globals.css';

// Single variable font — full weight range 200–800.
// One font, dramatic weight variation instead of two fonts.
const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  axes:     ['wght'],
  style:    ['normal', 'italic'],
  variable: '--font-jakarta',
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
    <html lang="en" className={jakarta.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pause" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pause_theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`,
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
