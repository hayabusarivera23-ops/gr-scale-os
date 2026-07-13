'use client'

/**
 * System Status strip — website, email, and the 4 scheduled Claude jobs.
 * Nothing here is auto-detected (no backend): Gio taps a card to record
 * "confirmed working today", and the dot color shows how stale the last
 * confirmation is. The health-check button copies a prompt asking Claude to
 * verify everything and sync the dashboard.
 */

import { useState } from 'react'
import { Activity, Stethoscope } from 'lucide-react'
import { cn, copyText } from '@/lib/utils'
import { buildHealthCheckPrompt } from '@/lib/prompts'
import CopyToast from './CopyToast'

interface SystemDef {
  id: string
  label: string
  sub: string
  schedule: string
  /** days after which the last confirmation counts as stale */
  staleAfterDays: number
}

const SYSTEMS: SystemDef[] = [
  { id: 'website',     label: 'Website',           sub: 'grscales.com',                          schedule: 'Always on',    staleAfterDays: 7 },
  { id: 'email',       label: 'Email',             sub: 'gio@grscales.com',                      schedule: 'Always on',    staleAfterDays: 7 },
  { id: 'job-engine',  label: 'Daily Engine',      sub: '10 pitch drafts + reply scan + report', schedule: 'Daily 7:00am', staleAfterDays: 1 },
  { id: 'job-replies', label: 'Reply Scan',        sub: 'afternoon inbox sweep',                 schedule: 'Daily 4:00pm', staleAfterDays: 1 },
  { id: 'job-content', label: 'Content Factory',   sub: 'week of content drafts',                schedule: 'Sun 5:00pm',   staleAfterDays: 7 },
  { id: 'job-health',  label: 'Site Health Check', sub: 'all sites + demos verified',            schedule: 'Mon',          staleAfterDays: 7 },
]

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(`${isoDate}T00:00:00`).getTime()
  return Math.floor(ms / 86_400_000)
}

export default function SystemStatus({ confirmations, onConfirm }: {
  confirmations: Record<string, string>
  onConfirm: (systemId: string, isoDate: string) => void
}) {
  const [toast, setToast] = useState<string | null>(null)

  function copyHealthCheck() {
    void copyText(buildHealthCheckPrompt())
    setToast('Health-check prompt copied — paste into Claude')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-emerald-400" />
        <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">System Status</p>
        <button onClick={copyHealthCheck}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition">
          <Stethoscope className="h-3.5 w-3.5" /> Copy health-check prompt
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {SYSTEMS.map(sys => {
          const confirmed = confirmations[sys.id]
          const stale = !confirmed || daysSince(confirmed) > sys.staleAfterDays
          return (
            <button key={sys.id}
              onClick={() => onConfirm(sys.id, new Date().toISOString().slice(0, 10))}
              title="Tap to mark as confirmed working today"
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-left hover:border-zinc-700 active:scale-[0.98] transition">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', stale ? 'bg-amber-400' : 'bg-emerald-400')} />
                <p className="text-xs font-bold text-zinc-200 truncate">{sys.label}</p>
              </div>
              <p className="text-[10px] text-zinc-600 truncate">{sys.sub}</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                <span className="text-zinc-600">{sys.schedule} · </span>
                {confirmed ? `confirmed ${confirmed}` : 'tap to confirm'}
              </p>
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-zinc-700 mt-2">Tap a card after you verify it&apos;s working — the dot goes amber when a confirmation is overdue.</p>
      <CopyToast message={toast} />
    </div>
  )
}
