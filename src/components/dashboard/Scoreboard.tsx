'use client'

/**
 * Scoreboard — the six numbers Gio checks daily:
 * drafted / sent / replies / meetings / clients / MRR.
 * Tap a count to +1 (tiny − to correct); tap MRR to type the exact value.
 * Persisted in store.ts settings.scoreboard.
 */

import { useState } from 'react'
import { Trophy, Minus } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { OSScoreboard } from '@/lib/store'

const TILES: { key: keyof OSScoreboard; label: string; color: string }[] = [
  { key: 'drafted',  label: 'Drafted',  color: 'text-zinc-300' },
  { key: 'sent',     label: 'Sent',     color: 'text-sky-400' },
  { key: 'replies',  label: 'Replies',  color: 'text-violet-400' },
  { key: 'meetings', label: 'Meetings', color: 'text-amber-400' },
  { key: 'clients',  label: 'Clients',  color: 'text-emerald-400' },
  { key: 'mrr',      label: 'MRR',      color: 'text-emerald-400' },
]

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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-400" />
        <p className="text-[10px] font-black tracking-widest text-amber-500 uppercase">Scoreboard</p>
        <p className="ml-auto text-[10px] text-zinc-700">tap a number to +1 · tap MRR to edit</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {TILES.map(tile => {
          const isMrr = tile.key === 'mrr'
          const value = scoreboard[tile.key]
          return (
            <div key={tile.key} className="relative rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2.5 text-center">
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
                  onClick={() => {
                    if (isMrr) { setMrrDraft(String(value)); setEditingMrr(true) }
                    else bump(tile.key, 1)
                  }}
                  className={cn('w-full text-xl font-black leading-none active:scale-95 transition', tile.color)}>
                  {isMrr ? formatCurrency(value) : value}
                </button>
              )}
              {!isMrr && value > 0 && (
                <button onClick={() => bump(tile.key, -1)} title="−1"
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition">
                  <Minus className="h-3 w-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
