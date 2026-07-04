'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Phone, Search, Clock, Calendar, DollarSign,
  FileText, Globe, Zap, CheckCircle2, Circle, Timer,
  ChevronRight, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  WorkflowLead, QueueItem, QueueItemType,
  buildWorkQueue, QUEUE_TYPE_CONFIG
} from '@/lib/workflow'

// ─── Data ─────────────────────────────────────────────────────────────────────

const LEADS: WorkflowLead[] = [
  { id: '7',  business_name: 'Premier Climate Control',       industry: 'HVAC', city: 'Jacksonville',    phone: '(904) 555-0505', website: 'https://premierclimate.com', status: 'New', website_score: null, opportunity_score: 91, estimated_deal_value: 2500, days_since_contact: 0, next_follow_up: null, notes: 'Site looks 2012. No mobile.' },
  { id: '1',  business_name: 'Cool Coast Heating & Cooling',  industry: 'HVAC', city: 'Sarasota',        phone: '(941) 623-4518', website: 'https://coolcoast.net',       status: 'New', website_score: null, opportunity_score: 88, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Hibu template. Expired coupons.' },
  { id: '2',  business_name: 'Aire Masters Heating & Air',    industry: 'HVAC', city: 'Ocala',           phone: '(352) 414-6556', website: 'https://airemasters.com',       status: 'New', website_score: null, opportunity_score: 89, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Title tag: "Brien for County Commissioner."' },
  { id: '5',  business_name: 'Sunshine HVAC Services',        industry: 'HVAC', city: 'Tampa',           phone: '(813) 555-0303', website: 'https://sunshinehvac.com',     status: 'New', website_score: null, opportunity_score: 82, estimated_deal_value: 1500, days_since_contact: 0, next_follow_up: null, notes: 'Slow site, no service area pages.' },
  { id: '4',  business_name: 'Arctic Air Conditioning',       industry: 'HVAC', city: 'Orlando',         phone: '(407) 555-0202', website: 'https://arcticair-orlando.com', status: 'New', website_score: null, opportunity_score: 79, estimated_deal_value: 1500, days_since_contact: 0, next_follow_up: null, notes: 'No quote form. Losing Maps traffic.' },
  { id: '10', business_name: 'Elite HVAC Solutions',          industry: 'HVAC', city: 'Port St. Lucie',  phone: '(772) 555-0808', website: 'https://elitehvac.com',         status: 'New', website_score: null, opportunity_score: 72, estimated_deal_value: 1500, days_since_contact: 0, next_follow_up: null, notes: 'Squarespace. Missing city pages.' },
  { id: '9',  business_name: 'Comfort Zone AC',               industry: 'HVAC', city: 'Lakeland',        phone: '(863) 555-0707', website: undefined,                       status: 'New', website_score: null, opportunity_score: 70, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'No website.' },
  { id: '3',  business_name: 'Fort Lauderdale AC Repair',     industry: 'HVAC', city: 'Fort Lauderdale', phone: '(754) 266-3008', website: undefined,                       status: 'New', website_score: null, opportunity_score: 65, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Maps listing only.' },
  { id: '6',  business_name: 'Breeze Masters AC',             industry: 'HVAC', city: 'Miami',           phone: '(305) 555-0404', website: undefined,                       status: 'New', website_score: null, opportunity_score: 60, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Facebook only.' },
  { id: '8',  business_name: 'Gulf Coast HVAC',               industry: 'HVAC', city: 'Cape Coral',      phone: '(239) 555-0606', website: undefined,                       status: 'New', website_score: null, opportunity_score: 45, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Lower priority.' },
]

const DEMOS_FOR_QUEUE = [
  { id: 'roofing',  industry: 'Roofing',  status: 'Planned',  completion: 0 },
  { id: 'plumbing', industry: 'Plumbing', status: 'Planned',  completion: 0 },
]

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Phone, Search, Clock, Calendar, DollarSign, FileText, Globe, Zap,
}

// ─── Type labels ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<QueueItemType, string> = {
  chase_proposal: 'Chase Proposal',
  prep_meeting:   'Prep Meeting',
  book_meeting:   'Book Meeting',
  follow_up:      'Follow Up',
  call:           'Make Call',
  audit:          'Run Audit',
  research:       'Research',
  build_demo:     'Build Demo',
  finish_demo:    'Finish Demo',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QueuePage() {
  const [leads, setLeads]       = useState(LEADS)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [lastReset, setLastReset] = useState<Date>(new Date())

  const queue = useMemo(() => buildWorkQueue(leads, DEMOS_FOR_QUEUE), [leads])

  const pending   = queue.filter(i => !completed.has(i.id))
  const done      = queue.filter(i => completed.has(i.id))
  const totalMins = pending.reduce((s, i) => s + i.estimated_minutes, 0)
  const hours     = Math.floor(totalMins / 60)
  const mins      = totalMins % 60

  function toggle(id: string) {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function resetQueue() {
    setCompleted(new Set())
    setLastReset(new Date())
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Work Queue</h2>
          <p className="text-sm text-zinc-600 mt-0.5">
            {greeting}, Gio. {pending.length} items · {hours > 0 ? `${hours}h ` : ''}{mins}m to complete.
          </p>
        </div>
        <button onClick={resetQueue}
          className="btn-ghost text-xs flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* Progress bar */}
      {queue.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Today&apos;s Progress</span>
            <span className="text-xs text-zinc-500">{done.length}/{queue.length} complete</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-800">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${queue.length > 0 ? (done.length / queue.length) * 100 : 0}%` }}
            />
          </div>
          {done.length === queue.length && queue.length > 0 && (
            <p className="text-xs text-emerald-400 mt-2 font-medium">Queue complete. Add more leads or log outreach.</p>
          )}
        </div>
      )}

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((item, idx) => {
            const cfg    = QUEUE_TYPE_CONFIG[item.type]
            const Icon   = ICON_MAP[cfg.icon] ?? Zap
            const isTop  = idx === 0

            return (
              <div key={item.id}
                className={cn(
                  'flex items-start gap-4 rounded-xl border p-4 transition',
                  isTop ? 'border-sky-500/30 bg-sky-500/5' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                )}>

                {/* Check button */}
                <button onClick={() => toggle(item.id)} className="mt-0.5 shrink-0">
                  <Circle className="h-5 w-5 text-zinc-600 hover:text-emerald-400 transition" />
                </button>

                {/* Icon */}
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', cfg.bg)}>
                  <Icon className={cn('h-4 w-4', cfg.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isTop && (
                      <span className="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider">Do First</span>
                    )}
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{TYPE_LABELS[item.type]}</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-100 mt-1">{item.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{item.sub}</p>

                  {/* Time estimate */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3 text-zinc-700" />
                      <span className="text-[10px] text-zinc-600">~{item.estimated_minutes} min</span>
                    </div>
                    {item.phone && (
                      <a href={`tel:${item.phone}`}
                        className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-sky-400 transition">
                        <Phone className="h-3 w-3" /> {item.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <Link href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shrink-0 transition',
                    isTop
                      ? 'bg-sky-500/20 border-sky-500/30 text-sky-400 hover:bg-sky-500/30'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  )}>
                  Go <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed items */}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-600 mb-2 uppercase tracking-wider">Completed ({done.length})</p>
          <div className="space-y-1.5">
            {done.map(item => {
              const cfg  = QUEUE_TYPE_CONFIG[item.type]
              const Icon = ICON_MAP[cfg.icon] ?? Zap
              return (
                <div key={item.id}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800/40 bg-zinc-900/30 px-4 py-3 opacity-50">
                  <button onClick={() => toggle(item.id)}>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </button>
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', cfg.bg)}>
                    <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
                  </div>
                  <p className="text-sm text-zinc-500 line-through flex-1">{item.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {queue.length === 0 && (
        <div className="py-16 text-center">
          <Zap className="h-10 w-10 text-sky-500/30 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No queue items generated.</p>
          <p className="text-xs text-zinc-700 mt-1">Add leads to the CRM to auto-fill your queue.</p>
          <Link href="/leads" className="mt-4 inline-flex items-center gap-1.5 text-xs text-sky-400 hover:underline">
            Go to Leads <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-zinc-700 pb-4">
        Queue rebuilds automatically as lead statuses change.
        Last reset: {lastReset.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.
      </p>
    </div>
  )
}
