import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { BodyScaler } from '@/components/BodyScaler'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ACIST Pro',
  description: 'ACIST Pro Contrast Injection System',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-neutral-950">
      <body className={`${inter.variable} font-sans antialiased relative h-[800px] w-[1280px] shrink-0 origin-center overflow-hidden bg-background shadow-2xl`}>
        <BodyScaler />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
