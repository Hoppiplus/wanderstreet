import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WanderStreet — Street-level immersive travel',
  description:
    'Drop a pin anywhere and find real POV footage shot within metres of that exact spot. Jakarta, Indonesia and beyond.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'WanderStreet',
    description: 'Immersive street-level travel through real YouTube footage.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-brand-bg text-brand-text antialiased">
        {children}
      </body>
    </html>
  );
}
