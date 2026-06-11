import type { Metadata } from 'next'
import { Public_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'US Pulse — National Metrics Dashboard',
  description:
    'The official statistical record of the United States, made readable. ' +
    'Public-source US political, demographic, and economic data trended to the most recent release.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${publicSans.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen bg-[#FFFFFF] text-[#1B1F23] font-sans">
        <Nav />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">{children}</main>
        <footer className="border-t border-[#D6D9DD] px-6 py-5 mt-16">
          <p className="text-xs text-[#6B7280] text-center font-mono">
            Data sourced from US government agencies via public APIs. Nothing here is real-time — all figures carry a vintage.
            See each metric for source citations and observation dates.
          </p>
        </footer>
      </body>
    </html>
  )
}
