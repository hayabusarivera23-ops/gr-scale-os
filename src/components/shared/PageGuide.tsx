'use client'

/**
 * PageGuide — answers on every page:
 * What do I do here? · Why does it matter? · What's the next step? · How does this make money?
 * Collapsible so it guides without cluttering.
 */

import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, DollarSign, ArrowRight, Target } from 'lucide-react'

export default function PageGuide({ what, why, next, money }: {
  what: string
  why: string
  next: string
  money: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 mb-4">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left">
        <span className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <HelpCircle className="h-3.5 w-3.5 text-sky-500" /> What do I do on this page?
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-zinc-600" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />}
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-3 sm:grid-cols-2">
          {[
            { icon: Target,     label: 'What',       text: what,  color: 'text-sky-400' },
            { icon: HelpCircle, label: 'Why it matters', text: why, color: 'text-violet-400' },
            { icon: ArrowRight, label: 'Next step',  text: next,  color: 'text-amber-400' },
            { icon: DollarSign, label: 'How this makes money', text: money, color: 'text-emerald-400' },
          ].map(({ icon: Icon, label, text, color }) => (
            <div key={label} className="rounded-lg bg-zinc-900/80 border border-zinc-800/60 px-3 py-2.5">
              <p className={`text-[10px] font-black uppercase tracking-widest ${color} mb-1 flex items-center gap-1.5`}>
                <Icon className="h-3 w-3" /> {label}
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
