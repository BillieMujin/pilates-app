import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <span className="text-[12px] text-foreground/30">
          Essential Matwork
        </span>
        <Link
          href="/privacy"
          className="text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  )
}
