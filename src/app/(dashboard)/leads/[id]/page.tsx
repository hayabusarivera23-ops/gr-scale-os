'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Mail, ExternalLink, Star, Calendar, Clock,
  Edit3, Plus, CheckCircle, Circle, Copy, Send, Zap, Globe,
} from 'lucide-react'
import { cn, formatCurrency, formatDate, getStatusColor, getLeadScoreColor } from '@/lib/utils'
import { demoForIndustry } from '@/lib/demos'

// ─── Seed data ───────────────────────────────────────────────────────────────
// Includes audit fields so the Outreach tab has real data to work with.

// Day 1 — Cool Coast is a research-stage lead. No calls made, no emails sent.
// Run the audit (/audit) first, then return here to use the Outreach tab.
const LEAD = {
  id: '1', business_name: 'Cool Coast Heating & Cooling', owner_name: '',
  phone: '(941) 623-4518', email: 'office@coolcoast.net', website: 'https://coolcoast.net',
  industry: 'HVAC', city: 'Sarasota', state: 'FL', status: 'New',
  lead_source: 'Google Maps', lead_score: 92, estimated_deal_value: 750,
  notes: 'Hibu template. Placeholder 555 phone on homepage. Expired coupons. No click-to-call. Run audit before calling.',
  call_notes: '',
  website_notes: '',
  pain_points: '',
  opportunity_notes: '',
  proposal_notes: '',
  last_contact_date: null as string | null,
  next_follow_up: null as string | null,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  // Audit results — null until you run the audit at /audit
  website_score: null as number | null,
  opportunity_score: null as number | null,
  audit_weaknesses: [] as string[],
  outreach_angle: '',
}

const TASKS = [
  { id: '1', title: 'Send Loom audit video', completed: false, priority: 'High', due_date: new Date().toISOString().split('T')[0] },
  { id: '2', title: 'Follow up call if no response', completed: false, priority: 'High', due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] },
  { id: '3', title: 'Research owner name on Google', completed: true, priority: 'Medium', due_date: null },
]

// Day 1 — no activity logged yet
const ACTIVITY: { id: string; type: string; description: string; created_at: string }[] = []

// ─── Outreach types ───────────────────────────────────────────────────────────

type OutreachStatus = 'Not Sent' | 'Sent' | 'Replied' | 'Interested' | 'Meeting Scheduled'

interface OutreachItem {
  key: string
  label: string
  icon: string
  content: string
}

interface OutreachLog {
  id: string
  type: string
  sentAt: string
  status: OutreachStatus
  note?: string
}

const OUTREACH_STATUSES: OutreachStatus[] = ['Not Sent', 'Sent', 'Replied', 'Interested', 'Meeting Scheduled']

const STATUS_COLORS: Record<OutreachStatus, string> = {
  'Not Sent': 'text-zinc-500 bg-zinc-800 border-zinc-700',
  'Sent': 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  'Replied': 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  'Interested': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Meeting Scheduled': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
}

// ─── Demo library — REAL deployed Demo Factory URLs (src/lib/demos.ts) ───────

type DemoStatus = 'Not Sent' | 'Sent' | 'Viewed' | 'Discussed'

const DEMO_STATUS_COLORS: Record<DemoStatus, string> = {
  'Not Sent':  'text-zinc-500 bg-zinc-800 border-zinc-700',
  'Sent':      'text-sky-400 bg-sky-500/10 border-sky-500/30',
  'Viewed':    'text-violet-400 bg-violet-500/10 border-violet-500/30',
  'Discussed': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
}

const DEMO_STATUSES: DemoStatus[] = ['Not Sent', 'Sent', 'Viewed', 'Discussed']

// ─── Generate outreach from lead data ─────────────────────────────────────────

function generateOutreach(lead: typeof LEAD): OutreachItem[] {
  const name = lead.business_name
  const score = lead.website_score
  const opp = lead.opportunity_score
  const city = lead.city
  const industry = lead.industry
  const angle = lead.outreach_angle
  const weakness1 = lead.audit_weaknesses[0] ?? 'significant website issues'
  const weakness2 = lead.audit_weaknesses[1] ?? 'poor mobile experience'

  return [
    {
      key: 'cold_email',
      label: 'Cold Email',
      icon: '✉️',
      content: `Subject: Issue I found on ${name}'s website

Hey,

I was looking up ${industry} companies in ${city} and ran a quick audit of ${lead.website ?? 'your site'}.

Your site scored ${score}/100 — mainly because ${angle}.

That means customers are finding you on Google, clicking your site, and not being able to reach you.

I build fast, mobile-first websites for ${industry} companies in Florida. I made a 60-second video showing exactly what I found and what I'd fix.

Can I send it to you?

— Gio Rivera, GR Scale
[your phone]`,
    },
    {
      key: 'follow_up_1',
      label: 'Follow-Up #1 (Day 1)',
      icon: '📩',
      content: `Subject: Re: ${name}'s website

Hey — bumping this up in case it got buried.

${name}'s website scored ${score}/100. The issue I flagged: ${weakness1}.

This means customers are choosing a competitor with a working site.

I build websites specifically for ${industry} companies — mobile-first, click-to-call, quote form, done in 7 days.

Would a 10-minute call make sense? I'll pull up your site on screen and show you the fixes.

— Gio`,
    },
    {
      key: 'follow_up_2',
      label: 'Follow-Up #2 (Day 3)',
      icon: '📨',
      content: `Hey — last follow-up on this.

I put together a free homepage mockup for ${name} based on the audit.

You keep it whether we work together or not. If you like what you see, we talk.

Just reply "send it" and I'll get it to you today.

— Gio, GR Scale`,
    },
    {
      key: 'sms',
      label: 'SMS / Text',
      icon: '💬',
      content: `Hey, Gio here — GR Scale. I audited ${name}'s website and it scored ${score}/100. Main issue: ${weakness1}. Made a 60-sec video showing the fix. Can I text you the link?`,
    },
    {
      key: 'voicemail',
      label: 'Voicemail Script',
      icon: '📞',
      content: `Hey, this is Gio calling for the owner of ${name}. I build websites for ${industry} companies in Florida, and I ran an audit of your site — it scored ${score} out of 100.

The main issue I found: ${weakness1}.

I made a 1-minute video walking through exactly what's happening and how I'd fix it. Can I text it to you?

My number is [YOUR NUMBER]. Again, that's [YOUR NUMBER].

Thanks — talk soon.`,
    },
  ]
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Outreach', 'Call Notes', 'Website Review', 'Pain Points', 'Opportunity', 'Proposal', 'Tasks', 'Activity']

const typeIcon: Record<string, string> = {
  call: '📞', email: '✉️', note: '📝', meeting: '🤝', stage_change: '⬆️', task: '✅'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadDetailPage({ params: _params }: { params: Promise<{ id: string }> }) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [tasks, setTasks] = useState(TASKS)
  const [newTask, setNewTask] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [outreachStatuses, setOutreachStatuses] = useState<Record<string, OutreachStatus>>(
    () => ({ cold_email: 'Not Sent', follow_up_1: 'Not Sent', follow_up_2: 'Not Sent', sms: 'Not Sent', voicemail: 'Not Sent' })
  )
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([])
  const [attachedDemo, setAttachedDemo] = useState<string | null>(null)
  const [demoStatus, setDemoStatus] = useState<DemoStatus>('Not Sent')
  const [demoAttachedAt, setDemoAttachedAt] = useState<string | null>(null)

  const outreachItems = useMemo(() => generateOutreach(LEAD), [])
  const matchedDemo = demoForIndustry(LEAD.industry)
  const recommendedDemo = {
    label: `${matchedDemo.industry} Demo Site (Live)`,
    url: matchedDemo.url,
    description: matchedDemo.useCase,
  }

  function toggleTask(id: string) {
    setTasks(t => t.map(task => task.id === id ? { ...task, completed: !task.completed } : task))
  }

  function addTask() {
    if (!newTask.trim()) return
    setTasks(t => [...t, { id: Date.now().toString(), title: newTask, completed: false, priority: 'Medium', due_date: null }])
    setNewTask('')
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function markSent(key: string, label: string) {
    setOutreachStatuses(prev => ({ ...prev, [key]: 'Sent' }))
    const log: OutreachLog = { id: Date.now().toString(), type: label, sentAt: new Date().toISOString(), status: 'Sent' }
    setOutreachLogs(prev => [log, ...prev])
  }

  function setStatus(key: string, status: OutreachStatus) {
    setOutreachStatuses(prev => ({ ...prev, [key]: status }))
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Back + header */}
      <div>
        <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{LEAD.business_name}</h2>
            <p className="text-sm text-zinc-500">{LEAD.city}, {LEAD.state} · {LEAD.industry} · {LEAD.lead_source}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('badge', getStatusColor(LEAD.status))}>{LEAD.status}</span>
            <div className="flex items-center gap-1">
              <Star className={cn('h-4 w-4', getLeadScoreColor(LEAD.lead_score))} />
              <span className={cn('text-sm font-bold', getLeadScoreColor(LEAD.lead_score))}>{LEAD.lead_score}</span>
            </div>
            <span className="text-sm font-semibold text-zinc-100">{formatCurrency(LEAD.estimated_deal_value)}</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2">
        {LEAD.phone && (
          <a href={`tel:${LEAD.phone}`} className="btn-primary text-xs">
            <Phone className="h-3.5 w-3.5" /> Call {LEAD.phone}
          </a>
        )}
        {LEAD.email && (
          <a href={`mailto:${LEAD.email}`} className="btn-ghost text-xs">
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
        )}
        {LEAD.website && (
          <a href={LEAD.website} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
            <ExternalLink className="h-3.5 w-3.5" /> View Site
          </a>
        )}
        <button onClick={() => setActiveTab('Outreach')} className="btn-ghost text-xs text-amber-400 border border-amber-500/30 hover:bg-amber-500/10">
          <Zap className="h-3.5 w-3.5" /> Outreach
        </button>
        <button className="btn-ghost text-xs"><Calendar className="h-3.5 w-3.5" /> Log Call</button>
        <button className="btn-ghost text-xs"><Edit3 className="h-3.5 w-3.5" /> Edit Lead</button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Last Contact', value: formatDate(LEAD.last_contact_date), icon: Clock },
          { label: 'Next Follow Up', value: formatDate(LEAD.next_follow_up), icon: Calendar },
          { label: 'Website Score', value: LEAD.website_score !== null ? `${LEAD.website_score}/100` : 'Not audited', icon: Star },
          { label: 'Opportunity Score', value: LEAD.opportunity_score !== null ? `${LEAD.opportunity_score}/100` : 'Not audited', icon: Star },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-sm font-semibold text-zinc-100 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap',
                activeTab === tab
                  ? tab === 'Outreach' ? 'border-amber-400 text-amber-400' : 'border-sky-500 text-sky-400'
                  : tab === 'Outreach' ? 'border-transparent text-amber-500/60 hover:text-amber-400' : 'border-transparent text-zinc-500 hover:text-zinc-300')}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className={cn('rounded-xl border bg-zinc-900/60 p-5', activeTab === 'Outreach' ? 'border-amber-500/20' : 'border-zinc-800')}>

        {/* ── OUTREACH TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'Outreach' && (
          <div className="space-y-6">

            {/* Audit summary banner */}
            {LEAD.website_score !== null ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-4 flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-0.5">Website Score</p>
                  <p className={cn('text-2xl font-bold', LEAD.website_score < 40 ? 'text-red-400' : 'text-amber-400')}>{LEAD.website_score}<span className="text-sm text-zinc-600">/100</span></p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-0.5">Opportunity</p>
                  <p className="text-2xl font-bold text-sky-400">{LEAD.opportunity_score}<span className="text-sm text-zinc-600">/100</span></p>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs text-zinc-500 mb-1.5">Top Issues Found</p>
                  <ul className="space-y-0.5">
                    {LEAD.audit_weaknesses.slice(0, 3).map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-400">
                        <span className="text-red-400 shrink-0 mt-0.5">✗</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/audit" className="btn-ghost text-xs shrink-0">
                  <Zap className="h-3.5 w-3.5" /> Re-run Audit
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber-400">No audit yet</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Run the 3-minute audit to get your sales angle, website score, and personalized outreach before you call.</p>
                </div>
                <Link href="/audit" className="btn-primary text-xs shrink-0">
                  <Zap className="h-3.5 w-3.5" /> Run Audit Now
                </Link>
              </div>
            )}

            {/* Generated outreach messages */}
            <div>
              <h3 className="section-title mb-3">Generated Outreach</h3>
              <div className="space-y-3">
                {outreachItems.map(item => {
                  const status = outreachStatuses[item.key]
                  return (
                    <div key={item.key} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                      {/* Message header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <span className="text-sm font-semibold text-zinc-200">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Status dropdown */}
                          <select
                            value={status}
                            onChange={e => setStatus(item.key, e.target.value as OutreachStatus)}
                            className={cn('rounded-md border px-2 py-1 text-xs font-medium bg-transparent cursor-pointer outline-none', STATUS_COLORS[status])}>
                            {OUTREACH_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900 text-zinc-200">{s}</option>)}
                          </select>
                          {/* Copy */}
                          <button onClick={() => copy(item.content, item.key)}
                            className={cn('btn-ghost text-xs py-1', copied === item.key ? 'text-emerald-400' : '')}>
                            <Copy className="h-3.5 w-3.5" />
                            {copied === item.key ? 'Copied!' : 'Copy'}
                          </button>
                          {/* Mark sent */}
                          {status === 'Not Sent' && (
                            <button onClick={() => markSent(item.key, item.label)} className="btn-primary text-xs py-1">
                              <Send className="h-3.5 w-3.5" /> Mark Sent
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Message body */}
                      <pre className="px-4 py-4 text-xs text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed max-h-52 overflow-y-auto">{item.content}</pre>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recommended Demo */}
            <div>
              <h3 className="section-title mb-3">Recommended Demo</h3>
              {recommendedDemo ? (
                <div className={cn('rounded-xl border p-5 transition', attachedDemo ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-sky-500/20 bg-sky-500/5')}>
                  {/* Demo info row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', attachedDemo ? 'bg-emerald-500/20' : 'bg-sky-500/20')}>
                        <Globe className={cn('h-5 w-5', attachedDemo ? 'text-emerald-400' : 'text-sky-400')} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-zinc-100">{recommendedDemo.label}</p>
                          {attachedDemo && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.5">
                              Attached
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 max-w-sm">{recommendedDemo.description}</p>
                        <a href={recommendedDemo.url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline mt-1.5">
                          <ExternalLink className="h-3 w-3" /> {recommendedDemo.url}
                        </a>
                        {demoAttachedAt && (
                          <p className="text-[10px] text-zinc-600 mt-1">Attached {new Date(demoAttachedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Demo status */}
                      {attachedDemo && (
                        <select
                          value={demoStatus}
                          onChange={e => setDemoStatus(e.target.value as DemoStatus)}
                          className={cn('rounded-md border px-2 py-1 text-xs font-medium bg-transparent cursor-pointer outline-none', DEMO_STATUS_COLORS[demoStatus])}>
                          {DEMO_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900 text-zinc-200">{s}</option>)}
                        </select>
                      )}

                      {!attachedDemo ? (
                        <button onClick={() => { setAttachedDemo(LEAD.industry); setDemoAttachedAt(new Date().toISOString()) }} className="btn-primary text-xs">
                          <Plus className="h-3.5 w-3.5" /> Attach Demo
                        </button>
                      ) : (
                        <button onClick={() => { setDemoStatus('Sent'); markSent('demo', 'Demo Sent') }} className="btn-primary text-xs">
                          <Send className="h-3.5 w-3.5" /> Mark Sent
                        </button>
                      )}

                      <a href={recommendedDemo.url} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
                        <Globe className="h-3.5 w-3.5" /> Open Demo
                      </a>

                      <button onClick={() => copy(recommendedDemo.url, 'demo_url')} className={cn('btn-ghost text-xs', copied === 'demo_url' ? 'text-emerald-400' : '')}>
                        <Copy className="h-3.5 w-3.5" />
                        {copied === 'demo_url' ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  </div>

                  {/* Status hint after attaching */}
                  {attachedDemo && demoStatus === 'Not Sent' && (
                    <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400">
                      Demo attached. Copy the URL and drop it in your Follow-Up #2 message, then click "Mark Sent."
                    </div>
                  )}
                  {demoStatus === 'Viewed' && (
                    <div className="mt-3 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-xs text-violet-400">
                      They viewed it — call within 24 hours. Strike while the iron is hot.
                    </div>
                  )}
                  {demoStatus === 'Discussed' && (
                    <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400">
                      Demo discussed. Next step: send proposal or close on this call.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
                  <p className="text-sm text-zinc-500">No demo site for {LEAD.industry} yet.</p>
                  <Link href="/demos" className="text-xs text-sky-400 hover:underline mt-1 inline-block">Build one in Demo Sites →</Link>
                </div>
              )}
            </div>

            {/* Outreach history log */}
            {outreachLogs.length > 0 && (
              <div>
                <h3 className="section-title mb-3">Outreach History</h3>
                <div className="rounded-xl border border-zinc-800 divide-y divide-zinc-800/60 overflow-hidden">
                  {outreachLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{log.type === 'Cold Email' || log.type.includes('Follow') ? '✉️' : '📞'}</span>
                        <div>
                          <p className="text-sm text-zinc-200 font-medium">{log.type}</p>
                          <p className="text-xs text-zinc-600">{new Date(log.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <span className={cn('rounded border px-2 py-0.5 text-xs font-medium', STATUS_COLORS[log.status])}>{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'Overview' && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <h3 className="section-title">Business Information</h3>
              {[
                ['Business Name', LEAD.business_name],
                ['Owner', LEAD.owner_name ?? '—'],
                ['Phone', LEAD.phone ?? '—'],
                ['Email', LEAD.email ?? '—'],
                ['Website', LEAD.website ?? '—'],
                ['Industry', LEAD.industry],
                ['Location', `${LEAD.city}, ${LEAD.state}`],
                ['Lead Source', LEAD.lead_source],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-start gap-4 text-sm">
                  <span className="text-zinc-500 shrink-0 w-28">{label}</span>
                  <span className="text-zinc-200 text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="section-title">Quick Notes</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{LEAD.notes}</p>
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs font-semibold text-amber-400 mb-1">Key Outreach Angle</p>
                <p className="text-xs text-zinc-300">Site still shows 555-555-5555 placeholder phone. Lead with: "I noticed your site lists a wrong phone number — customers might be calling a dead line." Then offer the free Loom audit.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Call Notes' && (
          <div className="space-y-3">
            <h3 className="section-title">Call Notes</h3>
            <textarea className="input-base min-h-[180px] resize-none" defaultValue={LEAD.call_notes ?? ''} placeholder="Log what happened on the call..." />
            <button className="btn-primary text-xs">Save Notes</button>
          </div>
        )}

        {activeTab === 'Website Review' && (
          <div className="space-y-3">
            <h3 className="section-title">Website Audit Notes</h3>
            <textarea className="input-base min-h-[180px] resize-none" defaultValue={LEAD.website_notes ?? ''} placeholder="Document site issues found..." />
            <button className="btn-primary text-xs">Save Notes</button>
          </div>
        )}

        {activeTab === 'Pain Points' && (
          <div className="space-y-3">
            <h3 className="section-title">Pain Points</h3>
            <textarea className="input-base min-h-[180px] resize-none" defaultValue={LEAD.pain_points ?? ''} placeholder="What problems is this business experiencing?" />
            <button className="btn-primary text-xs">Save Notes</button>
          </div>
        )}

        {activeTab === 'Opportunity' && (
          <div className="space-y-3">
            <h3 className="section-title">Opportunity Analysis</h3>
            <textarea className="input-base min-h-[180px] resize-none" defaultValue={LEAD.opportunity_notes ?? ''} placeholder="What is the opportunity here?" />
            <button className="btn-primary text-xs">Save Notes</button>
          </div>
        )}

        {activeTab === 'Proposal' && (
          <div className="space-y-3">
            <h3 className="section-title">Proposal Notes</h3>
            <textarea className="input-base min-h-[180px] resize-none" defaultValue={LEAD.proposal_notes ?? ''} placeholder="Package, scope, price, timeline..." />
            <button className="btn-primary text-xs">Save Notes</button>
          </div>
        )}

        {activeTab === 'Tasks' && (
          <div className="space-y-4">
            <h3 className="section-title">Lead Tasks</h3>
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className={cn('flex items-center gap-3 rounded-lg border p-3 transition', task.completed ? 'border-zinc-800/50 opacity-50' : 'border-zinc-800 bg-zinc-800/30')}>
                  <button onClick={() => toggleTask(task.id)} className="shrink-0">
                    {task.completed ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-zinc-600" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', task.completed ? 'line-through text-zinc-600' : 'text-zinc-200')}>{task.title}</p>
                    {task.due_date && <p className="text-xs text-zinc-600">{formatDate(task.due_date)}</p>}
                  </div>
                  <span className={cn('badge', getStatusColor(task.priority))}>{task.priority}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-base flex-1" placeholder="Add a task..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
              <button onClick={addTask} className="btn-primary text-xs"><Plus className="h-4 w-4" /> Add</button>
            </div>
          </div>
        )}

        {activeTab === 'Activity' && (
          <div className="space-y-3">
            <h3 className="section-title">Activity Timeline</h3>
            <div className="space-y-3">
              {ACTIVITY.map(a => (
                <div key={a.id} className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm shrink-0">{typeIcon[a.type]}</div>
                  <div className="flex-1 rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3">
                    <p className="text-sm text-zinc-300">{a.description}</p>
                    <p className="text-xs text-zinc-600 mt-1">{new Date(a.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
