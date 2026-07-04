'use client'

/**
 * Demo Library — every LIVE demo from the deployed Demo Factory.
 * Source of truth: src/lib/demos.ts (real URLs at gr-scale-demos.vercel.app).
 * No fake data, no placeholders — all 13 are deployed and verified.
 */

import { useState } from 'react'
import { Globe, Copy, ExternalLink, Check, Megaphone, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LIVE_DEMOS, DEMO_BASE } from '@/lib/demos'
import PageGuide from '@/components/shared/PageGuide'

export default function DemosPage() {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(url: string, slug: string) {
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Demo Library</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {LIVE_DEMOS.length} live demos · <a href={DEMO_BASE} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{DEMO_BASE.replace('https://', '')}</a>
          </p>
        </div>
        <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          ● All {LIVE_DEMOS.length} Live
        </span>
      </div>

      <PageGuide
        what="This is your sales ammunition: 13 live demo websites, one per industry. Copy the link that matches your lead's industry and send it in your outreach."
        why="A prospect who SEES what their site could look like closes far easier than one reading a pitch. The demo does the selling for you."
        next="Find a lead in Lead Inbox → copy their industry's demo link here → send the outreach text with the link."
        money="Every demo link sent is a shot at $99-599/mo recurring. The link costs nothing — send at least 10 a day."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LIVE_DEMOS.map(demo => (
          <div key={demo.slug} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 shrink-0">
                  <Globe className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-sm">{demo.industry}</h3>
                  <p className="text-[10px] text-zinc-600">/{demo.slug}</p>
                </div>
              </div>
              <span className="badge bg-emerald-500/15 text-emerald-400 text-[10px] shrink-0">● Live</span>
            </div>

            <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1 flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-amber-400" /> When to use
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">{demo.useCase}</p>
            </div>

            <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1 flex items-center gap-1">
                <Megaphone className="h-3 w-3 text-sky-400" /> Outreach angle
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed italic">{demo.outreachAngle}</p>
            </div>

            <div className="flex gap-2 mt-auto pt-1">
              <a href={demo.url} target="_blank" rel="noopener noreferrer"
                className="btn-primary flex-1 justify-center text-xs py-2">
                <ExternalLink className="h-3.5 w-3.5" /> Open Demo
              </a>
              <button onClick={() => copy(demo.url, demo.slug)}
                className={cn('btn-ghost flex-1 justify-center text-xs py-2', copied === demo.slug && 'text-emerald-400')}>
                {copied === demo.slug ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === demo.slug ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
