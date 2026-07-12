'use client'

/**
 * "Tell Claude Anything" — Gio types any request in plain words. On submit it
 * wraps the words in the executive-team prompt template (full business
 * context via src/lib/prompts.ts), copies it to the clipboard, and logs it
 * to the Command Queue as Pending.
 */

import { useState } from 'react'
import { Sparkles, Copy } from 'lucide-react'
import { copyText } from '@/lib/utils'
import { buildFreeformPrompt } from '@/lib/prompts'
import CopyToast from './CopyToast'

export default function TellClaude({ onQueue }: {
  onQueue: (title: string, prompt: string) => void
}) {
  const [text, setText] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  async function submit() {
    const request = text.trim()
    if (!request) return
    const prompt = buildFreeformPrompt(request)
    const title = request.length > 60 ? `${request.slice(0, 57)}…` : request
    await copyText(prompt)
    onQueue(title, prompt)
    setText('')
    setToast('Copied — paste into Claude')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 px-5 py-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-sky-400" />
        <p className="text-[10px] font-black tracking-widest text-sky-400 uppercase">Tell Claude Anything</p>
      </div>
      <p className="text-xs text-zinc-500 mb-3">
        Type any request in your own words. It gets wrapped with full GR Scale context, copied, and queued — paste it into Claude and your executive team gets to work.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit() }}
        placeholder='e.g. "Find every roofing lead that never replied and write me a win-back text for each"'
        rows={3}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-sky-500/60 focus:outline-none resize-y"
      />
      <button onClick={() => void submit()} disabled={!text.trim()}
        className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-black text-white hover:bg-sky-400 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition">
        <Copy className="h-4 w-4" /> Copy Prompt for Claude
      </button>
      <CopyToast message={toast} />
    </div>
  )
}
