/**
 * GR Scale OS — Service Layer
 *
 * These interfaces define the contracts for all future automation modules.
 * Today every module is implemented manually (no-op stubs).
 * Tomorrow each interface can be swapped for a real provider without touching the UI.
 *
 * Design rule: UI code depends on interfaces, never on implementations.
 * Swap providers in this file. Everything else stays the same.
 */

// ─── Core domain types ────────────────────────────────────────────────────────

export interface LeadRecord {
  id: string
  business_name: string
  industry: string
  city: string
  state: string
  phone?: string
  email?: string
  website?: string
  status: string
  lead_score: number
  estimated_deal_value: number
  website_score: number | null
  opportunity_score: number | null
  audit_weaknesses: string[]
  outreach_angle: string
  notes?: string
}

export interface AuditResult {
  website_score: number
  opportunity_score: number
  weaknesses: string[]
  strengths: string[]
  outreach_angle: string
  recommended_package: 'Starter' | 'Growth' | 'Scale'
}

export interface OutreachSequence {
  cold_email: string
  follow_up_1: string
  follow_up_2: string
  sms: string
  voicemail: string
}

export interface DemoSite {
  id: string
  industry: string
  name: string
  url: string
  status: 'Live' | 'Building' | 'Planned'
  description: string
  preview_image?: string
  linked_leads: number
}

export interface DailyMission {
  date: string
  leads_to_audit: LeadRecord[]
  leads_to_call: LeadRecord[]
  leads_to_follow_up: LeadRecord[]
  leads_ready_for_proposal: LeadRecord[]
  estimated_revenue_available: number
  most_valuable_action: { lead: LeadRecord; action: string; reason: string } | null
}

// ─── Interface: Lead Provider ─────────────────────────────────────────────────
// TODAY:  manually imported leads (seed data in each page)
// FUTURE: Apollo, Google Maps scraper, Outscraper, Clay, custom crawler

export interface ILeadProvider {
  name: string
  getLeads(filters?: { industry?: string; city?: string; minScore?: number }): Promise<LeadRecord[]>
  addLead(lead: Omit<LeadRecord, 'id'>): Promise<LeadRecord>
  updateLead(id: string, updates: Partial<LeadRecord>): Promise<LeadRecord>
}

// Manual provider (current implementation)
export class ManualLeadProvider implements ILeadProvider {
  name = 'Manual Import'
  async getLeads() { return [] }
  async addLead(lead: Omit<LeadRecord, 'id'>) { return { ...lead, id: Date.now().toString() } }
  async updateLead(id: string, updates: Partial<LeadRecord>) { return { id, ...updates } as LeadRecord }
}

// ─── Interface: Outreach Generator ───────────────────────────────────────────
// TODAY:  template-based generation (in-memory, personalized from audit data)
// FUTURE: OpenAI / Claude API for dynamic copy generation

export interface IOutreachGenerator {
  name: string
  generateSequence(lead: LeadRecord, audit: AuditResult): Promise<OutreachSequence>
}

// Template provider (current implementation — no API needed)
export class TemplateOutreachGenerator implements IOutreachGenerator {
  name = 'Template Generator'
  async generateSequence(lead: LeadRecord, audit: AuditResult): Promise<OutreachSequence> {
    const { business_name, industry, city, phone, website } = lead
    const { website_score, outreach_angle, weaknesses } = audit
    const w1 = weaknesses[0] ?? 'significant website issues'
    return {
      cold_email: `Subject: Issue I found on ${business_name}'s website\n\nHey,\n\nI was looking up ${industry} companies in ${city} and ran a quick audit of ${website ?? 'your site'}.\n\nYour site scored ${website_score}/100 — mainly because ${outreach_angle}.\n\nThat means customers find you on Google, click your site, and leave before calling.\n\nI made a 60-second video showing exactly what I found. Can I send it to you?\n\n— Gio, GR Scale\n[your phone]`,
      follow_up_1: `Subject: Re: ${business_name}'s website\n\nHey — bumping this in case it got buried.\n\n${business_name}'s site scored ${website_score}/100. The main issue: ${w1}.\n\nI build sites for ${industry} companies in FL — mobile-first, click-to-call, done in 7 days.\n\nWorth a 10-minute call? I'll show the fixes on screen.\n\n— Gio`,
      follow_up_2: `Hey — last follow-up.\n\nI put together a free homepage mockup for ${business_name}. You keep it whether we work together or not.\n\nJust reply "send it."\n\n— Gio, GR Scale`,
      sms: `Hey, Gio here — GR Scale. Audited ${business_name}'s website, scored ${website_score}/100. Main issue: ${w1}. Made a 60-sec video showing the fix. Can I text it?`,
      voicemail: `Hey, this is Gio for the owner of ${business_name}. I build websites for ${industry} companies in Florida. Ran an audit of your site — scored ${website_score}/100. Main issue: ${w1}. Made a 1-minute video. Can I text it? My number is [YOUR NUMBER]. Thanks.`,
    }
  }
}

// ─── Interface: Email Sender ──────────────────────────────────────────────────
// TODAY:  not implemented — copy text and send manually
// FUTURE: SendGrid, Resend, Instantly, Lemlist

export interface IEmailSender {
  name: string
  sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; messageId?: string }>
  getDeliveryStatus(messageId: string): Promise<'delivered' | 'opened' | 'clicked' | 'bounced' | 'unknown'>
}

// No-op stub (placeholder until real sender is wired up)
export class NoOpEmailSender implements IEmailSender {
  name = 'Manual (copy-paste)'
  async sendEmail() { return { success: false } }
  async getDeliveryStatus() { return 'unknown' as const }
}

// ─── Interface: Calendar ──────────────────────────────────────────────────────
// TODAY:  Calendly link (manual) — copy link and send
// FUTURE: Google Calendar API, Calendly webhooks, Cal.com

export interface ICalendarService {
  name: string
  getBookingLink(leadId: string): string
  getUpcomingEvents(): Promise<{ title: string; start: Date; lead_id?: string }[]>
}

export class ManualCalendarService implements ICalendarService {
  name = 'Calendly (manual)'
  getBookingLink() { return process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/[your-link]' }
  async getUpcomingEvents() { return [] }
}

// ─── Interface: Payments ──────────────────────────────────────────────────────
// TODAY:  Stripe payment links (manual) — generate in Stripe dashboard
// FUTURE: Stripe API — auto-generate invoices from proposals

export interface IPaymentService {
  name: string
  createPaymentLink(amount: number, description: string, clientEmail: string): Promise<string>
  getPaymentStatus(paymentId: string): Promise<'unpaid' | 'paid' | 'failed'>
}

export class ManualPaymentService implements IPaymentService {
  name = 'Stripe (manual)'
  async createPaymentLink() { return 'https://buy.stripe.com/[your-link]' }
  async getPaymentStatus() { return 'unpaid' as const }
}

// ─── Interface: AI Caller ─────────────────────────────────────────────────────
// TODAY:  not implemented — you dial manually from the app
// FUTURE: Bland.ai, Vapi, Retell — automated cold calling with voice agents

export interface IAICaller {
  name: string
  initiateCall(phone: string, script: string, leadId: string): Promise<{ callId: string }>
  getCallTranscript(callId: string): Promise<string | null>
  getCallOutcome(callId: string): Promise<'interested' | 'not_interested' | 'voicemail' | 'no_answer' | 'unknown'>
}

export class ManualDialer implements IAICaller {
  name = 'Manual Dial'
  async initiateCall() { return { callId: '' } }
  async getCallTranscript() { return null }
  async getCallOutcome() { return 'unknown' as const }
}

// ─── Interface: CRM Sync ──────────────────────────────────────────────────────
// TODAY:  Supabase (seed data fallback) — data lives in the app
// FUTURE: HubSpot, GoHighLevel, Notion, Airtable

export interface ICRMSync {
  name: string
  syncLead(lead: LeadRecord): Promise<void>
  syncOutreachLog(leadId: string, type: string, outcome: string, notes: string): Promise<void>
}

export class SupabaseCRMSync implements ICRMSync {
  name = 'Supabase'
  async syncLead() {}
  async syncOutreachLog() {}
}

// ─── Service Registry ─────────────────────────────────────────────────────────
// Single place to swap providers. Import this in any page that needs services.

export const services = {
  leads:     new ManualLeadProvider(),
  outreach:  new TemplateOutreachGenerator(),
  email:     new NoOpEmailSender(),
  calendar:  new ManualCalendarService(),
  payments:  new ManualPaymentService(),
  caller:    new ManualDialer(),
  crm:       new SupabaseCRMSync(),
} as const

export type ServiceRegistry = typeof services
