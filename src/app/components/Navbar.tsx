'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/25">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
              />
            </svg>
          </div>
          <div>
            <span className="font-heading text-[17px] font-semibold text-foreground leading-tight block tracking-tight">
              Essential Matwork
            </span>
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-foreground/30">
              PILATES REFERENCE
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-[13px] text-foreground/30 hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[13px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors px-3 py-1.5 rounded-lg hover:bg-black/[0.03]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-4 py-2 rounded-xl shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
