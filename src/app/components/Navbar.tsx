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
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
            <span className="font-heading text-lg font-semibold text-foreground leading-tight block">
              Essential Matwork
            </span>
            <span className="text-[11px] font-medium tracking-wider uppercase text-muted">
              STOTT PILATES
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted hidden sm:block">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-black/5"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium text-surface bg-primary hover:bg-primary-light transition-colors px-4 py-2 rounded-xl"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
