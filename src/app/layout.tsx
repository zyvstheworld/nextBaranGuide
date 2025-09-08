import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BaranGuide',
  description: 'Your guide to everything',
  applicationName: 'BaranGuide',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'BaranGuide',
    statusBarStyle: 'default',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 