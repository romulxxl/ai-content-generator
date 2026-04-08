'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Zap, History, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/generate', label: 'Generate', icon: Zap },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-slate-950 text-white flex flex-col flex-shrink-0">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="bg-teal-500 p-2 rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sm leading-tight">AI Content Gen</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
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
