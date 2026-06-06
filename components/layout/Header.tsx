'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface HeaderProps {
  user: SupabaseUser
  onMenuClick?: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-[#faf8f3] border-b border-[#e8e4db] px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-[#a09890] hover:text-[#1c1c17] p-1 rounded"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-display text-base font-bold text-[#1c1c17] tracking-tight">ContentAI</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-[#6b6660]">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline max-w-[200px] truncate">
            {(user.user_metadata?.full_name as string) || user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-[#a09890] hover:text-red-600 transition px-2 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
