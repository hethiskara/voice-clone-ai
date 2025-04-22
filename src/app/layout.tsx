import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/layout/Header'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice Clone AI',
  description: 'Create natural-sounding voice clones with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
