'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/economy', label: 'Economy' },
  { href: '/demographics', label: 'Demographics' },
  { href: '/politics', label: 'Politics' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-[#D6D9DD] bg-white sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight">US Pulse</span>
          <span className="hidden sm:inline text-xs font-mono text-[#6B7280] tracking-wide">
            National Metrics Dashboard
          </span>
        </Link>
        <nav className="flex gap-1">
          {LINKS.map(({ href, label }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'text-[#2A5DB0] bg-[#EEF3FB]'
                    : 'text-[#1B1F23] hover:text-[#2A5DB0] hover:bg-[#F5F7FA]'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
