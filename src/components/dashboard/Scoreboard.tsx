'use client'

/**
 * Scoreboard — the six numbers Gio checks daily:
 * drafted / sent / replies / meetings / clients / MRR.
 * Tap a count to +1 (tiny − to correct); tap MRR to type the exact value.
 * Persisted in store.ts settings.scoreboard.
 * Premium pass: glass panel, one accent gradient, count-up numbers, glow states.
 */

import { useEffect, useRef, useState } from 'react'
import { Trophy, Minus } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { OSScoreboard } from '@/lib/store'

const TILES: { key: keyof OSScoreboard; label: string; color: string; glow: string }[] = [
  { key: 'drafted', label: 'Drafted', color: 'text-zinc-300', glow: 'shadow-zinc-400/10 border-zinc-600/60' },
  { key: 'sent', label: 'Sent', color: 'text-sky-400', glow: 'shadow-sky-500/20 border-sky-500/30' },
  { key: 'replies', label: 'Replies', color: 'text-violet-400', glow: 'shadow-violet-500/20 border-violet-500/30' },
  { key: 'meetings', label: 'Meetings', color: 'text-amber-400', glow: 'shadow-amber-500/20 border-amber-500/30' },
  { key: 'clients', label: 'Clients', color: 'text-emerald-400', glow: 'shadow-emerald-500/25 border-emerald-500/30' },
  { key: 'mrr', label: 'MRR', color: 'text-emerald-400', glow: 'shadow-emerald-500/25 border-emerald-500/30' },
]

/** Animates toward `target` with an ease-out curve; counts up from 0 on first mount. */
function useCountUp(target: number, duration = 700) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) { setDisplay(target); return }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const value = Math.round(from + (target - from) * eased)
      setDisplay(value)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      fromRef.current = target
    }
  }, [target, duration])

  return display
}

function Tile({ tile, value, editingMrr, mrrDraft, setMrrDraft, saveMrr, onTap, onMinus }: {
  tile: typeof TILES[number]
  value: number
  editingMrr: boolean
  mrrDraft: string
  setMrrDraft: (v: string) => void
  saveMrr: () => void
  onTap: () => void
  onMinus: () => void
}) {
  const isMrr = tile.key === 'mrr'
  const display = useCountUp(value)
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current) }, [])

  function tap() {
    onTap()
    if (!isMrr) {
      setFlash(true)
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlash(false), 450)
    }
  }

  return (
    <div className={cn(
      'relative rounded-lg border bg-zinc-950/60 px-2 py-2.5 text-center backdrop-blur-sm transition-all duration-300',
      value > 0 ? cn('shadow-lg', tile.glow) : 'border-zinc-800',
      flash && 'scale-[1.04]'
    )}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">{tile.label}</p>
      {isMrr && editingMrr ? (
        <input
          type="number"
          inputMode="numeric"
          value={mrrDraft}
          onChange={e => setMrrDraft(e.target.value)}
          onBlur={saveMrr}
          onKeyDown={e => { if (e.key === 'Enter') saveMrr() }}
          autoFocus
          className="w-full bg-zinc-900 border border-emerald-500/40 rounded px-1 py-0.5 text-center text-sm font-black text-emerald-400 focus:outline-none"
        />
      ) : (
        <button
          onClick={tap}
          className={cn('w-full text-xl font-black leading-none tabular-nums active:scale-95 transition', tile.color)}>
          {isMrr ? formatCurrency(display) : display}
        </button>
      )}
      {!isMrr && value > 0 && (
        <button onClick={onMinus} title="−1"
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition">
          <Minus className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

export default function Scoreboard({ scoreboard, onChange }: {
  scoreboard: OSScoreboard
  onChange: (s: Partial<OSScoreboard>) => void
}) {
  const [editingMrr, setEditingMrr] = useState(false)
  const [mrrDraft, setMrrDraft] = useState('')

  function bump(key: keyof OSScoreboard, delta: number) {
    onChange({ [key]: Math.max(0, scoreboard[key] + delta) })
  }

  function saveMrr() {
    const n = parseInt(mrrDraft, 10)
    if (!Number.isNaN(n) && n >= 0) onChange({ mrr: n })
    setEditingMrr(false)
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 backdrop-blur-md">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -top-16 right-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-500/10 to-emerald-500/10 blur-2xl" />
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-400" />
        <p className="text-[10px] font-black tracking-widest text-amber-500 uppercase">Scoreboard</p>
        <p className="ml-auto text-[10px] text-zinc-700">tap a number to +1 · tap MRR to edit</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {TILES.map(tile => (
          <Tile
            key={tile.key}
            tile={tile}
            value={scoreboard[tile.key]}
            editingMrr={editingMrr}
            mrrDraft={mrrDraft}
            setMrrDraft={setMrrDraft}
            saveMrr={saveMrr}
            onTap={() => {
              if (tile.key === 'mrr') { setMrrDraft(String(scoreboard.mrr)); setEditingMrr(true) }
              else bump(tile.key, 1)
            }}
            onMinus={() => bump(tile.key, -1)}
          />
        ))}
      </div>
    </div>
  )
}
