import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Battleship Naval Strategy',
  description:
    'A modern battleship game featuring historical naval vessels with real-time multiplayer gameplay',
  keywords: ['battleship', 'naval', 'strategy', 'game', 'multiplayer', 'historical'],
  authors: [{ name: 'Battleship Naval Strategy Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-navy-900 text-white min-h-screen`}>
        <div id="root" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
