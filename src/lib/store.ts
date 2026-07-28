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

import { useCallback, useEffect, useRef, useState } from 'react'
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

export type CommandStatus = 'Pending' | 'Sent to AI' | 'Done'

export interface OSCommand {
  id: string
  title: string           // short label, e.g. "Find 10 New Leads — roofing, Tampa"
  prompt: string          // the full self-contained prompt that was copied
  created_at: string      // ISO timestamp
  status: CommandStatus
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed'

export interface OSTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: 'High' | 'Medium' | 'Low'
  due_date: string
  created_at: string
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
  tasks: OSTask[]
}

export type CloudSyncStatus = 'checking' | 'connected' | 'local' | 'error'

// ─── Seed data (loaded once; edits persist in localStorage) ──────────────────

const TODAY_ISO = new Date().toISOString().split('T')[0]
const TOMORROW_ISO = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const SETUP_TASKS: OSTask[] = [
  { id: 'zoho-test', title: 'Confirm Zoho Mail sends and receives', description: 'Send a test from gio@grscales.com to your personal email, then reply back and confirm it lands in Zoho.', status: 'Pending', priority: 'High', due_date: TODAY_ISO, created_at: new Date().toISOString() },
  { id: 'business-number', title: 'Choose the final business number path', description: 'Either unlock Google Voice verification or use a business phone app. Final number must work from phone, laptop, and computer.', status: 'Pending', priority: 'High', due_date: TODAY_ISO, created_at: new Date().toISOString() },
  { id: 'github-token', title: 'Add GITHUB_TOKEN to Vercel', description: 'Generate the token in GitHub, limit it to gr-scale-os with Contents read/write, and paste it directly into Vercel. Never paste it into chat.', status: 'Pending', priority: 'High', due_date: TODAY_ISO, created_at: new Date().toISOString() },
  { id: 'stripe-links', title: 'Create Stripe payment links', description: 'Create links for $500 one-time build, $99/mo Starter, and $299/mo Growth. Keep Alex/guardian involved as account rep.', status: 'Pending', priority: 'High', due_date: TODAY_ISO, created_at: new Date().toISOString() },
  { id: 'gbp-verify', title: 'Complete Google Business Profile video verification', description: 'Open Google Business Profile and complete the short verification so GR Scale can become visible on Google.', status: 'Pending', priority: 'High', due_date: TODAY_ISO, created_at: new Date().toISOString() },
  { id: 'calendly-name', title: 'Fix Calendly display name', description: 'Make the booking event show Gio Rivera - GR Scale and confirm the Free Website Audit 20-minute link works.', status: 'Pending', priority: 'Medium', due_date: TODAY_ISO, created_at: new Date().toISOString() },
  { id: 'formspree', title: 'Create Formspree lead form', description: 'Create a GR Scale form and add its ID to Vercel for gr-scale-website as NEXT_PUBLIC_FORMSPREE_ID.', status: 'Pending', priority: 'Medium', due_date: TOMORROW_ISO, created_at: new Date().toISOString() },
  { id: 'association-outreach', title: 'Send Association Barber Shop outreach', description: 'Use the dead-domain hook and offer a free 2-minute video audit. Log the send in the dashboard.', status: 'Pending', priority: 'High', due_date: TODAY_ISO, created_at: new Date().toISOString() },
  { id: 'vip-outreach', title: 'Send VIP Barbershop Tampa outreach', description: 'Use the mobile booking/call-button hook. Log the send and set the follow-up date.', status: 'Pending', priority: 'High', due_date: TODAY_ISO, created_at: new Date().toISOString() },
  { id: 'device-bookmarks', title: 'Add GR Scale HQ bookmarks on all devices', description: 'Bookmark dashboard, Zoho, Cloudflare, Vercel, GitHub, Stripe, Calendly, Claude, and ChatGPT on computer, laptop, and phone.', status: 'Pending', priority: 'Medium', due_date: TOMORROW_ISO, created_at: new Date().toISOString() },
]

const SEED: OSData = {
  settings: {
    revenue_goal: 1000,
    todays_mission: 'Finish business setup, send today\'s best barber outreach, log every send/reply/meeting, and keep GR Scale controlled from this dashboard.',
    scoreboard: { drafted: 0, sent: 0, replies: 0, meetings: 0, clients: 0, mrr: 0 },
    system_confirmations: {},
  },
  commands: [],
  tasks: SETUP_TASKS,
  clients: [],
  proposals: [],
  leads: [
    { id: 'topdog', business_name: 'Top Dog Roofing', industry: 'Roofing', city: 'Lakeland / Polk County', phone: '(863) 327-3782', email: 'jhosette@topdogroofing.com', website: 'https://topdogroofing.com', status: 'New', website_score: null, opportunity_score: 96, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: new Date().toISOString().slice(0, 10), notes: '#1 TARGET. VERIFIED: broken homepage images + Hearst template. 4.9★, 2 locations. Draft outreach ready for Zoho/email + text script ready. Send today.', recommended_package: 'growth', proposal_status: 'None' },
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

const KEY = 'gr-scale-os-v7'

const CURRENT_PRIORITY_LEADS: OSLead[] = [
  { id: 'association-barber', business_name: 'Association Barber Shop', industry: 'Barber', city: 'Lakeland', phone: '', website: 'https://associationbarbershop.com', status: 'New', website_score: null, opportunity_score: 98, estimated_deal_value: 299 * 12 + 750, days_since_contact: 0, next_follow_up: new Date().toISOString().slice(0, 10), notes: '#1 TARGET. Dead domain/website issue. Strong reviews. Use lexthebarber.com as proof. Send free 2-minute video audit offer today.', recommended_package: 'growth', proposal_status: 'None' },
  { id: 'vip-barbershop-tampa', business_name: 'VIP Barbershop Tampa', industry: 'Barber', city: 'Tampa', phone: '', website: '', status: 'New', website_score: null, opportunity_score: 94, estimated_deal_value: 299 * 12 + 750, days_since_contact: 0, next_follow_up: new Date().toISOString().slice(0, 10), notes: '#2 TARGET. Booking buttons need cleanup. Local Tampa barber lead. Pitch mobile booking and fast call buttons.', recommended_package: 'growth', proposal_status: 'None' },
  { id: 'topdog', business_name: 'Top Dog Roofing', industry: 'Roofing', city: 'Lakeland / Polk County', phone: '(863) 327-3782', email: 'jhosette@topdogroofing.com', website: 'https://topdogroofing.com', status: 'New', website_score: null, opportunity_score: 88, estimated_deal_value: 299 * 12 + 500, days_since_contact: 0, next_follow_up: new Date().toISOString().slice(0, 10), notes: 'Roofing target. Reported broken homepage images + template issues. Keep as next non-barber target after barber outreach.', recommended_package: 'growth', proposal_status: 'None' },
]

function normalizeData(data: Partial<OSData> | OSData): OSData {
  const incomingLeads = data.leads ?? SEED.leads
  const cleanedLeads = incomingLeads.filter(lead =>
    lead.id !== 'meloair' &&
    !CURRENT_PRIORITY_LEADS.some(priority => priority.id === lead.id)
  )

  return {
    ...SEED,
    ...data,
    proposals: (data.proposals ?? SEED.proposals).filter(proposal => proposal.lead_id !== 'meloair'),
    leads: [...CURRENT_PRIORITY_LEADS, ...cleanedLeads],
    clients: data.clients ?? SEED.clients,
    tasks: data.tasks ?? SEED.tasks,
    commands: (data.commands ?? SEED.commands).map(command => ({
      ...command,
      status: String(command.status) === 'Sent to Claude' ? 'Sent to AI' : command.status,
    })),
    settings: {
      ...SEED.settings,
      ...(data.settings ?? {}),
      todays_mission: data.settings?.todays_mission ?? SEED.settings.todays_mission,
      scoreboard: { ...SEED.settings.scoreboard, ...(data.settings?.scoreboard ?? {}) },
      system_confirmations: { ...SEED.settings.system_confirmations, ...(data.settings?.system_confirmations ?? {}) },
    },
  }
}

function load(): OSData {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return normalizeData(SEED)
    const parsed = JSON.parse(raw) as Partial<OSData>
    // basic shape guard
    if (!parsed.leads || !parsed.settings) return normalizeData(SEED)
    return normalizeData(parsed)
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
  const [data, setData] = useState<OSData>(normalizeData(SEED))
  const [ready, setReady] = useState(false)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('checking')
  const cloudEnabledRef = useRef(false)

  useEffect(() => {
    const local = load()
    setData(local)
    setReady(true)
    let cancelled = false

    async function hydrateCloud() {
      try {
        const response = await fetch('/api/os-data', { cache: 'no-store' })
        const payload = await response.json()
        if (cancelled) return

        if (!payload?.configured) {
          setCloudSyncStatus('local')
          return
        }

        cloudEnabledRef.current = true
        if (payload.data) {
          const remote = normalizeData(payload.data)
          setData(remote)
          persist(remote)
        } else {
          void fetch('/api/os-data', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: local }),
          })
        }
        setCloudSyncStatus('connected')
      } catch {
        if (!cancelled) setCloudSyncStatus('error')
      }
    }

    void hydrateCloud()
    return () => { cancelled = true }
  }, [])

  const update = useCallback((fn: (d: OSData) => OSData) => {
    setData(prev => {
      const next = normalizeData(fn(prev))
      persist(next)
      if (cloudEnabledRef.current) {
        void fetch('/api/os-data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: next }),
        }).catch(() => setCloudSyncStatus('error'))
      }
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
    cloudSyncStatus,
    metrics: computeMetrics(data),
  }
}
