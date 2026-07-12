'use client'

/**
 * Command Queue — every prompt Mission Control generates is logged here.
 * Gio manually cycles status (Pending → Sent to Claude → Done), deletes
 * items, re-copies any single prompt, or copies all Pending items combined
 * into one batch mega-prompt.
 */

import { useState } from 'react'
import { ListChecks, Copy, Trash2, Layers } from 'lucide-react'
import { cn, copyText } from '@/lib/utils'
import { buildBatchPrompt } from '@/lib/prompts'
import type { OSCommand, CommandStatus } from '@/lib/store'
import CopyToast from './CopyToast'

const STATUS_ORDER: CommandStatus[] = ['Pending', 'Sent to Claude', 'Done']

const STATUS_STYLE: Record<CommandStatus, string> = {
  'Pending':        'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Sent to Claude': 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  'Done':           'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
}

export default function CommandQueue({ commands, onStatus, onDelete }: {
  commands: OSCommand[]
  onStatus: (id: string, status: CommandStatus) => void
  onDelete: (id: string) => void
}) {
  const [toast, setToast] = useState<string | null>(null)
  const pending = commands.filter(c => c.status === 'Pending')

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function copyOne(cmd: OSCommand) {
    await copyText(cmd.prompt)
    flash('Copied — paste into Claude')
  }

  async function copyBatch() {
    if (pending.length === 0) return
    await copyText(buildBatchPrompt(pending))
    flash(`Batch of ${pending.length} copied — paste into Claude`)
  }

  function cycleStatus(cmd: OSCommand) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(cmd.status) + 1) % STATUS_ORDER.length]
    onStatus(cmd.id, next)
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-zinc-800/60 flex flex-wrap items-center gap-2">
        <ListChecks className="h-4 w-4 text-amber-400" />
        <p className="text-[10px] font-black tracking-widest text-amber-500 uppercase">Command Queue</p>
        <span className="text-[10px] text-zinc-600">{pending.length} pending</span>
        {pending.length > 0 && (
          <button onClick={() => void copyBatch()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 transition">
            <Layers className="h-3.5 w-3.5" /> Copy batch prompt ({pending.length})
          </button>
        )}
      </div>

      {commands.length === 0 ? (
        <p className="px-5 py-6 text-xs text-zinc-600">
          Nothing queued yet. Generate a command above or type into the Tell Claude box — everything you copy gets logged here so you can track what Claude has and hasn&apos;t done.
        </p>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {commands.map(cmd => (
            <div key={cmd.id} className="px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-sm font-semibold text-zinc-200 truncate">{cmd.title}</p>
                <p className="text-[10px] text-zinc-600">{new Date(cmd.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
              <button onClick={() => cycleStatus(cmd)} title="Tap to change status"
                className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold whitespace-nowrap transition hover:brightness-125', STATUS_STYLE[cmd.status])}>
                {cmd.status}
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => void copyOne(cmd)} title="Copy prompt again"
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(cmd.id)} title="Delete"
                  className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <CopyToast message={toast} />
    </div>
  )
}
