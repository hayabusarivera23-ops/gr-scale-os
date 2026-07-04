'use client'

/**
 * GR Scale OS — Persistent Data Store
 *
 * ARCHITECTURAL DECISION (2026-07-02):
 * The OS previously kept seed data hardcoded inside each page — nothing
 * persisted and every page had its own copy of the leads. This store is now
 * the single source of truth, persisted to localStorage so data survives
 * refreshes and deploys with ZERO backend setup.
 *
 * Migration path: when Supabase env vars are added, swap the load/save
 * functions here for Supabase queries. No page code changes.
 */

import { useCallback, useEffect, useState } from 'react'
import type { WorkflowLead } from './workflow'
import type { PackageId } from './packages'
import { PACKAGES } from './packages'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OSLead extends WorkflowLead {
  recommended_package?: PackageId
  proposal_status?: 'None' | 'Draft' | 'Sent' | 'Accepted' | 'Declined'
}

export interface OSClient {
  id: string
  business_name: string
  owner_name?: string
  package: PackageId
  mrr: number
  setup_fee_paid?: number
  started_at: string
  status: 'Active' | 'Paused' | 'Churned'
  site_url?: string
  notes?: string
}

export interface OSProposal {
  id: string
  lead_id: string
  business_name: string
  package: PackageId
  monthly: number
  setup_fee: number
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined'
  created_at: string
  body: string
}

export interface OSSettings {
  revenue_goal: number          // monthly recurring revenue goal
  todays_mission: string
}

export interface OSData {
  leads: OSLead[]
  clients: OSClient[]
  proposals: OSProposal[]
  settings: OSSettings
}

// ─── Seed data (loaded once; edits persist in localStorage) ──────────────────

const SEED: OSData = {
  settings: {
    revenue_goal: 1000,
    todays_mission: 'Close Melo Air onto the Starter plan. Everything else is second.',
  },
  clients: [],
  proposals: [
    {
      id: 'p-meloair',
      lead_id: 'meloair',
      business_name: 'Melo Air',
      package: 'starter',
      monthly: 99,
      setup_fee: 500,
      status: 'Sent',
      created_at: new Date().toISOString(),
      body: '',
    },
  ],
  leads: [
    { id: 'meloair', business_name: 'Melo Air', industry: 'HVAC', city: 'Tampa', phone: '(813) 451-9438', email: 'meloair@gmail.com', website: 'https://meloair.net', status: 'Proposal Sent', website_score: 45, opportunity_score: 95, estimated_deal_value: 99 * 12 + 500, days_since_contact: 1, next_follow_up: new Date().toISOString().slice(0, 10), notes: 'NEW SITE BUILT & LIVE: meloair-v2.vercel.app. Waiting on Gus: approval, plan pricing, hours, photos. CLOSE THIS.', recommended_package: 'starter', proposal_status: 'Sent' },
    { id: '7', business_name: 'Premier Climate Control', industry: 'HVAC', city: 'Jacksonville', phone: '(904) 555-0505', email: 'mike@premierclimate.com', website: 'https://premierclimate.com', status: 'New', website_score: null, opportunity_score: 91, estimated_deal_value: 599 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Site looks 2012. No mobile. High-value Scale target.', recommended_package: 'scale', proposal_status: 'None' },
    { id: '1', business_name: 'Cool Coast Heating & Cooling', industry: 'HVAC', city: 'Sarasota', phone: '(941) 623-4518', email: 'office@coolcoast.net', website: 'https://coolcoast.net', status: 'New', website_score: null, opportunity_score: 88, estimated_deal_value: 99 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Hibu template. 555 placeholder phone. Expired coupons.', proposal_status: 'None' },
    { id: '2', business_name: 'Aire Masters Heating & Air', industry: 'HVAC', city: 'Ocala', phone: '(352) 414-6556', website: 'https://airemasters.com', status: 'New', website_score: null, opportunity_score: 89, estimated_deal_value: 299 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Title tag: "Brien for County Commissioner." SEO disaster.', proposal_status: 'None' },
    { id: '5', business_name: 'Sunshine HVAC Services', industry: 'HVAC', city: 'Tampa', phone: '(813) 555-0303', email: 'info@sunshinehvac.com', website: 'https://sunshinehvac.com', status: 'New', website_score: null, opportunity_score: 82, estimated_deal_value: 299 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Good reviews but slow site, no service area pages.', proposal_status: 'None' },
    { id: '4', business_name: 'Arctic Air Conditioning', industry: 'HVAC', city: 'Orlando', phone: '(407) 555-0202', website: 'https://arcticair-orlando.com', status: 'New', website_score: null, opportunity_score: 79, estimated_deal_value: 299 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Outdated. No quote form. Losing Maps traffic.', proposal_status: 'None' },
    { id: '10', business_name: 'Elite HVAC Solutions', industry: 'HVAC', city: 'Port St. Lucie', phone: '(772) 555-0808', email: 'info@elitehvac.com', website: 'https://elitehvac.com', status: 'New', website_score: null, opportunity_score: 72, estimated_deal_value: 299 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Squarespace. Missing city pages and reviews.', proposal_status: 'None' },
    { id: '9', business_name: 'Comfort Zone AC', industry: 'HVAC', city: 'Lakeland', phone: '(863) 555-0707', status: 'New', website_score: null, opportunity_score: 70, estimated_deal_value: 99 * 12, days_since_contact: 0, next_follow_up: null, notes: 'No website. Phone-only listing.', proposal_status: 'None' },
    { id: '3', business_name: 'Fort Lauderdale AC Repair', industry: 'HVAC', city: 'Fort Lauderdale', phone: '(754) 266-3008', status: 'New', website_score: null, opportunity_score: 65, estimated_deal_value: 99 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Maps listing only. No site.', proposal_status: 'None' },
    { id: '6', business_name: 'Breeze Masters AC', industry: 'HVAC', city: 'Miami', phone: '(305) 555-0404', status: 'New', website_score: null, opportunity_score: 60, estimated_deal_value: 99 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Facebook only. Lead with demo.', proposal_status: 'None' },
    { id: '8', business_name: 'Gulf Coast HVAC', industry: 'HVAC', city: 'Cape Coral', phone: '(239) 555-0606', status: 'New', website_score: null, opportunity_score: 45, estimated_deal_value: 99 * 12, days_since_contact: 0, next_follow_up: null, notes: 'Lower priority.', proposal_status: 'None' },
  ],
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const KEY = 'gr-scale-os-v2'

function load(): OSData {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return SEED
    const parsed = JSON.parse(raw) as OSData
    // basic shape guard
    if (!parsed.leads || !parsed.settings) return SEED
    return parsed
  } catch {
    return SEED
  }
}

function persist(data: OSData) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* full/blocked */ }
}

// ─── Derived metrics (Phase 1 + Phase 6) ─────────────────────────────────────

export interface OSMetrics {
  revenueGoal: number
  mrr: number
  mrrProgressPct: number
  newLeads: number
  followUpsDue: number
  proposalsWaiting: number
  activeClients: number
  pipelineValue: number
}

export function computeMetrics(data: OSData): OSMetrics {
  const today = new Date().toISOString().slice(0, 10)
  const active = data.clients.filter(c => c.status === 'Active')
  const mrr = active.reduce((s, c) => s + c.mrr, 0)
  const activeLeads = data.leads.filter(l => !['Won', 'Lost'].includes(l.status))
  return {
    revenueGoal: data.settings.revenue_goal,
    mrr,
    mrrProgressPct: data.settings.revenue_goal > 0 ? Math.min(100, Math.round((mrr / data.settings.revenue_goal) * 100)) : 0,
    newLeads: data.leads.filter(l => l.status === 'New').length,
    followUpsDue: activeLeads.filter(l =>
      (l.next_follow_up && l.next_follow_up <= today) ||
      (['Contacted', 'Interested'].includes(l.status) && l.days_since_contact >= 3)
    ).length,
    proposalsWaiting: data.proposals.filter(p => p.status === 'Sent').length,
    activeClients: active.length,
    pipelineValue: activeLeads.reduce((s, l) => s + l.estimated_deal_value, 0),
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOS() {
  const [data, setData] = useState<OSData>(SEED)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setData(load())
    setReady(true)
  }, [])

  const update = useCallback((fn: (d: OSData) => OSData) => {
    setData(prev => {
      const next = fn(prev)
      persist(next)
      return next
    })
  }, [])

  const addProposal = useCallback((p: OSProposal) => {
    update(d => ({
      ...d,
      proposals: [p, ...d.proposals],
      leads: d.leads.map(l => l.id === p.lead_id ? { ...l, proposal_status: p.status, status: p.status === 'Sent' ? 'Proposal Sent' : l.status } : l),
    }))
  }, [update])

  const updateLead = useCallback((id: string, updates: Partial<OSLead>) => {
    update(d => ({ ...d, leads: d.leads.map(l => l.id === id ? { ...l, ...updates } : l) }))
  }, [update])

  // Phase 5: lead → client conversion creates the client + delivery scaffolding
  const convertToClient = useCallback((leadId: string, packageId: PackageId, setupFee: number) => {
    update(d => {
      const lead = d.leads.find(l => l.id === leadId)
      if (!lead) return d
      const client: OSClient = {
        id: `c-${leadId}`,
        business_name: lead.business_name,
        package: packageId,
        mrr: PACKAGES[packageId].monthly,
        setup_fee_paid: setupFee,
        started_at: new Date().toISOString(),
        status: 'Active',
        site_url: lead.website,
        notes: `Converted from lead. ${lead.notes ?? ''}`,
      }
      return {
        ...d,
        clients: [client, ...d.clients],
        leads: d.leads.map(l => l.id === leadId ? { ...l, status: 'Won', proposal_status: 'Accepted' as const } : l),
        proposals: d.proposals.map(p => p.lead_id === leadId ? { ...p, status: 'Accepted' as const } : p),
      }
    })
  }, [update])

  const setSettings = useCallback((s: Partial<OSSettings>) => {
    update(d => ({ ...d, settings: { ...d.settings, ...s } }))
  }, [update])

  return {
    data, ready, update, updateLead, addProposal, convertToClient, setSettings,
    metrics: computeMetrics(data),
  }
}
