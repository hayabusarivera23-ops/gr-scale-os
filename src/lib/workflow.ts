/**
 * GR Scale OS — Workflow Engine
 *
 * Single source of truth for how a lead moves through the sales process.
 * Every page that shows leads, tasks, or actions pulls from here.
 *
 * Stage order:
 *   Research → Audit → Outreach Ready → Contacted → Follow Up → Meeting → Proposal → Won
 */

// ─── Stage definitions ────────────────────────────────────────────────────────

export const WORKFLOW_STAGES = [
  'Research',
  'Audit',
  'Outreach Ready',
  'Contacted',
  'Follow Up',
  'Meeting',
  'Proposal',
  'Won',
  'Lost',
] as const

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number]

export const STAGE_CONFIG: Record<WorkflowStage, {
  label: string
  description: string
  action: string           // what to do in this stage
  color: string            // tailwind text color
  bg: string               // tailwind bg
  border: string           // tailwind border
  dot: string              // dot color
}> = {
  'Research': {
    label: 'Research',
    description: 'Find the business, confirm phone/email, check for existing site.',
    action: 'Verify contact info',
    color: 'text-zinc-400',
    bg: 'bg-zinc-800/60',
    border: 'border-zinc-700',
    dot: 'bg-zinc-500',
  },
  'Audit': {
    label: 'Audit',
    description: 'Run the website audit to get a specific finding to open the call with.',
    action: 'Run audit →',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  'Outreach Ready': {
    label: 'Outreach Ready',
    description: 'Audit done. Ready to call, text, or email with a specific hook.',
    action: 'Make first contact',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    dot: 'bg-sky-400',
  },
  'Contacted': {
    label: 'Contacted',
    description: 'First contact made. No response yet — follow up.',
    action: 'Follow up today',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  'Follow Up': {
    label: 'Follow Up',
    description: 'Actively following up. Push toward booking a call.',
    action: 'Book the meeting',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
  },
  'Meeting': {
    label: 'Meeting',
    description: 'Call booked. Prep demo, Stripe link, and proposal.',
    action: 'Prep and close',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
  },
  'Proposal': {
    label: 'Proposal',
    description: 'Proposal sent. Chase until you get a yes or no.',
    action: 'Chase the proposal',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    dot: 'bg-pink-400',
  },
  'Won': {
    label: 'Won',
    description: 'Closed. Collect deposit, start project.',
    action: 'Start project',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  'Lost': {
    label: 'Lost',
    description: 'Not interested now. Circle back in 90 days.',
    action: 'Schedule re-contact',
    color: 'text-zinc-600',
    bg: 'bg-zinc-800/40',
    border: 'border-zinc-800',
    dot: 'bg-zinc-600',
  },
}

// ─── Lead shape for workflow engine ──────────────────────────────────────────

export interface WorkflowLead {
  id: string
  business_name: string
  industry: string
  city: string
  phone?: string
  email?: string
  website?: string
  status: string                     // raw CRM status
  website_score: number | null       // null = not audited
  opportunity_score: number
  estimated_deal_value: number
  days_since_contact: number
  next_follow_up: string | null      // ISO date
  notes: string
}

// ─── Map CRM status → Workflow stage ─────────────────────────────────────────

export function toStage(lead: WorkflowLead): WorkflowStage {
  const s = lead.status

  if (s === 'Won')                                    return 'Won'
  if (s === 'Lost')                                   return 'Lost'
  if (s === 'Proposal Sent')                          return 'Proposal'
  if (s === 'Appointment Set')                        return 'Meeting'
  if (s === 'Interested')                             return 'Follow Up'
  if (s === 'Contacted')                              return 'Contacted'

  // Not yet contacted — check if audit is done
  if (lead.website_score !== null)                    return 'Outreach Ready'
  if (s === 'Researching')                            return 'Audit'
  return 'Research'
}

// ─── Is this lead actionable today? ──────────────────────────────────────────

export function isActionableToday(lead: WorkflowLead): boolean {
  const stage = toStage(lead)
  const today = new Date().toISOString().split('T')[0]

  if (stage === 'Won' || stage === 'Lost') return false

  // Research: always actionable (needs to be moved forward)
  if (stage === 'Research') return true

  // Audit: always actionable
  if (stage === 'Audit') return true

  // Outreach Ready: always actionable — haven't called yet
  if (stage === 'Outreach Ready') return true

  // Contacted: actionable if > 1 day since contact
  if (stage === 'Contacted') return lead.days_since_contact >= 1

  // Follow Up: actionable if follow-up date is today or overdue
  if (stage === 'Follow Up') {
    if (!lead.next_follow_up) return true
    return lead.next_follow_up <= today
  }

  // Meeting: always actionable — need to prep
  if (stage === 'Meeting') return true

  // Proposal: actionable if > 2 days with no response
  if (stage === 'Proposal') return lead.days_since_contact >= 2

  return false
}

// ─── Work Queue item ──────────────────────────────────────────────────────────

export type QueueItemType =
  | 'audit'
  | 'call'
  | 'follow_up'
  | 'book_meeting'
  | 'prep_meeting'
  | 'chase_proposal'
  | 'research'
  | 'build_demo'
  | 'finish_demo'

export interface QueueItem {
  id: string
  type: QueueItemType
  label: string                // e.g. "Audit Premier Climate Control"
  sub: string                  // why / context
  lead_id?: string
  demo_id?: string
  priority: number             // 1 = highest
  estimated_minutes: number
  href: string                 // where to go
  phone?: string
}

const QUEUE_TIME: Record<QueueItemType, number> = {
  chase_proposal: 5,
  book_meeting:   5,
  prep_meeting:  15,
  follow_up:     10,
  call:          10,
  audit:         10,
  research:      10,
  build_demo:    120,
  finish_demo:   60,
}

export function buildWorkQueue(leads: WorkflowLead[], demos: { id: string; industry: string; status: string; completion: number }[]): QueueItem[] {
  const items: QueueItem[] = []
  const today = new Date().toISOString().split('T')[0]

  for (const lead of leads) {
    const stage = toStage(lead)
    if (!isActionableToday(lead)) continue

    const base = { lead_id: lead.id, phone: lead.phone }

    if (stage === 'Proposal') {
      items.push({ ...base, id: `proposal-${lead.id}`, type: 'chase_proposal', priority: 1,
        label: `Chase proposal — ${lead.business_name}`,
        sub: `${lead.days_since_contact} days since last contact. ${formatDeal(lead.estimated_deal_value)} on the table.`,
        estimated_minutes: QUEUE_TIME.chase_proposal, href: `/leads/${lead.id}` })
    }

    else if (stage === 'Meeting') {
      items.push({ ...base, id: `meeting-${lead.id}`, type: 'prep_meeting', priority: 2,
        label: `Prep for meeting — ${lead.business_name}`,
        sub: `Have Stripe link, demo URL, and proposal ready before the call.`,
        estimated_minutes: QUEUE_TIME.prep_meeting, href: `/leads/${lead.id}` })
    }

    else if (stage === 'Follow Up') {
      items.push({ ...base, id: `followup-${lead.id}`, type: 'follow_up', priority: 3,
        label: `Follow up — ${lead.business_name}`,
        sub: lead.next_follow_up && lead.next_follow_up < today
          ? `Overdue since ${lead.next_follow_up}. Call or text now.`
          : `Follow-up due today. Push to book a close call.`,
        estimated_minutes: QUEUE_TIME.follow_up, href: `/leads/${lead.id}` })
    }

    else if (stage === 'Contacted') {
      items.push({ ...base, id: `contact-${lead.id}`, type: 'book_meeting', priority: 4,
        label: `Book meeting — ${lead.business_name}`,
        sub: `${lead.days_since_contact} day${lead.days_since_contact === 1 ? '' : 's'} since first contact. Send Calendly link.`,
        estimated_minutes: QUEUE_TIME.book_meeting, href: `/leads/${lead.id}` })
    }

    else if (stage === 'Outreach Ready') {
      items.push({ ...base, id: `call-${lead.id}`, type: 'call', priority: 5,
        label: `Call ${lead.business_name}`,
        sub: `Audit done. Website scored ${lead.website_score}/100. Open with the specific finding.`,
        estimated_minutes: QUEUE_TIME.call, href: `/workspace?lead=${lead.id}` })
    }

    else if (stage === 'Audit') {
      items.push({ ...base, id: `audit-${lead.id}`, type: 'audit', priority: 6,
        label: `Audit ${lead.business_name}`,
        sub: `No audit yet. Run it first, then call. Takes ~10 min.`,
        estimated_minutes: QUEUE_TIME.audit, href: `/audit` })
    }

    else if (stage === 'Research') {
      items.push({ ...base, id: `research-${lead.id}`, type: 'research', priority: 7,
        label: `Research ${lead.business_name}`,
        sub: `Confirm phone, email, and website. Check Google Maps listing.`,
        estimated_minutes: QUEUE_TIME.research, href: `/leads/${lead.id}` })
    }
  }

  // Demo tasks — add after lead tasks
  for (const demo of demos) {
    if (demo.status === 'Building') {
      items.push({ id: `finish-demo-${demo.id}`, type: 'finish_demo', priority: 8,
        label: `Finish ${demo.industry} demo`,
        sub: `${demo.completion}% complete. Finishing this unlocks a new niche to pitch.`,
        demo_id: demo.id, estimated_minutes: QUEUE_TIME.finish_demo, href: `/demos` })
    }
    if (demo.status === 'Planned' && items.filter(i => i.type === 'build_demo').length < 1) {
      items.push({ id: `build-demo-${demo.id}`, type: 'build_demo', priority: 9,
        label: `Build ${demo.industry} demo`,
        sub: `No demo for this niche yet. Build before pitching ${demo.industry} leads.`,
        demo_id: demo.id, estimated_minutes: QUEUE_TIME.build_demo, href: `/demos` })
    }
  }

  // Sort by priority, then by deal value within the same priority
  return items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    const la = leads.find(l => l.id === a.lead_id)
    const lb = leads.find(l => l.id === b.lead_id)
    return (lb?.estimated_deal_value ?? 0) - (la?.estimated_deal_value ?? 0)
  })
}

// ─── Revenue opportunity ──────────────────────────────────────────────────────

export function revenueOpportunity(leads: WorkflowLead[]): number {
  return leads
    .filter(l => !['Won', 'Lost'].includes(l.status))
    .reduce((s, l) => s + l.estimated_deal_value, 0)
}

// ─── Closest to paying ────────────────────────────────────────────────────────

export function closestToPaying(leads: WorkflowLead[]): WorkflowLead | null {
  const STAGE_WEIGHT: Record<WorkflowStage, number> = {
    'Won': -1, 'Lost': -1,
    'Proposal': 7, 'Meeting': 6, 'Follow Up': 5,
    'Contacted': 4, 'Outreach Ready': 3,
    'Audit': 2, 'Research': 1,
  }
  return [...leads]
    .filter(l => !['Won', 'Lost'].includes(l.status))
    .sort((a, b) => {
      const ws = STAGE_WEIGHT[toStage(b)] - STAGE_WEIGHT[toStage(a)]
      if (ws !== 0) return ws
      return b.estimated_deal_value - a.estimated_deal_value
    })[0] ?? null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeal(v: number) {
  return `$${v.toLocaleString()}`
}

export const QUEUE_TYPE_CONFIG: Record<QueueItemType, { icon: string; color: string; bg: string }> = {
  chase_proposal: { icon: 'DollarSign', color: 'text-red-400',    bg: 'bg-red-500/10'    },
  prep_meeting:   { icon: 'Users',      color: 'text-orange-400', bg: 'bg-orange-500/10' },
  book_meeting:   { icon: 'Calendar',   color: 'text-violet-400', bg: 'bg-violet-500/10' },
  follow_up:      { icon: 'Clock',      color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  call:           { icon: 'Phone',      color: 'text-sky-400',    bg: 'bg-sky-500/10'    },
  audit:          { icon: 'Search',     color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
  research:       { icon: 'FileText',   color: 'text-zinc-400',   bg: 'bg-zinc-800'      },
  build_demo:     { icon: 'Globe',      color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
  finish_demo:    { icon: 'Zap',        color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
}

// ─── Lead Matching Engine ─────────────────────────────────────────────────────
// Every lead automatically gets a recommended demo, offer, package, price, and
// sales angle based on their industry and website score.

export interface LeadMatch {
  demoUrl:       string       // URL to show the prospect
  demoLabel:     string       // display name of the demo
  offer:         string       // what to lead with in the pitch
  package:       string       // Starter / Growth / Pro
  price:         string       // recommended price point
  salesAngle:    string       // the single strongest argument for this lead
  urgencyDriver: string       // why they need to act now
}

const DEMO_MAP: Record<string, { url: string; label: string }> = {
  'HVAC':             { url: 'https://acorlandohvac.com',           label: 'AC Orlando HVAC Demo'      },
  'Barber':           { url: 'https://lexthebarber.com',            label: 'LexTheBarber Demo'         },
  'Barbershop':       { url: 'https://lexthebarber.com',            label: 'LexTheBarber Demo'         },
  'Plumbing':         { url: '/demo-factory/plumbing',              label: 'Elite Plumbing Demo'       },
  'Roofing':          { url: '/demo-factory/roofing',               label: 'Peak Roofing Demo'         },
  'Pressure Washing': { url: '/demo-factory/pressure-washing',      label: 'SparkClean Demo'           },
  'Landscaping':      { url: '/demo-factory/landscaping',           label: 'GreenEdge Landscaping Demo'},
}

const ANGLE_MAP: Record<string, { offer: string; salesAngle: string; urgencyDriver: string }> = {
  'HVAC': {
    offer:         'Free website + 3 months local SEO',
    salesAngle:    "Your competitors show up on Google when someone searches 'AC repair near me' — you don't. Every day without a website is leads going to them.",
    urgencyDriver: "Summer is peak season. You need to be ranking before the heat hits.",
  },
  'Plumbing': {
    offer:         'Emergency-ready website + Google Business setup',
    salesAngle:    "When a pipe bursts at midnight, people Google 'emergency plumber near me.' If you're not there, that call goes to someone else.",
    urgencyDriver: "Emergency searches happen 24/7 — every day you wait costs you real calls.",
  },
  'Roofing': {
    offer:         'Storm-damage landing page + insurance claim page',
    salesAngle:    "After every storm, homeowners search for roofers. Without a site, you're invisible to every one of them.",
    urgencyDriver: "Storm season in Florida means peak search volume. You want to be ranking now, not after.",
  },
  'Pressure Washing': {
    offer:         'Before/after gallery site + Google Business optimization',
    salesAngle:    "Pressure washing is a visual business. A website with before/after photos converts at 3x the rate of just a phone number on a truck.",
    urgencyDriver: "Spring and summer are your busiest seasons. A site live now = bookings now.",
  },
  'Landscaping': {
    offer:         'Portfolio site + online booking + seasonal SEO',
    salesAngle:    "Landscaping clients want to see your work before they call. Without a portfolio site, you're losing bids to companies with worse service but better websites.",
    urgencyDriver: "Lawn care contracts are signed in spring. You want your site live before homeowners start looking.",
  },
  'Barber': {
    offer:         'Booking-integrated portfolio + Instagram sync',
    salesAngle:    "New clients find barbers on Google and Instagram. A professional site with a booking link turns searchers into booked appointments without a phone call.",
    urgencyDriver: "Your chair sits empty when people can't find you online.",
  },
  'Barbershop': {
    offer:         'Booking-integrated portfolio + Instagram sync',
    salesAngle:    "New clients find barbershops on Google and Instagram. A professional site with a booking link turns searchers into booked appointments without a phone call.",
    urgencyDriver: "Your chairs sit empty when people can't find you online.",
  },
}

const PACKAGE_MAP = {
  no_website:  { package: 'Growth',  price: '$800',   rationale: 'No website — Growth package covers all pages they need from day one.' },
  bad_website: { package: 'Starter', price: '$500',   rationale: 'Bad existing site — Starter redesign gets them professional fast and cheap.' },
  ok_website:  { package: 'Pro',     price: '$1,200', rationale: 'Existing site is OK — upsell to Pro with SEO + booking to add real value.' },
  default:     { package: 'Growth',  price: '$800',   rationale: 'Default recommendation.' },
}

export function matchLead(lead: WorkflowLead): LeadMatch {
  const industry = lead.industry ?? ''
  const demo     = DEMO_MAP[industry] ?? { url: '/demos', label: `${industry} Demo` }
  const angle    = ANGLE_MAP[industry] ?? {
    offer:         'Professional website + Google Business setup',
    salesAngle:    `Your local competitors with a modern website are capturing the customers who search online — you need to be there too.`,
    urgencyDriver: 'Every day without a website is missed revenue.',
  }

  let pkg = PACKAGE_MAP.default
  if (!lead.website_score && !lead.website)         pkg = PACKAGE_MAP.no_website
  else if (lead.website_score !== null && lead.website_score < 40) pkg = PACKAGE_MAP.bad_website
  else if (lead.website_score !== null && lead.website_score >= 60) pkg = PACKAGE_MAP.ok_website

  return {
    demoUrl:       demo.url,
    demoLabel:     demo.label,
    offer:         angle.offer,
    package:       pkg.package,
    price:         pkg.price,
    salesAngle:    angle.salesAngle,
    urgencyDriver: angle.urgencyDriver,
  }
}
