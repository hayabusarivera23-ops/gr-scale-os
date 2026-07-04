'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, ArrowUpDown, Phone, Mail, ExternalLink, Star } from 'lucide-react'
import { cn, formatCurrency, formatDate, getStatusColor, getLeadScoreColor, isOverdue } from '@/lib/utils'
import { LEAD_STATUSES } from '@/lib/constants'
import type { Lead } from '@/lib/types'

// Day 1 leads — all status New, no outreach logged yet.
// Source: Google Maps research. Audit each before calling.
const SEED_LEADS: Lead[] = [
  { id: '1',  business_name: 'Cool Coast Heating & Cooling', phone: '(941) 623-4518', email: 'office@coolcoast.net', website: 'https://coolcoast.net',     industry: 'HVAC', city: 'Sarasota',       state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 92, estimated_deal_value: 750,  notes: 'Hibu template. Placeholder 555 phone on homepage. Expired coupons. No click-to-call. Run audit before calling.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2',  business_name: 'Aire Masters Heating & Air',   phone: '(352) 414-6556', website: 'https://airemasters.com',                                    industry: 'HVAC', city: 'Ocala',          state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 89, estimated_deal_value: 750,  notes: 'Title tag reads "Brien for County Commissioner" — SEO completely broken. Broken icons. Run audit.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3',  business_name: 'Fort Lauderdale AC Repair',    phone: '(754) 266-3008',                                                                        industry: 'HVAC', city: 'Fort Lauderdale', state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 65, estimated_deal_value: 750,  notes: 'Listed in Google Maps. Website needs research before calling.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4',  business_name: 'Arctic Air Conditioning',      phone: '(407) 555-0202', website: 'https://arcticair-orlando.com',                              industry: 'HVAC', city: 'Orlando',         state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 78, estimated_deal_value: 1500, notes: 'Outdated site. No quote form. Good Google Maps ranking but site loses the traffic. Run audit.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5',  business_name: 'Sunshine HVAC Services',       phone: '(813) 555-0303', email: 'info@sunshinehvac.com', website: 'https://sunshinehvac.com',   industry: 'HVAC', city: 'Tampa',           state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 85, estimated_deal_value: 1500, notes: 'Good reviews but site is slow and missing service area pages. Tampa market.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6',  business_name: 'Breeze Masters AC',            phone: '(305) 555-0404',                                                                        industry: 'HVAC', city: 'Miami',            state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 60, estimated_deal_value: 750,  notes: 'Facebook only — no website at all. Lead with acorlandohvac.com demo. Easiest pitch.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7',  business_name: 'Premier Climate Control',      phone: '(904) 555-0505', email: 'mike@premierclimate.com', website: 'https://premierclimate.com', industry: 'HVAC', city: 'Jacksonville',  state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 91, estimated_deal_value: 2500, notes: 'Site looks like 2012. No mobile optimization. High-value Dominate package target.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '8',  business_name: 'Gulf Coast HVAC',              phone: '(239) 555-0606',                                                                        industry: 'HVAC', city: 'Cape Coral',       state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 45, estimated_deal_value: 750,  notes: 'Lower priority. Research the site before committing a call.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '9',  business_name: 'Comfort Zone AC',              phone: '(863) 555-0707',                                                                        industry: 'HVAC', city: 'Lakeland',         state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 70, estimated_deal_value: 750,  notes: 'Phone-only Maps listing. No website. Call and lead with the free HVAC demo.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '10', business_name: 'Elite HVAC Solutions',         phone: '(772) 555-0808', email: 'info@elitehvac.com', website: 'https://elitehvac.com',         industry: 'HVAC', city: 'Port St. Lucie',  state: 'FL', status: 'New', lead_source: 'Google Maps', lead_score: 72, estimated_deal_value: 1500, notes: 'Squarespace site. Missing city pages and reviews section. Good audit candidate.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [sortField, setSortField] = useState<keyof Lead>('lead_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showAddModal, setShowAddModal] = useState(false)

  const filtered = useMemo(() => {
    return SEED_LEADS
      .filter(l => statusFilter === 'All' || l.status === statusFilter)
      .filter(l => !search || l.business_name.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const av = a[sortField] ?? ''
        const bv = b[sortField] ?? ''
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [search, statusFilter, sortField, sortDir])

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: SEED_LEADS.length }
    LEAD_STATUSES.forEach(s => { c[s] = SEED_LEADS.filter(l => l.status === s).length })
    return c
  }, [])

  function toggleSort(field: keyof Lead) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Lead CRM</h2>
          <p className="text-sm text-zinc-600 mt-0.5">{filtered.length} leads</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input className="input-base pl-8" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', ...LEAD_STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition',
                statusFilter === s ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border border-zinc-800')}>
              {s} {counts[s] !== undefined && counts[s] > 0 && <span className="ml-1 opacity-60">{counts[s]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th><button className="flex items-center gap-1 hover:text-zinc-300 transition" onClick={() => toggleSort('business_name')}>Business <ArrowUpDown className="h-3 w-3" /></button></th>
                <th>Contact</th>
                <th>City</th>
                <th>Status</th>
                <th><button className="flex items-center gap-1 hover:text-zinc-300 transition" onClick={() => toggleSort('lead_score')}>Score <ArrowUpDown className="h-3 w-3" /></button></th>
                <th><button className="flex items-center gap-1 hover:text-zinc-300 transition" onClick={() => toggleSort('estimated_deal_value')}>Value <ArrowUpDown className="h-3 w-3" /></button></th>
                <th>Next Follow Up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className="cursor-pointer">
                  <td>
                    <Link href={`/leads/${lead.id}`} className="block">
                      <p className="font-medium text-zinc-100 hover:text-sky-400 transition truncate max-w-[180px]">{lead.business_name}</p>
                      {lead.owner_name && <p className="text-xs text-zinc-600">{lead.owner_name}</p>}
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 transition" title={lead.phone}>
                          <Phone className="h-3 w-3" />
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 transition" title={lead.email}>
                          <Mail className="h-3 w-3" />
                        </a>
                      )}
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="flex h-6 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:text-sky-400 hover:bg-zinc-700 transition">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td><span className="text-xs text-zinc-400">{lead.city}, {lead.state}</span></td>
                  <td><span className={cn('badge', getStatusColor(lead.status))}>{lead.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Star className={cn('h-3.5 w-3.5', getLeadScoreColor(lead.lead_score))} />
                      <span className={cn('text-sm font-semibold', getLeadScoreColor(lead.lead_score))}>{lead.lead_score}</span>
                    </div>
                  </td>
                  <td><span className="text-sm font-medium text-zinc-300">{formatCurrency(lead.estimated_deal_value)}</span></td>
                  <td>
                    <span className={cn('text-xs', isOverdue(lead.next_follow_up) ? 'text-red-400 font-medium' : 'text-zinc-500')}>
                      {formatDate(lead.next_follow_up)}
                    </span>
                  </td>
                  <td>
                    <Link href={`/leads/${lead.id}`} className="text-xs text-zinc-600 hover:text-sky-400 transition">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-zinc-500 text-sm">No leads match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
