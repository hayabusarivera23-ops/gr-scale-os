'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Phone, ChevronRight, ArrowRight, Zap, CheckCircle2,
  Search, Users, Clock, Calendar, DollarSign, FileText
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import {
  WORKFLOW_STAGES, STAGE_CONFIG, WorkflowStage, WorkflowLead,
  toStage, isActionableToday
} from '@/lib/workflow'

// ─── Lead data ────────────────────────────────────────────────────────────────

const LEADS: WorkflowLead[] = [
  { id: '7',  business_name: 'Premier Climate Control',       industry: 'HVAC', city: 'Jacksonville',    phone: '(904) 555-0505', email: 'mike@premierclimate.com', website: 'https://premierclimate.com', status: 'New', website_score: null, opportunity_score: 91, estimated_deal_value: 2500, days_since_contact: 0, next_follow_up: null, notes: 'Site looks 2012. No mobile. High-value Dominate target.' },
  { id: '1',  business_name: 'Cool Coast Heating & Cooling',  industry: 'HVAC', city: 'Sarasota',        phone: '(941) 623-4518', email: 'office@coolcoast.net',    website: 'https://coolcoast.net',       status: 'New', website_score: null, opportunity_score: 88, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Hibu template. 555 placeholder phone. Expired coupons.' },
  { id: '2',  business_name: 'Aire Masters Heating & Air',    industry: 'HVAC', city: 'Ocala',           phone: '(352) 414-6556', website: 'https://airemasters.com',                                         status: 'New', website_score: null, opportunity_score: 89, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Title tag: "Brien for County Commissioner." SEO disaster.' },
  { id: '5',  business_name: 'Sunshine HVAC Services',        industry: 'HVAC', city: 'Tampa',           phone: '(813) 555-0303', email: 'info@sunshinehvac.com',   website: 'https://sunshinehvac.com',    status: 'New', website_score: null, opportunity_score: 82, estimated_deal_value: 1500, days_since_contact: 0, next_follow_up: null, notes: 'Good reviews but slow site, no service area pages.' },
  { id: '4',  business_name: 'Arctic Air Conditioning',       industry: 'HVAC', city: 'Orlando',         phone: '(407) 555-0202', website: 'https://arcticair-orlando.com',                                   status: 'New', website_score: null, opportunity_score: 79, estimated_deal_value: 1500, days_since_contact: 0, next_follow_up: null, notes: 'Outdated. No quote form. Losing Maps traffic.' },
  { id: '10', business_name: 'Elite HVAC Solutions',          industry: 'HVAC', city: 'Port St. Lucie',  phone: '(772) 555-0808', email: 'info@elitehvac.com',      website: 'https://elitehvac.com',       status: 'New', website_score: null, opportunity_score: 72, estimated_deal_value: 1500, days_since_contact: 0, next_follow_up: null, notes: 'Squarespace. Missing city pages and reviews.' },
  { id: '9',  business_name: 'Comfort Zone AC',               industry: 'HVAC', city: 'Lakeland',        phone: '(863) 555-0707', website: undefined,                                                         status: 'New', website_score: null, opportunity_score: 70, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'No website. Phone-only listing.' },
  { id: '3',  business_name: 'Fort Lauderdale AC Repair',     industry: 'HVAC', city: 'Fort Lauderdale', phone: '(754) 266-3008', website: undefined,                                                         status: 'New', website_score: null, opportunity_score: 65, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Maps listing only. No site.' },
  { id: '6',  business_name: 'Breeze Masters AC',             industry: 'HVAC', city: 'Miami',           phone: '(305) 555-0404', website: undefined,                                                         status: 'New', website_score: null, opportunity_score: 60, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Facebook only. Lead with demo.' },
  { id: '8',  business_name: 'Gulf Coast HVAC',               industry: 'HVAC', city: 'Cape Coral',      phone: '(239) 555-0606', website: undefined,                                                         status: 'New', website_score: null, opportunity_score: 45, estimated_deal_value: 750,  days_since_contact: 0, next_follow_up: null, notes: 'Lower priority. Research first.' },
]

// ─── Stage groups ─────────────────────────────────────────────────────────────

const ACTIVE_STAGES: WorkflowStage[] = [
  'Research', 'Audit', 'Outreach Ready', 'Contacted', 'Follow Up', 'Meeting', 'Proposal'
]

// Stage advance map — what clicking "Move Forward" does to the CRM status
const ADVANCE_STATUS: Partial<Record<WorkflowStage, string>> = {
  'Research':       'Researching',
  'Audit':          'New',          // triggers audit page
  'Outreach Ready': 'Contacted',
  'Contacted':      'Interested',
  'Follow Up':      'Appointment Set',
  'Meeting':        'Proposal Sent',
}

const STAGE_ICON: Record<WorkflowStage, React.ElementType> = {
  'Research':       FileText,
  'Audit':          Search,
  'Outreach Ready': Phone,
  'Contacted':      Phone,
  'Follow Up':      Clock,
  'Meeting':        Calendar,
  'Proposal':       DollarSign,
  'Won':            CheckCircle2,
  'Lost':           CheckCircle2,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [leads, setLeads] = useState(LEADS)
  const [filter, setFilter] = useState<'today' | 'all'>('today')
  const [expandedStage, setExpandedStage] = useState<WorkflowStage | null>(null)

  // Advance a lead to next stage (local state only)
  function advanceLead(id: string, currentStage: WorkflowStage) {
    const nextStatus = ADVANCE_STATUS[currentStage]
    if (!nextStatus) return
    setLeads(ls => ls.map(l => l.id === id ? { ...l, status: nextStatus, days_since_contact: 0 } : l))
  }

  const grouped = useMemo(() => {
    const result: Partial<Record<WorkflowStage, WorkflowLead[]>> = {}
    for (const stage of ACTIVE_STAGES) {
      const inStage = leads.filter(l => toStage(l) === stage)
      const visible = filter === 'today' ? inStage.filter(isActionableToday) : inStage
      if (visible.length > 0) result[stage] = visible
    }
    return result
  }, [leads, filter])

  const todayCount = leads.filter(isActionableToday).length
  const totalActive = leads.filter(l => !['Won', 'Lost'].includes(l.status)).length
  const totalRevenue = leads.filter(l => !['Won', 'Lost'].includes(l.status)).reduce((s, l) => s + l.estimated_deal_value, 0)

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Lead Inbox</h2>
          <p className="text-sm text-zinc-600 mt-0.5">Every lead that needs action today, grouped by stage.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/queue" className="btn-ghost text-xs">
            <Zap className="h-3.5 w-3.5" /> Work Queue
          </Link>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="text-xs text-zinc-500">Action Today</p>
          <p className="text-2xl font-bold text-red-400 mt-0.5">{todayCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="text-xs text-zinc-500">Active Leads</p>
          <p className="text-2xl font-bold text-zinc-100 mt-0.5">{totalActive}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="text-xs text-zinc-500">Pipeline Value</p>
          <p className="text-2xl font-bold text-emerald-400 mt-0.5">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        {(['today', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium border transition',
              filter === f
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border-zinc-800')}>
            {f === 'today' ? `Action Today (${todayCount})` : `All Active (${totalActive})`}
          </button>
        ))}
      </div>

      {/* Workflow pipeline — vertical stage groups */}
      <div className="space-y-2">
        {ACTIVE_STAGES.map(stage => {
          const stageLeads = grouped[stage]
          if (!stageLeads || stageLeads.length === 0) return null

          const cfg = STAGE_CONFIG[stage]
          const Icon = STAGE_ICON[stage]
          const isExpanded = expandedStage === stage || stageLeads.length <= 3
          const shown = isExpanded ? stageLeads : stageLeads.slice(0, 2)

          return (
            <div key={stage} className={cn('rounded-xl border overflow-hidden', cfg.border)}>

              {/* Stage header */}
              <div className={cn('flex items-center gap-3 px-5 py-3.5', cfg.bg)}>
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900/60 shrink-0')}>
                  <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', cfg.color)}>{stage}</span>
                    <span className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-900', cfg.dot.replace('bg-', 'bg-'))}
                      style={{ backgroundColor: undefined }}>
                      <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold', cfg.dot, 'text-zinc-900')}>{stageLeads.length}</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">{cfg.description}</p>
                </div>
                <span className={cn('text-xs font-medium', cfg.color)}>{cfg.action}</span>
              </div>

              {/* Lead rows */}
              <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                {shown.map(lead => (
                  <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/20 transition group">

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-zinc-100">{lead.business_name}</p>
                        <span className="text-xs text-zinc-600">{lead.city}, FL</span>
                        {lead.website_score !== null && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-500 rounded px-1.5 py-0.5">Site: {lead.website_score}/100</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 truncate">{lead.notes}</p>
                    </div>

                    {/* Deal value */}
                    <span className="text-sm font-semibold text-emerald-400 shrink-0">{formatCurrency(lead.estimated_deal_value)}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 hover:text-sky-400 hover:bg-zinc-700 transition"
                          title={lead.phone}>
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}

                      {/* Stage-specific primary action */}
                      {stage === 'Audit' && (
                        <Link href="/audit"
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/30 transition">
                          <Search className="h-3 w-3" /> Audit
                        </Link>
                      )}

                      {stage === 'Outreach Ready' && (
                        <Link href={`/workspace?lead=${lead.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/30 transition">
                          <Phone className="h-3 w-3" /> Workspace
                        </Link>
                      )}

                      {(stage === 'Contacted' || stage === 'Follow Up') && (
                        <Link href={`/workspace?lead=${lead.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/30 transition">
                          <ArrowRight className="h-3 w-3" /> Workspace
                        </Link>
                      )}

                      {stage === 'Proposal' && (
                        <button
                          onClick={() => advanceLead(lead.id, stage)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/30 transition">
                          <CheckCircle2 className="h-3 w-3" /> Won
                        </button>
                      )}

                      {/* Advance stage button */}
                      {ADVANCE_STATUS[stage] && stage !== 'Audit' && stage !== 'Outreach Ready' && stage !== 'Proposal' && (
                        <button onClick={() => advanceLead(lead.id, stage)}
                          className="flex items-center gap-1.5 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition">
                          Move Forward <ChevronRight className="h-3 w-3" />
                        </button>
                      )}

                      <Link href={`/leads/${lead.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 hover:text-sky-400 hover:bg-zinc-700 transition opacity-0 group-hover:opacity-100">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Show more */}
                {!isExpanded && stageLeads.length > 2 && (
                  <button onClick={() => setExpandedStage(stage)}
                    className="w-full py-3 text-xs text-zinc-600 hover:text-zinc-400 transition text-center">
                    Show {stageLeads.length - 2} more in {stage} →
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {Object.keys(grouped).length === 0 && (
          <div className="py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No leads need action right now.</p>
            <p className="text-xs text-zinc-700 mt-1">Add more leads or switch to "All Active."</p>
          </div>
        )}
      </div>

      {/* Workflow legend */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
        <p className="text-xs font-semibold text-zinc-500 mb-3">Workflow Stages</p>
        <div className="flex items-center gap-1 flex-wrap">
          {ACTIVE_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-1">
              <span className={cn('text-xs font-medium', STAGE_CONFIG[stage].color)}>{stage}</span>
              {i < ACTIVE_STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-zinc-700" />}
            </div>
          ))}
          <ChevronRight className="h-3 w-3 text-zinc-700" />
          <span className="text-xs font-medium text-emerald-400">Won</span>
        </div>
      </div>
    </div>
  )
}
