'use client'

/**
 * Outreach Approval Queue — Phase 2+3 of Revenue Mode.
 * Every active lead gets auto-generated, personalized outreach.
 * Two buttons per lead: APPROVE or EDIT. Approved = one-tap send links.
 * Nothing ever sends automatically. Approvals persist in localStorage.
 */

import { useEffect, useState } from 'react'
import { Phone, MessageSquare, Check, Pencil, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOS } from '@/lib/store'
import { demoForIndustry } from '@/lib/demos'
import { PACKAGES } from '@/lib/packages'

const KEY = 'gr-scale-approvals-v1'
type Approval = { status: 'Pending' | 'Approved' | 'Sent'; text?: string }

export default function ApprovePage() {
  const { data, ready, updateLead } = useOS()
  const [state, setState] = useState<Record<string, Approval>>({})
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    try { setState(JSON.parse(localStorage.getItem(KEY) ?? '{}')) } catch { /* fresh */ }
  }, [])

  function save(next: Record<string, Approval>) {
    setState(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  if (!ready) return <div className="text-sm text-zinc-600 p-4">Loading…</div>

  const leads = data.leads
    .filter(l => !['Won', 'Lost'].includes(l.status))
    .sort((a, b) => b.opportunity_score - a.opportunity_score)

  const defaultMsg = (l: typeof leads[number]) => {
    const demo = demoForIndustry(l.industry)
    const flaw = l.notes ? l.notes.split('.')[0].toLowerCase() : 'a few things costing you calls'
    return `Hi, is this the owner of ${l.business_name}? I'm Gio — I build websites for ${l.industry.toLowerCase()} companies in Florida. I looked at your online presence and noticed ${flaw}. Live example of what I build: ${demo.url} — worth 30 seconds on your phone. Want a free 1-minute video audit? No strings.`
  }

  const approvedCount = Object.values(state).filter(a => a.status !== 'Pending').length

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Approval Queue</h2>
          <p className="text-sm text-zinc-500 mt-1">Review in under 30 seconds each. Nothing sends without you.</p>
        </div>
        <span className="badge bg-sky-500/15 text-sky-400">{approvedCount}/{leads.length} approved</span>
      </div>

      {leads.map(l => {
        const a = state[l.id] ?? { status: 'Pending' as const }
        const msg = a.text ?? defaultMsg(l)
        const demo = demoForIndustry(l.industry)
        const pkg = l.recommended_package ? PACKAGES[l.recommended_package] : PACKAGES.growth
        return (
          <div key={l.id} className={cn('rounded-2xl border p-5 space-y-3',
            a.status === 'Sent' ? 'border-emerald-500/30 bg-emerald-500/5' :
            a.status === 'Approved' ? 'border-sky-500/30 bg-sky-500/5' : 'border-zinc-800 bg-zinc-900/60')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-zinc-100">{l.business_name} <span className="text-zinc-600 font-normal">· {l.city} · score {l.opportunity_score}</span></p>
                <p className="text-[11px] text-zinc-500">{pkg.name} {pkg.monthlyLabel} · {demo.industry} demo · {l.phone ?? 'no phone — use email/form'}</p>
              </div>
              <span className={cn('badge text-[10px]',
                a.status === 'Sent' ? 'bg-emerald-500/15 text-emerald-400' :
                a.status === 'Approved' ? 'bg-sky-500/15 text-sky-400' : 'bg-zinc-800 text-zinc-400')}>{a.status}</span>
            </div>

            {editing === l.id ? (
              <textarea defaultValue={msg} rows={5} autoFocus
                className="w-full rounded-xl bg-zinc-950 border border-zinc-700 p-3 text-sm text-zinc-200 focus:outline-none focus:border-sky-500"
                onBlur={e => { save({ ...state, [l.id]: { ...a, text: e.target.value } }); setEditing(null) }} />
            ) : (
              <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/60 rounded-xl p-3 border border-zinc-800/60">{msg}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {a.status === 'Pending' && (
                <>
                  <button onClick={() => save({ ...state, [l.id]: { ...a, status: 'Approved' } })}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-5 py-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500/25 transition">
                    <Check className="h-4 w-4" /> APPROVE
                  </button>
                  <button onClick={() => setEditing(l.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-300 hover:text-zinc-100 transition">
                    <Pencil className="h-4 w-4" /> EDIT
                  </button>
                </>
              )}
              {a.status === 'Approved' && l.phone && (
                <>
                  <a href={`sms:${l.phone.replace(/[^+\d]/g, '')}?body=${encodeURIComponent(msg)}`}
                    className="btn-primary text-sm"><MessageSquare className="h-4 w-4" /> Send SMS</a>
                  <a href={`tel:${l.phone}`} className="btn-ghost text-sm"><Phone className="h-4 w-4" /> Call</a>
                  <button onClick={() => { save({ ...state, [l.id]: { ...a, status: 'Sent' } }); updateLead(l.id, { status: 'Contacted', days_since_contact: 0 }) }}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-sm font-bold text-emerald-400">
                    <Send className="h-4 w-4" /> Mark Sent
                  </button>
                </>
              )}
              {a.status === 'Sent' && <p className="text-xs text-emerald-400">Logged — pipeline updated to Contacted. Follow-up due in 2 days.</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
