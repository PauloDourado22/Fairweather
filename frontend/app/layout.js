import { Inter } from 'next/font/google';
import './globals.css';

// next/font self-hosts Inter at build time (no runtime Google Fonts request,
// no layout-shifting flash of unstyled text). Exposed as a CSS variable so
// globals.css controls exactly where it's applied instead of it clobbering
// every element via a global className.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Outdoor Conditions Dashboard',
  description: 'Weather, air quality, and daylight — aggregated, with a single outdoor activity score.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
