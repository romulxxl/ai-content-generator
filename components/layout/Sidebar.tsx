'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Zap, History, Settings, X } from 'lucide-react'
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
    <aside className="w-60 h-full bg-slate-950 text-white flex flex-col flex-shrink-0">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="bg-teal-500 p-2 rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sm leading-tight flex-1">AI Content Gen</span>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
