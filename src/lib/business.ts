import type { OSData, OSLead } from './store'

export const HVAC_PIPELINE_STAGES = [
  'LIST',
  'SENT',
  'REPLIED',
  'CALL BOOKED',
  'AUDIT DONE',
  'PROPOSAL SENT',
  'DEPOSIT PAID',
  'LIVE/MAINTENANCE',
] as const

export type HvacPipelineStage = typeof HVAC_PIPELINE_STAGES[number]

export interface HvacPipelineLead {
  id: string
  name: string
  phone?: string
  email?: string
  siteUrl?: string
  flaws: string[]
  stage: HvacPipelineStage
  lastTouch?: string
  nextTouch?: string
  draftCreatedAt?: string
  heat?: number
  notes?: string
}

export interface MoneyAction {
  sentence: string
  buttonLabel: string
  href: string
  stage: HvacPipelineStage
}

export interface LocalApproval {
  id: string
  kind: 'outreach' | 'reply' | 'proposal' | 'followup' | 'post' | 'other'
  leadId?: string
  leadName?: string
  title: string
  body: string
  status: 'awaiting' | 'approved' | 'rejected' | 'done'
  createdBy: string
  createdAt: string
  decidedAt?: string
  href?: string
}

export interface ResponseTemplate {
  label: string
  body: string
}

export const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    label: 'Who is this?',
    body: "Hey! Gio with GR Scale. I help local service businesses get seen better and turn more people into calls. I was checking out {name} and noticed {problem}. No pressure, just figured you'd want to know. Want me to send what I found?",
  },
  {
    label: 'How much?',
    body: 'Depends what you need, but straight up: sites usually run $500-750 one-time plus $99/mo if you want me handling updates after. If {problem} is the main issue, we may be able to start smaller. Worth a quick audit first?',
  },
  {
    label: 'Send info',
    body: 'For sure. Quick version: I found {problem}. That is the kind of thing that can send customers to competitors. Real example: meloair.net. Free audit call if you want the full breakdown: grscales.com/book. No pressure either way.',
  },
  {
    label: 'Not interested',
    body: "All good, appreciate you replying. If the online presence ever becomes a headache, my number's here. Good luck with the season.",
  },
  {
    label: 'Examples?',
    body: 'Yep. Meloair.net is an HVAC example, lexthebarber.com is another live client build, and there are more demos at grscales.com/demos. I can also show what I would change for {name}.',
  },
  {
    label: 'Wants a call',
    body: 'Perfect. Grab any time here and it books straight to my calendar: calendly.com/gio-grscales/free-website-audit-20-min. Or just tell me a time and I can call you.',
  },
  {
    label: 'Ghosted first message',
    body: 'Hey, just floating this back up. {problem} is still the first thing I would fix. Takes 2 minutes to show you what I mean. No worries if it is not a priority right now.',
  },
  {
    label: 'Ghosted proposal',
    body: "Hey {name}, no rush on the proposal. Just checking it did not get buried. If the price is the snag, tell me straight and we can figure out a smaller first step. If timing's bad, when should I check back?",
  },
]

const GMAIL_DRAFTS_URL = 'https://mail.google.com/mail/u/0/#drafts'
export const LOCAL_APPROVALS_KEY = 'gr.local-approvals.v1'

function stageFromLead(lead: OSLead): HvacPipelineStage {
  if (lead.status === 'Won') return 'LIVE/MAINTENANCE'
  if (lead.proposal_status === 'Accepted') return 'DEPOSIT PAID'
  if (lead.proposal_status === 'Sent' || lead.status === 'Proposal Sent') return 'PROPOSAL SENT'
  if (lead.status === 'Meeting Booked') return 'CALL BOOKED'
  if (lead.status === 'Interested') return 'REPLIED'
  if (lead.status === 'Contacted') return 'SENT'
  return 'LIST'
}

function daysAgoIso(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - Math.max(0, days))
  return date.toISOString().slice(0, 10)
}

export function pipelineFromStore(data: OSData): HvacPipelineLead[] {
  const hvac = data.leads.filter(lead => lead.industry.toLowerCase().includes('hvac'))
  const source = hvac.length ? hvac : data.leads.slice(0, 8)

  return source.map(lead => ({
    id: lead.id,
    name: lead.business_name,
    phone: lead.phone,
    email: lead.email,
    siteUrl: lead.website,
    flaws: lead.notes ? [lead.notes] : [],
    stage: stageFromLead(lead),
    lastTouch: lead.days_since_contact ? `${lead.days_since_contact} days ago` : undefined,
    nextTouch: lead.next_follow_up ?? undefined,
    draftCreatedAt: daysAgoIso(lead.days_since_contact),
    heat: lead.opportunity_score >= 90 ? 3 : lead.opportunity_score >= 75 ? 2 : lead.opportunity_score >= 60 ? 1 : 0,
    notes: lead.notes,
  }))
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysIso(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function isDue(iso?: string) {
  return Boolean(iso && iso <= todayIso())
}

export function daysSinceIso(iso?: string) {
  if (!iso) return 0
  const start = new Date(`${iso}T00:00:00`).getTime()
  if (Number.isNaN(start)) return 0
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000))
}

export function isDraftStale(lead: HvacPipelineLead) {
  return lead.stage === 'LIST' && daysSinceIso(lead.draftCreatedAt) > 5
}

export function prospectSafeFlaw(text?: string) {
  const cleaned = (text || '').trim().replace(/\.+$/, '')
  if (!cleaned) return ''
  const internalPattern = /target|gmail|draft|lexthebarber|meloair|proof|pitch|angle|phone lead|call script|keep as|send free|reviews\b/i
  const looksInternal =
    cleaned.startsWith('#') ||
    internalPattern.test(cleaned) ||
    /\b[A-Z]{4,}\b/.test(cleaned) ||
    cleaned.split('. ').length > 2
  return looksInternal ? '' : cleaned
}

export function mergeResponseTemplate(template: string, lead?: Partial<HvacPipelineLead>, problemOverride?: string) {
  const problem = problemOverride?.trim() || prospectSafeFlaw(lead?.flaws?.[0]) || prospectSafeFlaw(lead?.notes) || 'one thing that may be costing you calls'
  return template
    .replaceAll('{name}', lead?.name || 'your business')
    .replaceAll('{problem}', problem)
}

export function countsByStage(leads: HvacPipelineLead[]) {
  return HVAC_PIPELINE_STAGES.map(stage => ({
    stage,
    count: leads.filter(lead => lead.stage === stage).length,
  }))
}

export function nextMoneyAction(leads: HvacPipelineLead[]): MoneyAction {
  const stale = leads.find(isDraftStale)
  if (stale) {
    return {
      sentence: `Draft for ${stale.name} is getting stale. Refresh or send it today.`,
      buttonLabel: 'Open Send Desk',
      href: '#pipeline',
      stage: 'LIST',
    }
  }

  const followup = leads.find(lead => ['SENT', 'PROPOSAL SENT'].includes(lead.stage) && isDue(lead.nextTouch))
  if (followup) {
    return {
      sentence: `Follow up with ${followup.name}. It is due now.`,
      buttonLabel: 'Open Approval Queue',
      href: '/approve',
      stage: followup.stage,
    }
  }

  const listCount = leads.filter(lead => lead.stage === 'LIST').length
  if (listCount < 20) {
    return {
      sentence: `Build the HVAC list: ${listCount}/20 leads ready.`,
      buttonLabel: 'Find HVAC Leads',
      href: '/discover',
      stage: 'LIST',
    }
  }

  const unsent = leads.find(lead => lead.stage === 'LIST')
  if (unsent) {
    return {
      sentence: `Send today's 10 outreach drafts. Next up: ${unsent.name}.`,
      buttonLabel: 'Open Gmail Drafts',
      href: GMAIL_DRAFTS_URL,
      stage: 'SENT',
    }
  }

  const replied = leads.find(lead => lead.stage === 'REPLIED')
  if (replied) {
    return {
      sentence: `Reply to ${replied.name} and push for the audit call.`,
      buttonLabel: 'Open Workspace',
      href: '/workspace',
      stage: 'REPLIED',
    }
  }

  const booked = leads.find(lead => lead.stage === 'CALL BOOKED')
  if (booked) {
    return {
      sentence: `Prep the audit call for ${booked.name}.`,
      buttonLabel: 'Prep Audit',
      href: '/audit',
      stage: 'CALL BOOKED',
    }
  }

  const auditDone = leads.find(lead => lead.stage === 'AUDIT DONE')
  if (auditDone) {
    return {
      sentence: `Send the proposal to ${auditDone.name}.`,
      buttonLabel: 'Open Proposals',
      href: '/proposals',
      stage: 'AUDIT DONE',
    }
  }

  const proposal = leads.find(lead => lead.stage === 'PROPOSAL SENT')
  if (proposal) {
    return {
      sentence: `Send deposit link or follow up with ${proposal.name}.`,
      buttonLabel: 'Open Revenue',
      href: '/revenue',
      stage: 'PROPOSAL SENT',
    }
  }

  return {
    sentence: 'First customer system ready. Keep sending 10/day until deposit paid.',
    buttonLabel: 'Open Pipeline',
    href: '/pipeline',
    stage: 'LIVE/MAINTENANCE',
  }
}

export function outreachDraftFor(lead: HvacPipelineLead) {
  const flaw = prospectSafeFlaw(lead.flaws[0]) || 'your website could probably turn more visitors into calls'
  return `Subject: quick idea for ${lead.name}\n\nHey ${lead.name} team,\n\nI was looking at your online presence and noticed ${flaw}.\n\nI help local service businesses get seen better and turn more visitors into calls. Sometimes that means the website, sometimes Google Business Profile, sometimes just fixing the first impression people see from their phone.\n\nI can send a quick 60-second audit showing the biggest thing I would fix first. Want me to send it over?\n\n- Gio\nGR Scale`
}

export function followupDraftFor(lead: HvacPipelineLead) {
  return `Hey ${lead.name} team,\n\nJust following up. The main thing I noticed is your online presence could be doing more to turn people searching into actual calls.\n\nIf helpful, I can send the quick audit and show the first 2-3 things I would fix.\n\n- Gio`
}

export function replyDraftFor(lead: HvacPipelineLead, replyText: string) {
  const reply = replyText.toLowerCase()
  let response = `Hey, appreciate you getting back to me.\n\nThe easiest next step is a quick free audit. I will show you what I noticed, what I would fix first, and whether it is even worth doing right now.\n\nHere is my booking link: ${CALENDLY_AUDIT_LINK}\n\n- Gio`

  if (reply.includes('who') || reply.includes('what is this') || reply.includes('who is')) {
    response = `Hey, it's Gio from GR Scale. I help local service businesses get seen better online and turn more people into calls.\n\nI noticed one thing on your online presence that may be costing calls, so I reached out. Want me to send the quick audit?`
  } else if (reply.includes('price') || reply.includes('cost') || reply.includes('much')) {
    response = `Usually it is $500 for a build and $99/mo if you want me to keep it updated. If you only need the visibility cleanup first, I can start smaller around $300.\n\nI would rather look at what you actually need before pushing a package. Want me to send the quick audit first?`
  } else if (reply.includes('send') || reply.includes('info') || reply.includes('details')) {
    response = `For sure. The simple version: I find what is stopping people from calling, then fix the online presence so more people trust you from their phone.\n\nI can send the quick audit first so you can see exactly what I mean.`
  } else if (reply.includes('call') || reply.includes('meeting') || reply.includes('book')) {
    response = `Sounds good. Here is my booking link: ${CALENDLY_AUDIT_LINK}\n\nThe call is quick. I will show you what I found, what I would fix first, and what it would cost.`
  } else if (reply.includes('not interested') || reply.includes('no thanks') || reply.includes('stop')) {
    response = `No worries at all. I appreciate you replying.\n\nIf you ever want a quick outside look at your website or Google listing, I can send a short audit with no pressure.`
  }

  return `Lead reply from ${lead.name}:\n"${replyText}"\n\nSuggested response:\n\n${response}`
}

export function proposalDraftFor(lead: HvacPipelineLead) {
  const safeFlaws = lead.flaws.map(item => prospectSafeFlaw(item)).filter(Boolean)
  const flaws = safeFlaws.length ? safeFlaws.map(item => `- ${item}`).join('\n') : '- Mobile conversion and quote flow need improvement'
  return `# GR Scale Proposal - ${lead.name}\n\n## Problems found\n${flaws}\n\n## What GR Scale will build\n- A fast, mobile-first website built to drive calls and quote requests\n- Clear service sections and trust-building copy\n- Click-to-call and quote buttons on every important page\n- Basic local SEO structure for HVAC search intent\n- Launch support and monthly maintenance\n\n## Price\n- Build: $500\n- Monthly maintenance: $99/mo\n- Timeline: 7-14 days after deposit and required business info\n\n## Next step\nApprove the project with a $250 deposit. Once the deposit is received, GR Scale starts the build and sends the first preview.\n\nPrepared by Gio at GR Scale.`
}

export function createApproval(input: Omit<LocalApproval, 'id' | 'status' | 'createdAt'>): LocalApproval {
  return {
    ...input,
    id: `ap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: 'awaiting',
    createdAt: new Date().toISOString(),
  }
}

export const CALENDLY_AUDIT_LINK = 'https://calendly.com/gio-grscales/free-website-audit-20-min'
export const GMAIL_DRAFTS_LINK = GMAIL_DRAFTS_URL
