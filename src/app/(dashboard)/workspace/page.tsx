'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Phone, Copy, CheckCircle2, ExternalLink, Search,
  Globe, MessageSquare, Mail, Mic, Video, ChevronRight
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

// ─── Lead data ────────────────────────────────────────────────────────────────

interface WorkspaceLead {
  id: string
  business_name: string
  industry: string
  city: string
  phone?: string
  email?: string
  website?: string
  status: string
  website_score: number | null
  opportunity_score: number
  estimated_deal_value: number
  notes: string
  audit_weaknesses: string[]
  outreach_angle: string
}

const LEADS: WorkspaceLead[] = [
  {
    id: '7',  business_name: 'Premier Climate Control', industry: 'HVAC', city: 'Jacksonville',
    phone: '(904) 555-0505', email: 'mike@premierclimate.com', website: 'https://premierclimate.com',
    status: 'New', website_score: null, opportunity_score: 91, estimated_deal_value: 2500,
    notes: 'Site looks like 2012. No mobile. High-value Dominate target.',
    audit_weaknesses: ['Not mobile-friendly', 'No click-to-call button', 'No quote form', 'Slow load speed'],
    outreach_angle: 'site is losing customers on mobile — 70% of searches happen on phones',
  },
  {
    id: '1',  business_name: 'Cool Coast Heating & Cooling', industry: 'HVAC', city: 'Sarasota',
    phone: '(941) 623-4518', email: 'office@coolcoast.net', website: 'https://coolcoast.net',
    status: 'New', website_score: null, opportunity_score: 88, estimated_deal_value: 750,
    notes: 'Hibu template. 555 placeholder phone. Expired coupons.',
    audit_weaknesses: ['Template site (Hibu)', 'Placeholder "555" phone on site', 'Expired 2022 coupon still visible', 'No Google Reviews integration'],
    outreach_angle: 'site has a fake phone number and expired coupons — customers literally can\'t call them',
  },
  {
    id: '2',  business_name: 'Aire Masters Heating & Air', industry: 'HVAC', city: 'Ocala',
    phone: '(352) 414-6556', website: 'https://airemasters.com',
    status: 'New', website_score: null, opportunity_score: 89, estimated_deal_value: 750,
    notes: 'Title tag says "Brien for County Commissioner." SEO disaster.',
    audit_weaknesses: ['Page title says "Brien for County Commissioner"', 'No meta description', 'No quote form', 'Not mobile responsive'],
    outreach_angle: 'Google shows their site as a political campaign — anyone searching for AC repair in Ocala sees the wrong business',
  },
  {
    id: '5',  business_name: 'Sunshine HVAC Services', industry: 'HVAC', city: 'Tampa',
    phone: '(813) 555-0303', email: 'info@sunshinehvac.com', website: 'https://sunshinehvac.com',
    status: 'New', website_score: null, opportunity_score: 82, estimated_deal_value: 1500,
    notes: 'Good reviews but slow site, no service area pages.',
    audit_weaknesses: ['Page loads in 8+ seconds on mobile', 'No service area pages', 'No Google Reviews section', 'No online quote form'],
    outreach_angle: 'site takes 8+ seconds to load on mobile — most visitors leave before it finishes',
  },
  {
    id: '4',  business_name: 'Arctic Air Conditioning', industry: 'HVAC', city: 'Orlando',
    phone: '(407) 555-0202', website: 'https://arcticair-orlando.com',
    status: 'New', website_score: null, opportunity_score: 79, estimated_deal_value: 1500,
    notes: 'Outdated. No quote form. Losing Maps traffic.',
    audit_weaknesses: ['No quote request form', 'No service area pages', 'No reviews section', 'Desktop-only design'],
    outreach_angle: 'no way for customers to request a quote online — they\'re losing every visitor who doesn\'t want to call',
  },
  {
    id: '6',  business_name: 'Breeze Masters AC', industry: 'HVAC', city: 'Miami',
    phone: '(305) 555-0404',
    status: 'New', website_score: null, opportunity_score: 60, estimated_deal_value: 750,
    notes: 'Facebook only — no website.',
    audit_weaknesses: ['No website at all', 'Facebook-only presence', 'Missing from Google search', 'No way to collect leads outside Facebook'],
    outreach_angle: 'they have zero website — losing every customer who Googles "AC repair Miami" instead of Facebook',
  },
  {
    id: '9',  business_name: 'Comfort Zone AC', industry: 'HVAC', city: 'Lakeland',
    phone: '(863) 555-0707',
    status: 'New', website_score: null, opportunity_score: 70, estimated_deal_value: 750,
    notes: 'No website. Phone-only listing.',
    audit_weaknesses: ['No website', 'Phone-only Google listing', 'No Google reviews strategy', 'Invisible to anyone searching online'],
    outreach_angle: 'no website means they\'re invisible to anyone who searches before calling',
  },
]

// ─── Demo map ─────────────────────────────────────────────────────────────────

const DEMO_URL: Record<string, { url: string; live: boolean }> = {
  'HVAC':   { url: 'https://acorlandohvac.com',   live: true  },
  'Barber': { url: 'https://lexthebarber.com',     live: true  },
}

// ─── Message generation ───────────────────────────────────────────────────────

interface Messages {
  coldEmail: string
  followUp1: string
  sms: string
  voicemail: string
  loomScript: string
}

function generateMessages(lead: WorkspaceLead): Messages {
  const { business_name, city, website_score, outreach_angle, audit_weaknesses, phone, industry } = lead
  const w1 = audit_weaknesses[0] ?? 'several website issues'
  const w2 = audit_weaknesses[1] ?? 'missing conversion elements'
  const demo = DEMO_URL[industry]
  const demoLine = demo?.live ? `\n\nHere's an example of what I built for another ${industry} company: ${demo.url}` : ''
  const scoreLine = website_score !== null ? ` It scored ${website_score}/100.` : ''

  return {
    coldEmail:
`Subject: Quick issue I found on ${business_name}'s website

Hey,

I was looking up ${industry} companies in ${city} and ran a quick audit of your site.${scoreLine}

The main issue: ${outreach_angle}.

Specifically I noticed:
• ${w1}
• ${w2}

That means customers find you on Google, visit your site, and leave before calling you.

I made a 60-second screen recording showing exactly what I found and what a fix looks like.${demoLine}

Can I text it to you? Takes 60 seconds to watch.

— Gio Rivera
GR Scale
[Your Phone Number]`,

    followUp1:
`Subject: Re: ${business_name}'s website

Hey — bumping this in case it got buried.

I audited ${business_name}'s site and found the main issue is: ${outreach_angle}.

I build websites for ${industry} companies in Florida — mobile-first, click-to-call, done in 7 days. Most clients see more calls within the first week.

Worth a 10-minute call? I'll show you the fix on screen, no pressure.

— Gio
GR Scale
[Your Phone Number]`,

    sms:
`Hey, Gio here — GR Scale. I audited ${business_name}'s website and found ${outreach_angle}. Made a 60-sec screen recording showing exactly what I'd fix. Can I send it over? Takes 1 min to watch.`,

    voicemail:
`Hey, this is Gio for the owner of ${business_name}. I build websites for ${industry} companies in Florida.

I ran a quick audit of your website and found that ${outreach_angle}.

I made a 60-second video showing exactly what I found — and what it would look like fixed.

Can I text it to you? My number is [YOUR NUMBER]. I'll also follow up with a text so you have it. Thanks — have a great day.`,

    loomScript:
`HOOK (0–5 sec):
"Hey, I'm Gio from GR Scale. I just ran a quick audit of ${business_name}'s website and I want to show you one specific thing I found."

PROBLEM (5–20 sec):
"So here's the site — [screen share]. The main issue is ${outreach_angle}."
[Point out: ${w1}]
[Point out: ${w2}]
"When someone searches '${industry.toLowerCase()} ${city.toLowerCase()}' and clicks your site, this is what they see. Most people leave before calling."

DEMO (20–45 sec):
"Here's what I built for another ${industry} company — [show ${demo?.url ?? 'demo site'}]."
"Notice: click-to-call button right at the top, quote form, fast on mobile, reviews section. This is what converts visitors into calls."

CTA (45–60 sec):
"I can build ${business_name} something like this in 7 days. Would love to hop on a 10-minute call and show you the plan."
"Text or call me at [YOUR NUMBER], or just reply to the email I sent. No pressure — just want you to see what's possible."`,
  }
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, id, copied, onCopy }: { text: string; id: string; copied: string | null; onCopy: (t: string, id: string) => void }) {
  const isCopied = copied === id
  return (
    <button onClick={() => onCopy(text, id)}
      className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition shrink-0',
        isCopied
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200')}>
      {isCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {isCopied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── Inner page (uses useSearchParams) ───────────────────────────────────────

function WorkspaceInner() {
  const searchParams   = useSearchParams()
  const defaultLeadId  = searchParams.get('lead') ?? LEADS[0].id

  const [selectedId, setSelectedId] = useState(defaultLeadId)
  const [copied, setCopied]         = useState<string | null>(null)

  const lead     = LEADS.find(l => l.id === selectedId) ?? LEADS[0]
  const messages = useMemo(() => generateMessages(lead), [lead])
  const demo     = DEMO_URL[lead.industry] ?? null

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const TABS = [
    { id: 'email',     label: 'Cold Email',   icon: Mail,           content: messages.coldEmail   },
    { id: 'followup',  label: 'Follow-Up',    icon: Mail,           content: messages.followUp1   },
    { id: 'sms',       label: 'SMS',          icon: MessageSquare,  content: messages.sms         },
    { id: 'voicemail', label: 'Voicemail',    icon: Mic,            content: messages.voicemail   },
    { id: 'loom',      label: 'Loom Script',  icon: Video,          content: messages.loomScript  },
  ]

  const [activeTab, setActiveTab] = useState('email')
  const currentTab = TABS.find(t => t.id === activeTab)!

  return (
    <div className="flex gap-5 min-h-[calc(100vh-120px)]">

      {/* Left: Lead list */}
      <div className="w-64 shrink-0 space-y-1">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-2">Select Lead</p>
        {LEADS.map(l => (
          <button key={l.id} onClick={() => setSelectedId(l.id)}
            className={cn('w-full text-left rounded-xl border px-3 py-3 transition',
              selectedId === l.id
                ? 'border-sky-500/30 bg-sky-500/5'
                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700')}>
            <p className={cn('text-sm font-medium leading-tight', selectedId === l.id ? 'text-sky-400' : 'text-zinc-200')}>
              {l.business_name}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{l.city}, FL</p>
            {l.website_score !== null && (
              <p className="text-[10px] text-amber-400 mt-0.5">Site: {l.website_score}/100</p>
            )}
            {!l.website && (
              <p className="text-[10px] text-red-400/70 mt-0.5">No website</p>
            )}
          </button>
        ))}
        <Link href="/leads" className="flex items-center gap-1.5 px-2 mt-2 text-xs text-zinc-700 hover:text-sky-400 transition">
          All leads <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Right: Workspace */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Lead header */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-zinc-100">{lead.business_name}</h3>
              <p className="text-sm text-zinc-500 mt-0.5">{lead.city}, FL · {lead.industry}</p>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm text-sky-400 hover:underline mt-1">
                  <Phone className="h-3.5 w-3.5" /> {lead.phone}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-400">{formatCurrency(lead.estimated_deal_value)}</span>
              <Link href={`/leads/${lead.id}`} className="btn-ghost text-xs">
                View Lead <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Audit summary */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Website Audit</span>
            </div>
            {lead.website_score !== null ? (
              <span className="text-sm font-bold text-amber-400">{lead.website_score}/100</span>
            ) : (
              <Link href="/audit" className="flex items-center gap-1 text-xs text-amber-400 hover:underline">
                Run Audit <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <p className="text-xs font-semibold text-zinc-300 mb-2">Sales angle: <span className="text-zinc-400 font-normal">{lead.outreach_angle}</span></p>
          <div className="space-y-1">
            {lead.audit_weaknesses.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-red-400 text-xs mt-0.5 shrink-0">✕</span>
                <span className="text-xs text-zinc-500">{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended demo */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-sky-400" />
            <span className="text-sm font-semibold text-zinc-200">Recommended Demo</span>
          </div>
          {demo ? (
            <div className="flex items-center gap-3">
              {demo.live ? (
                <>
                  <a href={demo.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition">
                    <ExternalLink className="h-3.5 w-3.5" /> Open Demo
                  </a>
                  <button onClick={() => copy(demo.url, 'demo-url')}
                    className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition',
                      copied === 'demo-url'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200')}>
                    <Copy className="h-3.5 w-3.5" />
                    {copied === 'demo-url' ? 'Copied!' : 'Copy URL'}
                  </button>
                  <span className="text-xs text-zinc-600">{demo.url}</span>
                </>
              ) : (
                <p className="text-xs text-zinc-600">No {lead.industry} demo built yet. <Link href="/demos" className="text-amber-400 hover:underline">Build it →</Link></p>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-600">No demo for {lead.industry} niche yet. <Link href="/demos" className="text-amber-400 hover:underline">Build it →</Link></p>
          )}
        </div>

        {/* Outreach messages */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn('flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px',
                    activeTab === tab.id
                      ? 'text-sky-400 border-sky-500'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300')}>
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              )
            })}
          </div>

          {/* Message content */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400">{currentTab.label}</span>
              <CopyButton text={currentTab.content} id={`msg-${activeTab}`} copied={copied} onCopy={copy} />
            </div>
            <pre className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans bg-zinc-950/60 rounded-lg p-4 border border-zinc-800/60">
              {currentTab.content}
            </pre>
          </div>
        </div>

        {/* Quick action bar */}
        <div className="flex items-center gap-3 pb-6 flex-wrap">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="btn-primary text-xs">
              <Phone className="h-3.5 w-3.5" /> Call {lead.phone}
            </a>
          )}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
              <ExternalLink className="h-3.5 w-3.5" /> View their site
            </a>
          )}
          <Link href="/audit" className="btn-ghost text-xs">
            <Search className="h-3.5 w-3.5" /> Run Audit
          </Link>
          <Link href={`/leads/${lead.id}`} className="btn-ghost text-xs">
            Full Lead Profile <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Page wrapper (required for useSearchParams) ──────────────────────────────

export default function WorkspacePage() {
  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h2 className="page-title">Outreach Workspace</h2>
          <p className="text-sm text-zinc-600 mt-0.5">Select a lead. Get every asset you need to make contact.</p>
        </div>
      </div>
      <Suspense fallback={<div className="text-sm text-zinc-600">Loading workspace...</div>}>
        <WorkspaceInner />
      </Suspense>
    </div>
  )
}
