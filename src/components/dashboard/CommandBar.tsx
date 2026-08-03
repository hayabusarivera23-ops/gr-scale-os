'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bot, CheckCircle2, Dumbbell, Target, Zap } from 'lucide-react'
import { useOS } from '@/lib/store'
import { nextMoneyAction, pipelineFromStore } from '@/lib/business'
import { TRAINING_WEEK } from '@/lib/personal'

const CHECKLIST_KEY = 'gio-os-checklist-v1'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function weekdayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

export default function CommandBar() {
  const { data, ready } = useOS()
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [today, setToday] = useState({ iso: '', weekday: '' })

  useEffect(() => {
    setToday({ iso: todayIso(), weekday: weekdayName() })
    try {
      setChecklist(JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}') as Record<string, boolean>)
    } catch {
      setChecklist({})
    }
  }, [])

  const training = TRAINING_WEEK.find(day => day.day === today.weekday)
  const checkedIn = Boolean(today.iso && checklist[`${today.iso}-weigh`])
  const action = useMemo(() => nextMoneyAction(pipelineFromStore(data)), [data])
  const activeEmployees = data.settings.system_confirmations ? 'green' : 'green'

  return (
    <div className="border-b border-zinc-800/80 bg-[#09090b]/95 px-3 py-2 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-2 md:grid-cols-[1fr_1.35fr_0.85fr]">
        <Link href="/gio" className="flex min-h-11 items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 transition hover:bg-emerald-500/10">
          {checkedIn ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Dumbbell className="h-4 w-4 text-emerald-400" />}
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-emerald-300">{checkedIn ? 'Checked in' : 'Check in now'}</p>
            <p className="truncate text-[11px] text-zinc-500">{training?.title ?? 'Training plan ready'}</p>
          </div>
        </Link>

        <Link href={action.href} target={action.href.startsWith('http') ? '_blank' : undefined} className="flex min-h-11 items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 transition hover:bg-sky-500/10">
          <Target className="h-4 w-4 text-sky-400" />
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-sky-300">Money mission</p>
            <p className="truncate text-[11px] text-zinc-400">{ready ? action.sentence : 'Loading money action...'}</p>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/approve" className="flex min-h-11 items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 transition hover:bg-amber-500/10">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="truncate text-xs font-black text-amber-300">Approvals</span>
          </Link>
          <Link href="/agents" className="flex min-h-11 items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 transition hover:bg-violet-500/10">
            <span className={`h-2 w-2 rounded-full ${activeEmployees === 'green' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <Bot className="h-4 w-4 text-violet-400" />
            <span className="truncate text-xs font-black text-violet-300">Employees</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
