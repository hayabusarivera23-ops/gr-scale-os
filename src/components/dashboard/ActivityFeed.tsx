'use client'

/**
 * "What Claude Has Done" — read-only render of src/lib/activity.ts.
 * That file is Claude's logbook: Claude prepends entries and pushes to main;
 * this component only displays them (newest first). No UI writes here, ever.
 */

import { useState } from 'react'
import { Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACTIVITY, type ActivityCategory } from '@/lib/activity'

const CATEGORY_STYLE: Record<ActivityCategory, { label: string; chip: string; dot: string }> = {
  outreach: { label: 'Outreach', chip: 'text-sky-400 bg-sky-500/10 border-sky-500/20',         dot: 'bg-sky-400' },
  build:    { label: 'Build',    chip: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  content:  { label: 'Content',  chip: 'text-violet-400 bg-violet-500/10 border-violet-500/20',    dot: 'bg-violet-400' },
  system:   { label: 'System',   chip: 'text-amber-400 bg-amber-500/10 border-amber-500/20',       dot: 'bg-amber-400' },
}

const COLLAPSED_COUNT = 6

export default function ActivityFeed() {
  const [expanded, setExpanded] = useState(false)
  // Defensive sort: entries should already be newest-first in activity.ts
  const entries = [...ACTIVITY].sort((a, b) => b.date.localeCompare(a.date))
  const visible = expanded ? entries : entries.slice(0, COLLAPSED_COUNT)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-zinc-800/60 flex items-center gap-2">
        <Bot className="h-4 w-4 text-emerald-400" />
        <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">What Claude Has Done</p>
        <span className="ml-auto text-[10px] text-zinc-600">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</span>
      </div>
      <div className="divide-y divide-zinc-800/60">
        {visible.map((e, i) => {
          const style = CATEGORY_STYLE[e.category]
          return (
            <div key={`${e.date}-${i}`} className="px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
                <p className="text-sm font-bold text-zinc-200">{e.title}</p>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-1.5">{e.detail}</p>
              <div className="flex items-center gap-2">
                <span className={cn('text-[9px] font-bold uppercase tracking-wider rounded border px-1.5 py-0.5', style.chip)}>
                  {style.label}
                </span>
                <span className="text-[10px] text-zinc-600">{e.date}</span>
              </div>
            </div>
          )
        })}
      </div>
      {entries.length > COLLAPSED_COUNT && (
        <button onClick={() => setExpanded(x => !x)}
          className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-300 border-t border-zinc-800/60 transition">
          {expanded ? <>Show less <ChevronUp className="h-3.5 w-3.5" /></> : <>Show all {entries.length} <ChevronDown className="h-3.5 w-3.5" /></>}
        </button>
      )}
    </div>
  )
}
