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
 * SEED UPDATE (2026-07-11): Replaced placeholder leads (555 numbers) with the
 * 10 REAL leads from Gr Scales/03-lead-tracker.csv. Key bumped v2 → v3 to
 * force a reseed on every device. NO FAKE DATA — leads missing details are
 * marked "verify from lead tracker" instead of getting invented numbers.
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
    todays_mission: 'Send the Top Dog Roofing text: (863) 327-3782. Outreach sent is the only number that matters today.',
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
    { id: 'meloair', business_name: 'Melo Air', industry: 'HVAC', city: 'Tampa', phone: '(813) 451-9438', email: 'meloair@gmail.com', website: 'https://meloair.net', status: 'Proposal Sent', website_score: 45, opportunity_score: 95, estimated_deal_value: 99 * 12 + 500, days_since_contact: 1, next_follow_up: new Date().toISOString().slice(0, 10), notes: 'NEW SITE LIVE on meloair.net. Waiting on Gus: approval, plan pricing, hours, photos. Deal paused by Gio — follow up when ready.', recommended_package: 'starter', proposal_status: 'Sent' },
    { id: 'topdog', business_name: 'Top Dog Roofing', industry: 'Roofing', city: 'Lakeland / Polk County', phone: '(863) 327-3782', email: 'jhosette@topdogroofing.com', website: 'https://topdogroofing.com', status: 'New', website_score: null, opportunity_score: 96, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: new Date().toISOString().slice(0, 10), notes: '#1 TARGET. VERIFIED: broken homepage images + Hearst template. 4.9★, 2 locations — great business, bad site. Text line ready. Scripts in 09-OUTREACH-QUEUE.md.', recommended_package: 'growth', proposal_status: 'None' },
    { id: 'coastalbros', business_name: 'Coastal Brothers Roofing', industry: 'Roofing', city: 'Pinellas County', phone: '(727) 931-7663', status: 'New', website_score: null, opportunity_score: 85, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Verify website + email from 03-lead-tracker.csv before outreach.', recommended_package: 'growth', proposal_status: 'None' },
    { id: 'olin', business_name: 'Olin Plumbing', industry: 'Plumbing', city: 'Tampa', phone: '(813) 443-5820', status: 'New', website_score: null, opportunity_score: 82, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Verify website + email from 03-lead-tracker.csv before outreach.', recommended_package: 'growth', proposal_status: 'None' },
    { id: 'everydayplumber', business_name: 'EverydayPlumber', industry: 'Plumbing', city: 'Tampa Bay Area', status: 'New', website_score: null, opportunity_score: 78, estimated_deal_value: 99 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull phone/email/site audit from 03-lead-tracker.csv.', proposal_status: 'None' },
    { id: 'acoma', business_name: 'Acoma', industry: 'Roofing', city: 'Tampa Bay Area', status: 'New', website_score: null, opportunity_score: 75, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull phone/email/site audit from 03-lead-tracker.csv.', proposal_status: 'None' },
    { id: 'tamparoofingco', business_name: 'Tampa Roofing Co', industry: 'Roofing', city: 'Tampa', status: 'New', website_score: null, opportunity_score: 74, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull phone/email/site audit from 03-lead-tracker.csv.', proposal_status: 'None' },
    { id: 'flroofbros', business_name: 'FL Roof Bros', industry: 'Roofing', city: 'Florida', status: 'New', website_score: null, opportunity_score: 72, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull phone/email/site audit from 03-lead-tracker.csv.', proposal_status: 'None' },
    { id: 'larson', business_name: 'Larson', industry: 'Roofing', city: 'Florida', status: 'New', website_score: null, opportunity_score: 68, estimated_deal_value: 99 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull full business name + contact from 03-lead-tracker.csv.', proposal_status: 'None' },
    { id: 'llona', business_name: 'Llona', industry: 'Roofing', city: 'Florida', status: 'New', website_score: null, opportunity_score: 66, estimated_deal_value: 99 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull full business name + contact from 03-lead-tracker.csv.', proposal_status: 'None' },
    { id: 'doan', business_name: 'Doan', industry: 'Roofing', city: 'Florida', status: 'New', website_score: null, opportunity_score: 64, estimated_deal_value: 99 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull full business name + contact from 03-lead-tracker.csv.', proposal_status: 'None' },
  ],
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const KEY = 'gr-scale-os-v3'

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
