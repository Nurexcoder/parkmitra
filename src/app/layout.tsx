import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ParkMitra - Smart Parking Management',
  description: 'QR-based parking management system for Kolkata',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
