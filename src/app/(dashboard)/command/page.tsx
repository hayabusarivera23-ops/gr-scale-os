'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Phone, ExternalLink, Zap, Globe, ChevronRight, Search, ArrowUpDown, Copy, TrendingUp, X } from 'lucide-react'
import { cn, formatCurrency, getStatusColor } from '@/lib/utils'
import { matchLead, type WorkflowLead } from '@/lib/workflow'

// ─── Demo map — now powered by matchLead() in workflow.ts ────────────────────
// Kept as fallback display helper for the table. matchLead() is the source of truth.

// ─── Suggested action engine ──────────────────────────────────────────────────

type ActionTier = 'critical' | 'high' | 'medium' | 'low'

function getSuggestedAction(lead: CommandLead): { action: string; tier: ActionTier } {
  if (lead.status === 'Won')              return { action: 'Start project',                      tier: 'high'     }
  if (lead.status === 'Lost')             return { action: 'Circle back in 90 days',              tier: 'low'      }
  if (lead.status === 'Proposal Sent')    return { action: 'Chase proposal — text or call today', tier: 'critical' }
  if (lead.status === 'Appointment Set')  return { action: 'Prep pitch, have Stripe ready',       tier: 'high'     }
  if (lead.status === 'Interested')       return { action: 'Book close call NOW',                 tier: 'critical' }
  if (lead.status === 'Contacted')        return { action: 'Follow up today',                     tier: 'high'     }
  if (lead.website_score === null)        return { action: 'Run audit → then call',               tier: 'high'     }
  return { action: 'Call — audit complete',  tier: 'high' }
}

// ─── Priority score ───────────────────────────────────────────────────────────
// Combines lead quality (research) + deal value + status urgency

function priorityScore(lead: CommandLead): number {
  let score = lead.lead_score                                          // base: 0-100
  if (lead.estimated_deal_value >= 2000) score += 8
  else if (lead.estimated_deal_value >= 1500) score += 4
  if (lead.status === 'Interested' || lead.status === 'Appointment Set') score += 15
  if (lead.status === 'Proposal Sent')  score += 10
  if (lead.status === 'Contacted')      score += 5
  if (lead.status === 'Lost')           score -= 50
  return Math.min(100, Math.max(0, score))
}

// ─── Lead data ────────────────────────────────────────────────────────────────

interface CommandLead {
  id: string
  business_name: string
  industry: string
  city: string
  phone?: string
  email?: string
  website?: string
  status: string
  lead_score: number
  estimated_deal_value: number
  website_score: number | null
  opportunity_score: number | null
  notes: string
}

const RAW_LEADS: CommandLead[] = [
  { id: '1',  business_name: 'Cool Coast Heating & Cooling', industry: 'HVAC', city: 'Sarasota',       phone: '(941) 623-4518', email: 'office@coolcoast.net', website: 'https://coolcoast.net',       status: 'New', lead_score: 92, estimated_deal_value: 750,  website_score: null, opportunity_score: null, notes: 'Hibu template. 555 placeholder phone. Expired coupons.' },
  { id: '2',  business_name: 'Aire Masters Heating & Air',   industry: 'HVAC', city: 'Ocala',           phone: '(352) 414-6556', website: 'https://airemasters.com',                                    status: 'New', lead_score: 89, estimated_deal_value: 750,  website_score: null, opportunity_score: null, notes: 'Title tag: "Brien for County Commissioner." SEO disaster.' },
  { id: '7',  business_name: 'Premier Climate Control',      industry: 'HVAC', city: 'Jacksonville',    phone: '(904) 555-0505', email: 'mike@premierclimate.com', website: 'https://premierclimate.com', status: 'New', lead_score: 91, estimated_deal_value: 2500, website_score: null, opportunity_score: null, notes: 'Site looks 2012. No mobile. High-value Dominate target.' },
  { id: '5',  business_name: 'Sunshine HVAC Services',       industry: 'HVAC', city: 'Tampa',           phone: '(813) 555-0303', email: 'info@sunshinehvac.com', website: 'https://sunshinehvac.com',   status: 'New', lead_score: 85, estimated_deal_value: 1500, website_score: null, opportunity_score: null, notes: 'Good reviews but slow site, no service area pages.' },
  { id: '4',  business_name: 'Arctic Air Conditioning',      industry: 'HVAC', city: 'Orlando',         phone: '(407) 555-0202', website: 'https://arcticair-orlando.com',                              status: 'New', lead_score: 78, estimated_deal_value: 1500, website_score: null, opportunity_score: null, notes: 'Outdated. No quote form. Ranked in Maps but losing traffic.' },
  { id: '10', business_name: 'Elite HVAC Solutions',         industry: 'HVAC', city: 'Port St. Lucie',  phone: '(772) 555-0808', email: 'info@elitehvac.com', website: 'https://elitehvac.com',         status: 'New', lead_score: 72, estimated_deal_value: 1500, website_score: null, opportunity_score: null, notes: 'Squarespace. Missing city pages and reviews.' },
  { id: '9',  business_name: 'Comfort Zone AC',              industry: 'HVAC', city: 'Lakeland',        phone: '(863) 555-0707', website: undefined,                                                    status: 'New', lead_score: 70, estimated_deal_value: 750,  website_score: null, opportunity_score: null, notes: 'No website at all. Phone-only listing.' },
  { id: '3',  business_name: 'Fort Lauderdale AC Repair',    industry: 'HVAC', city: 'Fort Lauderdale', phone: '(754) 266-3008', website: undefined,                                                    status: 'New', lead_score: 65, estimated_deal_value: 750,  website_score: null, opportunity_score: null, notes: 'Listed in Maps. Needs research.' },
  { id: '6',  business_name: 'Breeze Masters AC',            industry: 'HVAC', city: 'Miami',           phone: '(305) 555-0404', website: undefined,                                                    status: 'New', lead_score: 60, estimated_deal_value: 750,  website_score: null, opportunity_score: null, notes: 'Facebook only — no website. Lead with demo.' },
  { id: '8',  business_name: 'Gulf Coast HVAC',              industry: 'HVAC', city: 'Cape Coral',      phone: '(239) 555-0606', website: undefined,                                                    status: 'New', lead_score: 45, estimated_deal_value: 750,  website_score: null, opportunity_score: null, notes: 'Lower priority. Research first.' },
]

// ─── Color helpers ────────────────────────────────────────────────────────────

function scoreColor(s: number | null) {
  if (s === null) return 'text-zinc-600'
  if (s >= 70) return 'text-emerald-400'
  if (s >= 40) return 'text-amber-400'
  return 'text-red-400'
}

const ACTION_TIER_STYLES: Record<ActionTier, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high:     'text-amber-400 bg-amber-500/10 border-amber-500/30',
  medium:   'text-sky-400 bg-sky-500/10 border-sky-500/30',
  low:      'text-zinc-500 bg-zinc-800 border-zinc-700',
}

// ─── Sort keys ────────────────────────────────────────────────────────────────

type SortKey = 'priority' | 'lead_score' | 'deal_value' | 'website_score'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommandPage() {
  const [search, setSearch]           = useState('')
  const [sortKey, setSortKey]         = useState<SortKey>('priority')
  const [copied, setCopied]           = useState<string | null>(null)
  const [salesPack, setSalesPack]     = useState<string | null>(null)  // id of lead whose sales pack is open

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const enrichedLeads = useMemo(() =>
    RAW_LEADS.map(l => {
      const wl: WorkflowLead = {
        ...l,
        opportunity_score: l.opportunity_score ?? 0,
        days_since_contact: 0,
        next_follow_up: null,
      }
      const match = matchLead(wl)
      return {
        ...l,
        priority: priorityScore(l),
        ...getSuggestedAction(l),
        match,
      }
    })
  , [])

  const filtered = useMemo(() => {
    let list = enrichedLeads
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(l => l.business_name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.industry.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'priority':      return b.priority - a.priority
        case 'lead_score':    return b.lead_score - a.lead_score
        case 'deal_value':    return b.estimated_deal_value - a.estimated_deal_value
        case 'website_score': return (b.website_score ?? -1) - (a.website_score ?? -1)
        default:              return 0
      }
    })
  }, [enrichedLeads, search, sortKey])

  // Summary stats
  const totalRevenue = enrichedLeads.reduce((s, l) => s + l.estimated_deal_value, 0)
  const toAudit = enrichedLeads.filter(l => l.website_score === null && l.status === 'New').length
  const toCall  = enrichedLeads.filter(l => l.status === 'New' && l.website_score !== null).length

  return (
    <div className="space-y-5 max-w-full">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Lead Command Center</h2>
          <p className="text-sm text-zinc-600 mt-0.5">Every lead ranked. Every next action decided. No guessing.</p>
        </div>
      </div>

      {/* Mission bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: enrichedLeads.length, color: 'text-zinc-100' },
          { label: 'Needs Audit', value: toAudit, color: 'text-amber-400' },
          { label: 'Ready to Call', value: toCall, color: 'text-sky-400' },
          { label: 'Pipeline Value', value: formatCurrency(totalRevenue), color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={cn('text-xl font-bold mt-0.5', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input className="input-base pl-8 text-sm" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-600">Sort:</span>
          {([
            ['priority',      'Priority'],
            ['lead_score',    'Lead Score'],
            ['deal_value',    'Deal Value'],
            ['website_score', 'Website Score'],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSortKey(key)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1',
                sortKey === key ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border border-zinc-800')}>
              <ArrowUpDown className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Command table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500 w-8">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">Business</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">Contact</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">Priority</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">Website</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">Package / Price</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">Demo</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">Next Action</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((lead, idx) => (
                <React.Fragment key={lead.id}>
                <tr className="hover:bg-zinc-800/20 transition group">
                  {/* Rank */}
                  <td className="px-4 py-4">
                    <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx <= 2 ? 'bg-sky-500/10 text-sky-400' : 'bg-zinc-800 text-zinc-500')}>
                      {idx + 1}
                    </div>
                  </td>

                  {/* Business */}
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-zinc-100 leading-tight">{lead.business_name}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{lead.city}, FL · {lead.industry}</p>
                      {lead.notes && <p className="text-[10px] text-zinc-700 mt-1 max-w-[200px] truncate">{lead.notes}</p>}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-sky-400 transition">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </a>
                        </div>
                      )}
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-sky-400 transition">
                          <ExternalLink className="h-3 w-3" />
                          <span className="max-w-[130px] truncate">{lead.website.replace('https://', '')}</span>
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Priority score */}
                  <td className="px-4 py-4 text-center">
                    <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm',
                      lead.priority >= 90 ? 'bg-amber-500/20 text-amber-400' :
                      lead.priority >= 75 ? 'bg-sky-500/20 text-sky-400' :
                      'bg-zinc-800 text-zinc-400')}>
                      {lead.priority}
                    </div>
                  </td>

                  {/* Website score */}
                  <td className="px-4 py-4 text-center">
                    {lead.website_score !== null ? (
                      <span className={cn('text-sm font-bold', scoreColor(lead.website_score))}>{lead.website_score}</span>
                    ) : (
                      <Link href="/audit" className="text-[10px] text-amber-400 hover:underline whitespace-nowrap">
                        Run audit →
                      </Link>
                    )}
                  </td>

                  {/* Package / Price (from matchLead) */}
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{lead.match.package}</p>
                      <p className="text-[11px] text-emerald-400 font-bold">{lead.match.price}</p>
                    </div>
                  </td>

                  {/* Recommended demo (from matchLead) */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <a href={lead.match.demoUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-emerald-400 hover:underline leading-tight block max-w-[120px] truncate">
                          {lead.match.demoLabel}
                        </a>
                        <button onClick={() => copy(lead.match.demoUrl, `demo-${lead.id}`)}
                          className={cn('text-[10px] flex items-center gap-0.5 mt-0.5 hover:text-sky-400 transition', copied === `demo-${lead.id}` ? 'text-emerald-400' : 'text-zinc-700')}>
                          <Copy className="h-2.5 w-2.5" />
                          {copied === `demo-${lead.id}` ? 'Copied!' : 'Copy URL'}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Next action */}
                  <td className="px-4 py-4">
                    <span className={cn('inline-flex items-center rounded border px-2 py-1 text-xs font-medium', ACTION_TIER_STYLES[lead.tier])}>
                      {lead.action}
                    </span>
                  </td>

                  {/* Deal value */}
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-semibold text-zinc-200">{formatCurrency(lead.estimated_deal_value)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 transition" title={`Call ${lead.phone}`}>
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setSalesPack(salesPack === lead.id ? null : lead.id)}
                        className={cn('flex h-7 w-7 items-center justify-center rounded-lg border transition', salesPack === lead.id ? 'bg-sky-500/20 border-sky-500/30 text-sky-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-sky-400')}
                        title="Sales Pack">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </button>
                      <Link href={`/leads/${lead.id}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 transition" title="View lead">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>

                {/* Sales Pack expansion row */}
                {salesPack === lead.id && (
                  <tr key={`match-${lead.id}`} className="bg-sky-500/5 border-b border-sky-500/10">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Sales Pack — {lead.business_name}</p>
                        <button onClick={() => setSalesPack(null)} className="text-zinc-600 hover:text-zinc-400">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5">
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Recommended Demo</p>
                          <a href={lead.match.demoUrl} target="_blank" rel="noreferrer"
                            className="text-xs font-semibold text-emerald-400 hover:underline leading-tight">{lead.match.demoLabel}</a>
                        </div>
                        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5">
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Lead With This Offer</p>
                          <p className="text-xs font-semibold text-amber-400">{lead.match.offer}</p>
                        </div>
                        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5">
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Package · Price</p>
                          <p className="text-xs font-semibold text-zinc-200">{lead.match.package} <span className="text-emerald-400">{lead.match.price}</span></p>
                        </div>
                        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5 col-span-2 md:col-span-1">
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Act Now Because</p>
                          <p className="text-xs text-amber-300">{lead.match.urgencyDriver}</p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-lg bg-zinc-900/80 border border-zinc-800 px-4 py-3">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Sales Angle — use this on the call</p>
                        <p className="text-sm text-zinc-300 leading-relaxed">&ldquo;{lead.match.salesAngle}&rdquo;</p>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap pb-4">
        <p className="text-xs text-zinc-600">Priority score = lead quality + deal size + pipeline stage.</p>
        {[
          { color: 'bg-amber-500/20 text-amber-400', label: '90+ = Top tier' },
          { color: 'bg-sky-500/10 text-sky-400',     label: '75-89 = High value' },
          { color: 'bg-zinc-800 text-zinc-400',       label: 'Under 75 = Standard' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold', color)}>•</div>
            <span className="text-xs text-zinc-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
