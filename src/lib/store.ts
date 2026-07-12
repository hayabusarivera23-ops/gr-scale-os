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
 * MISSION CONTROL UPDATE (2026-07-12): Added the Command Queue (every prompt
 * Mission Control generates for Claude, with Pending → Sent → Done status),
 * the daily Scoreboard (drafted/sent/replies/meetings/clients/MRR), and
 * system-status confirmation dates. Key bumped v4 → v5.
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

export type CommandStatus = 'Pending' | 'Sent to Claude' | 'Done'

export interface OSCommand {
  id: string
  title: string           // short label, e.g. "Find 10 New Leads — roofing, Tampa"
  prompt: string          // the full self-contained prompt that was copied
  created_at: string      // ISO timestamp
  status: CommandStatus
}

/** The numbers Gio looks at daily. Edited inline on the dashboard. */
export interface OSScoreboard {
  drafted: number
  sent: number
  replies: number
  meetings: number
  clients: number
  mrr: number
}

export interface OSSettings {
  revenue_goal: number          // monthly recurring revenue goal
  todays_mission: string
  scoreboard: OSScoreboard
  /** system-status card id → ISO date Gio last confirmed it ran/worked */
  system_confirmations: Record<string, string>
}

export interface OSData {
  leads: OSLead[]
  clients: OSClient[]
  proposals: OSProposal[]
  settings: OSSettings
  commands: OSCommand[]
}

// ─── Seed data (loaded once; edits persist in localStorage) ──────────────────

const SEED: OSData = {
  settings: {
    revenue_goal: 1000,
    todays_mission: 'grscales.com + gio@grscales.com are LIVE. 6 pitch emails sit ready in Gmail drafts — send them, text Top Dog (863) 327-3782, film the site tour. Claude handles the rest.',
    scoreboard: { drafted: 0, sent: 0, replies: 0, meetings: 0, clients: 0, mrr: 0 },
    system_confirmations: {},
  },
  commands: [],
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
    { id: 'topdog', business_name: 'Top Dog Roofing', industry: 'Roofing', city: 'Lakeland / Polk County', phone: '(863) 327-3782', email: 'jhosette@topdogroofing.com', website: 'https://topdogroofing.com', status: 'New', website_score: null, opportunity_score: 96, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: new Date().toISOString().slice(0, 10), notes: '#1 TARGET. VERIFIED: broken homepage images + Hearst template. 4.9★, 2 locations. EMAIL DRAFT READY IN GMAIL + text script ready. Send today.', recommended_package: 'growth', proposal_status: 'None' },
    { id: 'coastalbros', business_name: 'Coastal Brothers Roofing', industry: 'Roofing', city: 'Odessa, FL', phone: '(727) 931-7663', email: 'drake@coastalbrothersroofing.com', website: 'https://coastalbrothersroofing.com', status: 'New', website_score: null, opportunity_score: 85, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: '3rd-gen family roofing co. EMAIL DRAFT READY IN GMAIL — site doesn\'t match reputation angle.', recommended_package: 'growth', proposal_status: 'None' },
    { id: 'olin', business_name: 'Olin Plumbing', industry: 'Plumbing', city: 'Tampa', phone: '(813) 443-5820', email: 'Info@OlinPlumbingInc.com', website: 'https://www.plumberstampa.com', status: 'New', website_score: null, opportunity_score: 82, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Decades in business, strong Yelp. Dated site. EMAIL DRAFT READY IN GMAIL.', recommended_package: 'growth', proposal_status: 'None' },
    { id: 'everydayplumber', business_name: 'EverydayPlumber', industry: 'Plumbing', city: 'Tampa', phone: '(813) 872-0200', email: 'info@everydayplumber.com', website: 'https://everydayplumber.com', status: 'New', website_score: null, opportunity_score: 78, estimated_deal_value: 99 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Solid reviews. Mobile conversion angle. EMAIL DRAFT READY IN GMAIL.', proposal_status: 'None' },
    { id: 'acoma', business_name: 'Acoma Roofing', industry: 'Roofing', city: 'Oldsmar, FL', phone: '(727) 733-5580', email: 'service@AcomaRoofing.com', website: 'https://www.acomaroofing.com', status: 'New', website_score: null, opportunity_score: 75, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Established name, dated site. EMAIL DRAFT READY IN GMAIL.', proposal_status: 'None' },
    { id: 'tamparoofingco', business_name: 'Tampa Roofing Co', industry: 'Roofing', city: 'Tampa', phone: '(813) 238-6436', website: 'https://tamparoofing.com', status: 'New', website_score: null, opportunity_score: 74, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'PHONE LEAD (no public email). Hook: nav typo "Commerical" + (c)2019 footer. Call script ready.', proposal_status: 'None' },
    { id: 'flroofbros', business_name: 'Florida Roof Bros', industry: 'Roofing', city: 'Palm Bay + Clearwater', phone: '(321) 446-1702', email: 'Info@floridaroofbros.com', website: 'https://floridaroofbros.com', status: 'New', website_score: null, opportunity_score: 72, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Owens Corning Platinum, 2 locations. Local landing pages angle. EMAIL DRAFT READY IN GMAIL.', proposal_status: 'None' },
    { id: 'larson', business_name: 'Larson', industry: 'Roofing', city: 'Florida', status: 'New', website_score: null, opportunity_score: 68, estimated_deal_value: 99 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull full business name + contact from 03-lead-tracker.csv.', proposal_status: 'None' },
    { id: 'llona', business_name: 'Llona', industry: 'Roofing', city: 'Florida', status: 'New', website_score: null, opportunity_score: 66, estimated_deal_value: 99 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull full business name + contact from 03-lead-tracker.csv.', proposal_status: 'None' },
    { id: 'doan', business_name: 'Doan', industry: 'Roofing', city: 'Florida', status: 'New', website_score: null, opportunity_score: 64, estimated_deal_value: 99 * 12 + 500, days_since_contact: 0, next_follow_up: null, notes: 'Real lead from tracker. Pull full business name + contact from 03-lead-tracker.csv.', proposal_status: 'None' },
  ],
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const KEY = 'gr-scale-os-v5'

function load(): OSData {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return SEED
    const parsed = JSON.parse(raw) as Partial<OSData>
    // basic shape guard
    if (!parsed.leads || !parsed.settings) return SEED
    // deep-merge settings so fields added in later releases get defaults
    return {
      ...SEED,
      ...parsed,
      commands: parsed.commands ?? [],
      settings: {
        ...SEED.settings,
        ...parsed.settings,
        scoreboard: { ...SEED.settings.scoreboard, ...(parsed.settings.scoreboard ?? {}) },
        system_confirmations: { ...SEED.settings.system_confirmations, ...(parsed.settings.system_confirmations ?? {}) },
      },
    } as OSData
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

  // Mission Control: Command Queue
  const addCommand = useCallback((title: string, prompt: string) => {
    const cmd: OSCommand = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title, prompt,
      created_at: new Date().toISOString(),
      status: 'Pending',
    }
    update(d => ({ ...d, commands: [cmd, ...d.commands] }))
  }, [update])

  const setCommandStatus = useCallback((id: string, status: CommandStatus) => {
    update(d => ({ ...d, commands: d.commands.map(c => c.id === id ? { ...c, status } : c) }))
  }, [update])

  const deleteCommand = useCallback((id: string) => {
    update(d => ({ ...d, commands: d.commands.filter(c => c.id !== id) }))
  }, [update])

  // Mission Control: Scoreboard
  const setScoreboard = useCallback((s: Partial<OSScoreboard>) => {
    update(d => ({ ...d, settings: { ...d.settings, scoreboard: { ...d.settings.scoreboard, ...s } } }))
  }, [update])

  // Mission Control: System status "last confirmed" dates
  const confirmSystem = useCallback((systemId: string, isoDate: string) => {
    update(d => ({
      ...d,
      settings: { ...d.settings, system_confirmations: { ...d.settings.system_confirmations, [systemId]: isoDate } },
    }))
  }, [update])

  return {
    data, ready, update, updateLead, addProposal, convertToClient, setSettings,
    addCommand, setCommandStatus, deleteCommand, setScoreboard, confirmSystem,
    metrics: computeMetrics(data),
  }
}
