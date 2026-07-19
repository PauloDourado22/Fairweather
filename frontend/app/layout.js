import { Archivo } from 'next/font/google';
import './globals.css';

// The Fairweather poster direction runs entirely on Archivo's heavy display
// weights (800/900 for the wordmark and score numbers) — Inter's inability
// to go that heavy without looking mushy is exactly why the earlier "dark
// glass" direction and this one need different fonts, not just different
// colors.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata = {
  title: 'Fairweather',
  description: 'Fairweather aggregates weather, air quality, and daylight into a single outdoor activity score per city.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
