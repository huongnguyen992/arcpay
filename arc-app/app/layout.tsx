import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arc App Kit Demo',
  description: 'Send, Bridge, Swap & Unified Balance on Arc Network',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
