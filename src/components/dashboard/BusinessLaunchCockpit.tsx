'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, Copy, ExternalLink,
  Megaphone, MessageSquareReply, RadioTower, ShieldCheck, Sparkles, Target,
} from 'lucide-react'
import { RESPONSE_TEMPLATES, mergeResponseTemplate } from '@/lib/business'
import { cn } from '@/lib/utils'

const CLAUDE_REPORT_KEY = 'gr.claude-operator-report.v1'
const LAUNCH_CHECKLIST_KEY = 'gr.launch-checklist.v1'

const OPERATOR_CADENCE = [
  { time: '6:45 AM', label: 'Gio OS Personal Coach', output: 'workout, fuel, recovery, paste-ready plan' },
  { time: '7:00 AM', label: 'Morning Operator', output: '#1 money action, 5 leads, outreach drafts' },
  { time: '4:00 PM', label: 'Follow-Up Manager', output: 'who to follow up, what to say, why now' },
  { time: '6:30 PM', label: 'Content Kit Builder', output: 'one post kit, caption, CTA, script' },
  { time: '8:00 PM', label: 'Growth Strategist', output: 'beyond-websites visibility move' },
  { time: '9:30 PM', label: 'Night Recap', output: 'revenue truth, tomorrow opener' },
]

const LAUNCH_ITEMS = [
  'Send 10 approved outreach messages',
  'Have free audit booking link ready',
  'Have 60-second audit script ready',
  'Have example/demo link ready',
  'Have pricing answer ready',
  'Have proposal/deposit next step ready',
  'Have reply templates ready',
  'Log every reply in the dashboard',
]

const SERVICE_LADDER = [
  { name: 'Presence Fix', price: '$300+', detail: 'GBP, photos, CTA cleanup, profile trust signals' },
  { name: 'Website Build', price: '$500+', detail: 'fast site built to make the phone ring' },
  { name: 'Local SEO', price: '$200/mo+', detail: 'pages, keywords, GBP, citations, tracking' },
  { name: 'Maintenance', price: '$99/mo+', detail: 'updates, edits, hosting, monthly report' },
]

type ReportKey = 'money' | 'leads' | 'approval' | 'risk' | 'next'

const REPORT_HEADINGS: Record<ReportKey, string[]> = {
  money: ["TODAY'S #1 MONEY ACTION", '#1 MONEY ACTION', '1 MONEY ACTION'],
  leads: ['NEW LEADS', 'LEADS FOUND'],
  approval: ['GIO APPROVAL REQUIRED', 'APPROVAL REQUIRED', 'GIO APPROVAL'],
  risk: ["TODAY'S REVENUE RISK", 'REVENUE RISK'],
  next: ['WHAT GIO SHOULD DO NEXT', 'NEXT MOVE', 'TOMORROW'],
}

const REPORT_CARDS: { key: ReportKey, label: string, tone: string }[] = [
  { key: 'money', label: '#1 Money Action', tone: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100' },
  { key: 'approval', label: 'Needs Gio Approval', tone: 'border-amber-400/25 bg-amber-400/10 text-amber-100' },
  { key: 'risk', label: 'Revenue Risk', tone: 'border-rose-400/25 bg-rose-400/10 text-rose-100' },
  { key: 'leads', label: 'New Leads', tone: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100' },
]

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function normalizeReportLine(line: string) {
  return line.replaceAll('*', '').replace(/^[-#\s]+/, '').trim()
}

function reportHeadingFor(line: string): ReportKey | null {
  const upper = normalizeReportLine(line).toUpperCase()
  const match = (Object.entries(REPORT_HEADINGS) as [ReportKey, string[]][])
    .find(([, labels]) => labels.some(label => upper.startsWith(label)))
  return match?.[0] ?? null
}

function parseClaudeReport(report: string): Record<ReportKey, string> {
  const parsed: Record<ReportKey, string[]> = { money: [], leads: [], approval: [], risk: [], next: [] }
  let active: ReportKey | null = null

  report.split(/\r?\n/).forEach(rawLine => {
    const line = normalizeReportLine(rawLine)
    if (!line) return
    const heading = reportHeadingFor(line)
    if (heading) {
      active = heading
      const afterColon = line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : ''
      if (afterColon) parsed[heading].push(afterColon)
      return
    }
    if (/^[A-Z0-9 '#/&-]{6,}:$/.test(line)) {
      active = null
      return
    }
    if (active) parsed[active].push(line)
  })

  return {
    money: parsed.money.slice(0, 4).join('\n'),
    leads: parsed.leads.slice(0, 8).join('\n'),
    approval: parsed.approval.slice(0, 5).join('\n'),
    risk: parsed.risk.slice(0, 4).join('\n'),
    next: parsed.next.slice(0, 5).join('\n'),
  }
}

export default function BusinessLaunchCockpit() {
  const [report, setReport] = useState('')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [selectedTemplate, setSelectedTemplate] = useState(RESPONSE_TEMPLATES[0].label)
  const [mergeName, setMergeName] = useState('')
  const [mergeProblem, setMergeProblem] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [copied, setCopied] = useState('')
  const currentTemplate = useMemo(
    () => RESPONSE_TEMPLATES.find(item => item.label === selectedTemplate) ?? RESPONSE_TEMPLATES[0],
    [selectedTemplate]
  )
  const parsedReport = useMemo(() => parseClaudeReport(report), [report])
  const done = LAUNCH_ITEMS.filter(item => checklist[item]).length
  const readyPct = Math.round((done / LAUNCH_ITEMS.length) * 100)

  useEffect(() => {
    try {
      setReport(localStorage.getItem(CLAUDE_REPORT_KEY) || '')
      setChecklist(JSON.parse(localStorage.getItem(LAUNCH_CHECKLIST_KEY) || '{}') as Record<string, boolean>)
    } catch {
      setReport('')
      setChecklist({})
    }
  }, [])

  useEffect(() => {
    setReplyDraft(mergeResponseTemplate(currentTemplate.body, { name: mergeName || undefined }, mergeProblem))
  }, [currentTemplate, mergeName, mergeProblem])

  function saveReport(next: string) {
    setReport(next)
    try { localStorage.setItem(CLAUDE_REPORT_KEY, next) } catch { /* local only */ }
  }

  function toggleItem(item: string) {
    const next = { ...checklist, [item]: !checklist[item] }
    setChecklist(next)
    try { localStorage.setItem(LAUNCH_CHECKLIST_KEY, JSON.stringify(next)) } catch { /* local only */ }
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard?.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1400)
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-cyan-400/25 bg-[#071317]">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100">
              <RadioTower className="h-3.5 w-3.5" /> Visibility business, not just websites
            </div>
            <h2 className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-4xl">
              Get seen. Get calls. Close the first customer.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              GR Scale sells visibility for local businesses: website, Google presence, local SEO, content, reviews, and simple conversion systems.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="#pipeline" className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">
                <Target className="h-3.5 w-3.5" /> Start Send Desk
              </Link>
              <a href="https://www.grscales.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/70 hover:text-white">
                GRScales.com <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-white">First customer readiness</p>
              <span className={cn(
                'rounded-full border px-3 py-1 text-xs font-black',
                readyPct >= 80 ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'
              )}>
                {readyPct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300" style={{ width: `${readyPct}%` }} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              Ready means Gio can respond to a lead today without freezing, sounding robotic, or losing the next step.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-black text-white">Claude operator reports</p>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Claude reminders are external. Until Supabase/API report sync exists, paste Claude outputs here so the website becomes the command surface.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {REPORT_CARDS.map(card => (
              <div key={card.key} className={cn('rounded-lg border p-3', card.tone)}>
                <p className="text-[11px] font-black uppercase tracking-wider">{card.label}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-200">
                  {parsedReport[card.key] || 'Paste a Claude report to fill this.'}
                </p>
              </div>
            ))}
          </div>
          <textarea
            value={report}
            onChange={event => saveReport(event.target.value)}
            placeholder="Paste Claude's latest operator report here..."
            className="mt-3 min-h-36 w-full resize-none rounded-lg border border-zinc-800 bg-black/30 p-3 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-700"
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {OPERATOR_CADENCE.map(item => (
              <div key={`${item.time}-${item.label}`} className="rounded-lg border border-zinc-800 bg-black/25 p-3">
                <p className="text-xs font-black text-cyan-200">{item.time} - {item.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{item.output}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquareReply className="h-4 w-4 text-emerald-300" />
            <p className="text-sm font-black text-white">Natural response desk</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[0.8fr_1.2fr]">
            <select
              value={selectedTemplate}
              onChange={event => setSelectedTemplate(event.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-bold text-zinc-200 outline-none"
            >
              {RESPONSE_TEMPLATES.map(item => <option key={item.label}>{item.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => copyText(replyDraft, currentTemplate.label)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300">
                <Copy className="h-3.5 w-3.5" /> {copied === currentTemplate.label ? 'Copied' : 'Copy reply'}
              </button>
              <a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-3 py-2 text-xs font-black text-zinc-300 hover:text-white">
                Gmail
              </a>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={mergeName}
              onChange={event => setMergeName(event.target.value)}
              placeholder="Business name"
              className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
            />
            <input
              value={mergeProblem}
              onChange={event => setMergeProblem(event.target.value)}
              placeholder="Specific problem you found"
              className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
            />
          </div>
          <textarea
            value={replyDraft}
            onChange={event => setReplyDraft(event.target.value)}
            className="mt-3 min-h-36 w-full resize-none rounded-lg border border-zinc-800 bg-black/30 p-3 text-sm leading-relaxed text-zinc-300 outline-none"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Edit before sending. This never auto-sends.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-amber-300" />
            <p className="text-sm font-black text-white">Before you say "start business"</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {LAUNCH_ITEMS.map(item => (
              <button
                key={item}
                onClick={() => toggleItem(item)}
                className={cn(
                  'flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition',
                  checklist[item] ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-zinc-800 bg-black/25 text-zinc-500 hover:text-zinc-200'
                )}
              >
                <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', checklist[item] ? 'text-emerald-300' : 'text-zinc-700')} />
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-violet-300" />
            <p className="text-sm font-black text-white">Offer ladder</p>
          </div>
          <div className="space-y-2">
            {SERVICE_LADDER.map(item => (
              <div key={item.name} className="rounded-lg border border-zinc-800 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-white">{item.name}</p>
                  <p className="text-xs font-black text-violet-200">{item.price}</p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-200" />
              <p className="text-xs font-black text-cyan-100">Rule</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Draft, approve, then Gio sends. No auto-contact, auto-post, or spend.
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-200" />
              <p className="text-xs font-black text-amber-100">Current gap</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Claude reports are paste-in until the live bridge is verified. The dashboard is ready to receive them without pretending they are automatic.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-amber-200" />
          <div>
            <p className="text-sm font-black text-white">{todayLabel()} operator truth</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              The workflow is ready enough to start. The only things still not fully linked are Claude-to-dashboard automatic report sync and Supabase memory. Those are useful, but they do not block sending approved outreach and closing the first customer.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
