import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ORYQEN — Clarity for Every Opportunity',
  description:
    'A smarter way to evaluate job offers, understand agreements, and build a trusted record of work.',
  applicationName: 'ORYQEN',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'ORYQEN — Clarity for Every Opportunity',
    description: 'Understand opportunities before you commit.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#030b18',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#about">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
