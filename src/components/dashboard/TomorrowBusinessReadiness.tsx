'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Copy, Mail, ShieldCheck, Target } from 'lucide-react'
import { CALENDLY_AUDIT_LINK, GMAIL_DRAFTS_LINK } from '@/lib/business'
import { cn } from '@/lib/utils'

const KEY = 'gr.tomorrow-business-ready.v1'

const READY_ITEMS = [
  'Gmail drafts open and reviewed',
  '10 outreach messages picked',
  'Calendly audit link ready',
  'Melo Air / Lex examples ready',
  'Pricing answer ready: $500-750 build + $99/mo',
  'Free 20-minute audit script ready',
  'Proposal next step ready',
  'Every reply will be logged in pipeline',
]

const REPLY_FLOW = `If someone replies tomorrow:

1. Do not rush.
2. Paste their reply into the dashboard reply picker.
3. Choose the matching template.
4. Edit it so it sounds like you.
5. Push for one next step: free audit call, quick audit send-over, or proposal.

Best default response:
"Appreciate you replying. The easiest next step is a quick free audit. I will show you what I noticed, what I would fix first, and whether it is even worth doing right now. Want me to send the quick audit or grab a 20-minute call?"`

const MORNING_SCRIPT = `Tomorrow's business mission:

Send 10. No feature work before that.

1. Open Gmail drafts.
2. Pick 10 HVAC/local business leads.
3. Make each message specific to one problem.
4. Send manually.
5. Mark sent in GR Scale OS.
6. If anyone replies, log it and use the reply picker.
7. End the day knowing whether revenue moved.`

export default function TomorrowBusinessReadiness() {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState('')

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, boolean>)
    } catch {
      setDone({})
    }
  }, [])

  function toggle(item: string) {
    const next = { ...done, [item]: !done[item] }
    setDone(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* local only */ }
  }

  function copyText(text: string, label: string) {
    navigator.clipboard?.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1600)
  }

  const count = useMemo(() => READY_ITEMS.filter(item => done[item]).length, [done])
  const pct = Math.round((count / READY_ITEMS.length) * 100)

  return (
    <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-300" />
            <p className="text-sm font-black text-white">Tomorrow Customer-Ready Desk</p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Free workflow only: prepare, copy, approve, send manually, log everything in the dashboard.
          </p>
        </div>
        <span className={cn(
          'rounded-full border px-3 py-1 text-xs font-black',
          pct >= 80 ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
        )}>
          {pct}% ready
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-2 sm:grid-cols-2">
          {READY_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => toggle(item)}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-lg border px-3 text-left text-xs font-bold transition',
                done[item]
                  ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100'
                  : 'border-zinc-800 bg-black/20 text-zinc-500 hover:text-zinc-300'
              )}
            >
              <CheckCircle2 className={cn('h-4 w-4 shrink-0', done[item] ? 'text-emerald-300' : 'text-zinc-700')} />
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <a href={GMAIL_DRAFTS_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-400">
            <Mail className="h-4 w-4" /> Open Gmail Drafts
          </a>
          <a href={CALENDLY_AUDIT_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200 hover:bg-cyan-400/15">
            Audit Booking Link
          </a>
          <button onClick={() => copyText(MORNING_SCRIPT, 'Morning script copied')} className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-black text-zinc-300 hover:text-white">
            <Copy className="h-4 w-4" /> Copy morning mission
          </button>
          <button onClick={() => copyText(REPLY_FLOW, 'Reply flow copied')} className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-black text-zinc-300 hover:text-white">
            <ShieldCheck className="h-4 w-4" /> Copy reply flow
          </button>
          {copied && <p className="text-xs font-bold text-emerald-300">{copied}</p>}
        </div>
      </div>
    </section>
  )
}
