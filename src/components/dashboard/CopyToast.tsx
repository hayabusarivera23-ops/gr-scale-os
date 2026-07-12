'use client'

/**
 * Tiny fixed toast shown after a prompt is copied to the clipboard.
 * Each dashboard section manages its own message state and renders this.
 */

export default function CopyToast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-emerald-500/40 bg-zinc-900 px-5 py-3 shadow-2xl shadow-black/60">
      <p className="text-sm font-bold text-emerald-400">✓ {message}</p>
    </div>
  )
}
