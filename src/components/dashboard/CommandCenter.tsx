'use client'

/**
 * Command Center 2.0 — grid of one-tap commands for Claude.
 * Each button opens a modal collecting 0-3 short inputs, then builds a
 * COMPLETE self-contained prompt (business context baked in via
 * src/lib/prompts.ts), copies it to the clipboard, and logs it to the
 * Command Queue as Pending. Nothing is ever sent automatically.
 */

import { useState } from 'react'
import { X, Copy } from 'lucide-react'
import { copyText } from '@/lib/utils'
import { COMMANDS, type CommandDef } from '@/lib/prompts'
import CopyToast from './CopyToast'

export default function CommandCenter({ onQueue }: {
  onQueue: (title: string, prompt: string) => void
}) {
  const [active, setActive] = useState<CommandDef | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string | null>(null)

  function open(cmd: CommandDef) {
    setValues({})
    setActive(cmd)
  }

  function generate(cmd: CommandDef) {
    const prompt = cmd.build(values)
    const inputSummary = cmd.inputs.map(i => values[i.id]).filter(Boolean).join(', ')
    const title = inputSummary ? `${cmd.label} — ${inputSummary}` : cmd.label
    // Queue first, then copy: the command must be logged even if the
    // clipboard is blocked or slow on this device.
    onQueue(title, prompt)
    void copyText(prompt)
    setActive(null)
    setToast('Copied — paste into Claude')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-5 py-4">
      <p className="text-[10px] font-black tracking-widest text-violet-400 uppercase mb-1">Command Center</p>
      <p className="text-xs text-zinc-500 mb-3">
        Tap a command → it builds a complete prompt with all GR Scale context → copies to clipboard → paste into Claude. Every command is logged in the queue below.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {COMMANDS.map(cmd => (
          <button key={cmd.id} onClick={() => open(cmd)}
            className="flex flex-col items-start gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-3 text-left hover:bg-violet-500/20 active:scale-[0.98] transition">
            <span className="text-lg leading-none">{cmd.emoji}</span>
            <span className="text-xs font-bold text-violet-200">{cmd.label}</span>
            <span className="text-[10px] text-zinc-500 leading-snug">{cmd.description}</span>
          </button>
        ))}
      </div>

      {/* Input modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
          onClick={() => setActive(null)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-base font-black text-zinc-100">{active.emoji} {active.label}</p>
              <button onClick={() => setActive(null)} className="text-zinc-500 hover:text-zinc-200 transition p-1 -m-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-4">{active.description}</p>

            {active.inputs.length > 0 ? (
              <div className="space-y-3 mb-4">
                {active.inputs.map(input => (
                  <div key={input.id}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      {input.label}
                    </label>
                    <input
                      type="text"
                      value={values[input.id] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [input.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') generate(active) }}
                      placeholder={input.placeholder}
                      autoFocus={input.id === active.inputs[0]?.id}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-violet-500/60 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 mb-4">No inputs needed — the prompt is ready to generate.</p>
            )}

            <button onClick={() => generate(active)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-black text-white hover:bg-violet-400 active:scale-[0.99] transition">
              <Copy className="h-4 w-4" /> Generate & Copy Prompt
            </button>
          </div>
        </div>
      )}

      <CopyToast message={toast} />
    </div>
  )
}
