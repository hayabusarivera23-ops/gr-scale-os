'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CalendarCheck, CheckCircle2, Copy, FileSearch, Mail, Phone, PlusCircle, Rocket, Trophy } from 'lucide-react'
import { useOS } from '@/lib/store'
import {
  CALENDLY_AUDIT_LINK, GMAIL_DRAFTS_LINK, HVAC_PIPELINE_STAGES,
  HvacPipelineLead, HvacPipelineStage, LOCAL_APPROVALS_KEY, LocalApproval,
  RESPONSE_TEMPLATES, addDaysIso, countsByStage, createApproval, daysSinceIso,
  followupDraftFor, isDraftStale, isDue, mergeResponseTemplate, nextMoneyAction,
  outreachDraftFor, pipelineFromStore, proposalDraftFor, todayIso,
} from '@/lib/business'
import { cn } from '@/lib/utils'

const PIPELINE_KEY = 'gr.pipeline.v1'

const WEAK_SITE_SIGNALS = [
  'No clear call button on mobile',
  'No quote/request form',
  'Outdated footer or old branding',
  'Slow or confusing homepage',
  'No service area listed',
  'No reviews/testimonials visible',
  'No Google Maps/review link',
  'Broken page, image, or form',
]

const WEAK_GBP_SIGNALS = [
  'Few or old photos',
  'No recent Google posts',
  'Missing services/hours',
  'Unanswered reviews',
  'No website or booking link',
  'Weak description',
]

function stageRank(stage: HvacPipelineStage) {
  return HVAC_PIPELINE_STAGES.indexOf(stage)
}

function heatFromSignals(count: number) {
  if (count >= 5) return 3
  if (count >= 3) return 2
  if (count >= 1) return 1
  return 0
}

export default function HvacPipeline() {
  const { data, metrics, ready } = useOS()
  const [leads, setLeads] = useState<HvacPipelineLead[]>([])
  const [copied, setCopied] = useState('')
  const [notice, setNotice] = useState('')
  const [replyLeadId, setReplyLeadId] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyTemplateLabel, setReplyTemplateLabel] = useState(RESPONSE_TEMPLATES[0].label)
  const [replyProblem, setReplyProblem] = useState('')
  const [responseDraft, setResponseDraft] = useState('')
  const [dayKey, setDayKey] = useState('today')
  const [newLead, setNewLead] = useState({ name: '', siteUrl: '', email: '', phone: '', city: 'Tampa', notes: '' })
  const [selectedSignals, setSelectedSignals] = useState<Record<string, boolean>>({})
  const [stageFilter, setStageFilter] = useState<HvacPipelineStage | 'ALL'>('ALL')
  const action = useMemo(() => nextMoneyAction(leads), [leads])
  const stageCounts = useMemo(() => countsByStage(leads), [leads])
  const currentReplyTemplate = useMemo(
    () => RESPONSE_TEMPLATES.find(template => template.label === replyTemplateLabel) ?? RESPONSE_TEMPLATES[0],
    [replyTemplateLabel]
  )
  const sendsToday = leads.filter(lead => lead.stage !== 'LIST' && lead.lastTouch === dayKey).length
  const firstCustomerWon = leads.some(lead => stageRank(lead.stage) >= stageRank('DEPOSIT PAID'))
  const followupsDue = leads.filter(lead => ['SENT', 'PROPOSAL SENT'].includes(lead.stage) && isDue(lead.nextTouch))

  useEffect(() => {
    setDayKey(todayIso())
    try {
      const saved = localStorage.getItem(PIPELINE_KEY)
      if (saved) {
        setLeads(JSON.parse(saved) as HvacPipelineLead[])
        return
      }
    } catch {
      // Local dashboard memory can reset safely.
    }
    if (ready) setLeads(pipelineFromStore(data))
  }, [data, ready])

  useEffect(() => {
    const lead = leads.find(item => item.id === replyLeadId)
    if (!lead) return
    setResponseDraft(mergeResponseTemplate(currentReplyTemplate.body, lead, replyProblem))
  }, [currentReplyTemplate, replyLeadId, replyProblem, leads])

  function save(next: HvacPipelineLead[]) {
    setLeads(next)
    try { localStorage.setItem(PIPELINE_KEY, JSON.stringify(next)) } catch { /* local only */ }
  }

  function setStage(id: string, stage: HvacPipelineStage) {
    const next = leads.map(lead => lead.id === id ? { ...lead, stage, lastTouch: dayKey } : lead)
    save(next)
  }

  function advanceStage(lead: HvacPipelineLead) {
    const index = stageRank(lead.stage)
    const nextStage = HVAC_PIPELINE_STAGES[Math.min(HVAC_PIPELINE_STAGES.length - 1, index + 1)]
    setStage(lead.id, nextStage)
    setNotice(`${lead.name} advanced to ${nextStage}.`)
    window.setTimeout(() => setNotice(''), 1800)
  }

  function pushApproval(approval: LocalApproval) {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_APPROVALS_KEY) || '[]') as LocalApproval[]
      localStorage.setItem(LOCAL_APPROVALS_KEY, JSON.stringify([approval, ...saved].slice(0, 50)))
      setNotice(`${approval.title} added to approvals`)
      window.setTimeout(() => setNotice(''), 2200)
    } catch {
      setNotice('Approval could not be saved locally.')
    }
  }

  function markSent(lead: HvacPipelineLead) {
    const next = leads.map(item => item.id === lead.id ? {
      ...item,
      stage: 'SENT' as const,
      lastTouch: dayKey,
      nextTouch: addDaysIso(3),
    } : item)
    save(next)
    setNotice(`${lead.name} marked sent. Follow-up scheduled in 3 days.`)
    window.setTimeout(() => setNotice(''), 2200)
  }

  function queueFollowup(lead: HvacPipelineLead) {
    pushApproval(createApproval({
      kind: 'followup',
      leadId: lead.id,
      leadName: lead.name,
      title: `Follow-up draft for ${lead.name}`,
      body: followupDraftFor(lead),
      createdBy: 'Follow-Up Assistant',
      href: GMAIL_DRAFTS_LINK,
    }))
  }

  function submitReply(lead: HvacPipelineLead) {
    if (!replyText.trim() && !responseDraft.trim()) return
    pushApproval(createApproval({
      kind: 'reply',
      leadId: lead.id,
      leadName: lead.name,
      title: `Draft response for ${lead.name}`,
      body: `Lead reply from ${lead.name}:\n"${replyText.trim() || 'No pasted reply'}"\n\nSuggested response:\n\n${responseDraft.trim() || mergeResponseTemplate(currentReplyTemplate.body, lead, replyProblem)}`,
      createdBy: 'Sales Assistant',
      href: GMAIL_DRAFTS_LINK,
    }))
    const next = leads.map(item => item.id === lead.id ? { ...item, stage: 'REPLIED' as const, lastTouch: dayKey, notes: `${item.notes ?? ''}\nReply: ${replyText.trim()}`.trim() } : item)
    save(next)
    setReplyLeadId('')
    setReplyText('')
    setReplyProblem('')
    setResponseDraft('')
  }

  function toggleReplyBox(lead: HvacPipelineLead) {
    if (replyLeadId === lead.id) {
      setReplyLeadId('')
      return
    }
    setReplyLeadId(lead.id)
    setReplyText('')
    setReplyProblem(lead.flaws[0] || '')
    setReplyTemplateLabel(RESPONSE_TEMPLATES[0].label)
    setResponseDraft(mergeResponseTemplate(RESPONSE_TEMPLATES[0].body, lead, lead.flaws[0] || ''))
  }

  function queueProposal(lead: HvacPipelineLead) {
    pushApproval(createApproval({
      kind: 'proposal',
      leadId: lead.id,
      leadName: lead.name,
      title: `Proposal for ${lead.name}`,
      body: proposalDraftFor(lead),
      createdBy: 'Proposal Assistant',
      href: '/proposals',
    }))
    setStage(lead.id, 'PROPOSAL SENT')
  }

  function copyCalendly() {
    copyText(CALENDLY_AUDIT_LINK, 'Calendly link copied')
  }

  function copyText(text: string, label: string) {
    navigator.clipboard?.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1800)
  }

  function toggleSignal(signal: string) {
    setSelectedSignals(current => ({ ...current, [signal]: !current[signal] }))
  }

  function addManualLead() {
    const name = newLead.name.trim()
    if (!name) {
      setNotice('Add a business name first.')
      window.setTimeout(() => setNotice(''), 1800)
      return
    }

    const signals = [...WEAK_SITE_SIGNALS, ...WEAK_GBP_SIGNALS].filter(signal => selectedSignals[signal])
    const notes = newLead.notes.trim()
    const lead: HvacPipelineLead = {
      id: `manual-${Date.now()}`,
      name,
      siteUrl: newLead.siteUrl.trim() || undefined,
      email: newLead.email.trim() || undefined,
      phone: newLead.phone.trim() || undefined,
      flaws: signals.length ? signals : [notes || 'Needs a visibility audit'],
      stage: 'LIST',
      draftCreatedAt: dayKey,
      heat: heatFromSignals(signals.length),
      notes: [
        newLead.city.trim() ? `City: ${newLead.city.trim()}` : '',
        notes,
      ].filter(Boolean).join('\n') || undefined,
    }
    save([lead, ...leads])
    setNewLead({ name: '', siteUrl: '', email: '', phone: '', city: 'Tampa', notes: '' })
    setSelectedSignals({})
    setNotice(`${name} added to pipeline. Draft is ready in Send Desk.`)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const nextLead = [...leads]
    .filter(lead => lead.stage === 'LIST')
    .sort((a, b) => (b.heat ?? 0) - (a.heat ?? 0))[0]
  const overdueLead = followupsDue[0]
  const sendDeskLead = overdueLead ?? nextLead
  const visibleLeads = (stageFilter === 'ALL' ? leads : leads.filter(lead => lead.stage === stageFilter)).slice(0, 8)

  return (
    <section id="pipeline" className="space-y-4">
      <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">Next Money Action</p>
            <h2 className="mt-1 text-xl font-black text-white">{action.sentence}</h2>
            <p className="mt-2 text-sm text-zinc-500">
              First customer focus: HVAC website audit, proposal, deposit, launch, then $99/mo maintenance.
            </p>
          </div>
          <Link
            href={action.href}
            target={action.href.startsWith('http') ? '_blank' : undefined}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-400"
          >
            {action.buttonLabel} <Rocket className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">First Customer Pipeline</p>
            <p className="mt-1 text-sm font-semibold text-zinc-300">Move every lead one stage closer to deposit paid.</p>
          </div>
          <div className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black',
            firstCustomerWon ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          )}>
            <Trophy className="h-3.5 w-3.5" />
            {firstCustomerWon ? 'First customer won' : 'First deposit pending'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {stageCounts.map(item => (
            <button
              key={item.stage}
              onClick={() => setStageFilter(stageFilter === item.stage ? 'ALL' : item.stage)}
              className={cn(
                'rounded-lg border p-3 text-left transition hover:border-sky-500/35',
                stageFilter === item.stage ? 'border-emerald-500/50 bg-emerald-500/10' : item.stage === action.stage ? 'border-sky-500/50 bg-sky-500/10' : 'border-zinc-800 bg-black/20'
              )}
            >
              <p className="text-lg font-black text-white">{item.count}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">{item.stage}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-black text-white">Send Desk</p>
          </div>
          <p className="mt-3 text-4xl font-black text-emerald-300">{sendsToday}/10</p>
          <p className="mt-1 text-xs text-zinc-500">Sends today. Definition of progress: ten approved outreach taps.</p>
          {sendDeskLead ? (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-black/25 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">{sendDeskLead.name}</p>
                  <p className="mt-1 text-[11px] font-bold text-zinc-500">
                    {overdueLead ? `Follow-up due ${sendDeskLead.nextTouch}` : `Heat ${sendDeskLead.heat ?? 0}/3 - next unsent`}
                  </p>
                </div>
                <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-black text-zinc-500">{sendDeskLead.stage}</span>
              </div>
              <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-400">
                {overdueLead ? followupDraftFor(sendDeskLead) : outreachDraftFor(sendDeskLead)}
              </pre>
              {!overdueLead && isDraftStale(sendDeskLead) && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Draft going stale. This has been sitting {daysSinceIso(sendDeskLead.draftCreatedAt)} days. Refresh it or send it today.
                </div>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <a href={GMAIL_DRAFTS_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-400">
                  Open in Gmail
                </a>
                <button
                  onClick={() => copyText(overdueLead ? followupDraftFor(sendDeskLead) : outreachDraftFor(sendDeskLead), overdueLead ? 'Follow-up copied' : 'Outreach draft copied')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  <Copy className="h-4 w-4" /> Copy draft
                </button>
                {overdueLead ? (
                  <button onClick={() => queueFollowup(sendDeskLead)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-300 transition hover:bg-amber-500/20">
                    Add follow-up approval
                  </button>
                ) : (
                  <button onClick={() => markSent(sendDeskLead)} className="rounded-lg border border-zinc-700 px-4 py-3 text-sm font-black text-zinc-300 transition hover:border-emerald-500/40 hover:text-white">
                    Mark sent
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-black/25 p-3">
              <p className="text-sm font-bold text-zinc-300">No unsent HVAC leads loaded yet.</p>
              <Link href="/discover" className="mt-3 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-white">Find HVAC Leads</Link>
            </div>
          )}
          <div className="mt-3 text-xs font-bold text-emerald-300">
            {notice}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Pipeline Detail</p>
              <p className="mt-1 text-sm font-semibold text-zinc-300">Closed by default later; visible now while we build the system.</p>
            </div>
            <p className="text-xs text-zinc-600">{metrics.activeClients} active clients</p>
          </div>
          <div className="mb-3 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-sky-400" />
              <p className="text-sm font-black text-white">Lead Intake Scanner</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                value={newLead.name}
                onChange={event => setNewLead({ ...newLead, name: event.target.value })}
                placeholder="Business name"
                className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
              />
              <input
                value={newLead.siteUrl}
                onChange={event => setNewLead({ ...newLead, siteUrl: event.target.value })}
                placeholder="Website or Google profile"
                className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
              />
              <input
                value={newLead.email}
                onChange={event => setNewLead({ ...newLead, email: event.target.value })}
                placeholder="Email"
                className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
              />
              <input
                value={newLead.phone}
                onChange={event => setNewLead({ ...newLead, phone: event.target.value })}
                placeholder="Phone"
                className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
              />
            </div>
            <textarea
              value={newLead.notes}
              onChange={event => setNewLead({ ...newLead, notes: event.target.value })}
              placeholder="Specific problem you noticed, or paste Claude/Google notes..."
              className="mt-2 min-h-20 w-full resize-none rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
            />
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {[['Website signals', WEAK_SITE_SIGNALS], ['Google signals', WEAK_GBP_SIGNALS]].map(([label, signals]) => (
                <div key={label as string}>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">{label as string}</p>
                  <div className="flex flex-wrap gap-2">
                    {(signals as string[]).map(signal => (
                      <button
                        key={signal}
                        onClick={() => toggleSignal(signal)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-[11px] font-bold transition',
                          selectedSignals[signal] ? 'border-sky-500/40 bg-sky-500/15 text-sky-200' : 'border-zinc-800 bg-black/25 text-zinc-500 hover:text-zinc-300'
                        )}
                      >
                        {signal}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addManualLead} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-black text-white transition hover:bg-sky-400">
              <PlusCircle className="h-4 w-4" /> Add lead and generate draft
            </button>
          </div>
          <div className="space-y-2">
            {visibleLeads.map(lead => (
              <div key={lead.id} className="rounded-lg border border-zinc-800 bg-black/20 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-white">{lead.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{lead.siteUrl ?? lead.email ?? lead.phone ?? 'Add contact info'}</p>
                  </div>
                  <select
                    value={lead.stage}
                    onChange={event => setStage(lead.id, event.target.value as HvacPipelineStage)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs font-bold text-zinc-300 outline-none"
                  >
                    {HVAC_PIPELINE_STAGES.map(stage => <option key={stage}>{stage}</option>)}
                  </select>
                </div>
                {lead.flaws[0] && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">{lead.flaws[0]}</p>}
                {isDraftStale(lead) && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] font-black text-amber-100">
                    <AlertTriangle className="h-3.5 w-3.5" /> Draft going stale - refresh or send
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={GMAIL_DRAFTS_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white">
                    <Mail className="h-3.5 w-3.5" /> Open draft
                  </a>
                  <button onClick={() => copyText(outreachDraftFor(lead), 'Outreach draft copied')} className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white">
                    <Copy className="h-3.5 w-3.5" /> Copy draft
                  </button>
                  <button onClick={() => toggleReplyBox(lead)} className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white">Log reply</button>
                  <button onClick={() => advanceStage(lead)} className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20">Advance stage</button>
                  <button onClick={copyCalendly} className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white">
                    <Copy className="h-3.5 w-3.5" /> Book call
                  </button>
                  <button onClick={() => queueProposal(lead)} className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white">Generate proposal</button>
                  <button onClick={() => setStage(lead.id, 'DEPOSIT PAID')} className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Deposit paid
                  </button>
                  {lead.phone && <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white"><Phone className="h-3.5 w-3.5" /> Call</a>}
                  <button onClick={() => setStage(lead.id, 'LIVE/MAINTENANCE')} className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white">Live</button>
                </div>
                {replyLeadId === lead.id && (
                  <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <textarea
                      value={replyText}
                      onChange={event => setReplyText(event.target.value)}
                      placeholder="Paste what they replied..."
                      className="min-h-24 w-full resize-none rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
                    />
                    <div className="mt-3 grid gap-2 sm:grid-cols-[0.8fr_1.2fr]">
                      <select
                        value={replyTemplateLabel}
                        onChange={event => setReplyTemplateLabel(event.target.value)}
                        className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm font-bold text-zinc-200 outline-none"
                      >
                        {RESPONSE_TEMPLATES.map(template => <option key={template.label}>{template.label}</option>)}
                      </select>
                      <input
                        value={replyProblem}
                        onChange={event => setReplyProblem(event.target.value)}
                        placeholder="Specific problem to mention"
                        className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
                      />
                    </div>
                    <textarea
                      value={responseDraft}
                      onChange={event => setResponseDraft(event.target.value)}
                      placeholder="Edit the response before it goes into approvals..."
                      className="mt-3 min-h-28 w-full resize-none rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
                    />
                    <button onClick={() => submitReply(lead)} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-black text-white hover:bg-sky-400">
                      <CalendarCheck className="h-3.5 w-3.5" /> Create response approval
                    </button>
                  </div>
                )}
              </div>
            ))}
            {leads.length === 0 && <p className="text-sm text-zinc-600">No HVAC leads yet. Start with Lead Discovery.</p>}
          </div>
          {copied && <p className="mt-3 text-xs font-bold text-emerald-400">{copied}</p>}
        </div>
      </div>
    </section>
  )
}
