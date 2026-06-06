'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, History, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/generate', label: 'Generate', icon: Zap },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-60 h-full bg-[#1b3f2d] text-white flex flex-col flex-shrink-0">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <span className="font-display font-bold text-base tracking-tight text-white">ContentAI</span>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden ml-auto text-white/50 hover:text-white p-1 rounded"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/8'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-5 pb-5 pt-3 border-t border-white/10">
        <p className="text-[11px] text-white/30 leading-relaxed">
          Powered by Claude AI<br />Anthropic
        </p>
      </div>
    </aside>
  )
}
