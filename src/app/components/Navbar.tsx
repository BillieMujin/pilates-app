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
              <Link
                href="/clients"
                className="flex items-center gap-1.5 text-[13px] font-medium text-primary/70 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/[0.04]"
                title="Clients"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="hidden sm:inline">Clients</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-[13px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors px-3 py-1.5 rounded-lg hover:bg-black/[0.03]"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
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
