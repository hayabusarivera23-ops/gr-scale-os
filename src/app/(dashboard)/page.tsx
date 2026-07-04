'use client'

/**
 * Founder Dashboard — Phase 1 (Sales)
 *
 * Top strip answers the 8 executive questions at a glance:
 * Revenue Goal · MRR · New Leads · Follow-Ups Due · Proposals Waiting ·
 * Active Clients · Highest ROI Task · Today's Mission
 *
 * Below it, the original 5-question flow, now driven by the persistent
 * store (src/lib/store.ts) instead of hardcoded data.
 */

import Link from 'next/link'
import {
  Phone, ChevronRight, DollarSign, Target, TrendingUp,
  Zap, Users, FileText, Building2, Flag,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { toStage, closestToPaying, revenueOpportunity, buildWorkQueue } from '@/lib/workflow'
import { useOS } from '@/lib/store'
import { PACKAGES } from '@/lib/packages'

// ─── Metric card ──────────────────────────────────────────────────────────────

function Metric({ label, value, sub, icon: Icon, color, href }: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  href: string
}) {
  return (
    <Link href={href} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-zinc-700 transition block">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
        <p className="text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{label}</p>
      </div>
      <p className={cn('text-xl font-black', color)}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
    </Link>
  )
}

// ─── Question card (unchanged design) ────────────────────────────────────────

function QuestionCard({
  number, question, children, href, cta,
  border = 'border-zinc-800',
  accent = false,
}: {
  number: string
  question: string
  children: React.ReactNode
  href?: string
  cta?: string
  border?: string
  accent?: boolean
}) {
  return (
    <div className={cn('rounded-xl border bg-zinc-900/60 overflow-hidden', border)}>
      <div className={cn('px-5 pt-4 pb-3 border-b border-zinc-800/60', accent && 'bg-sky-500/5')}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-[10px] font-black tracking-widest', accent ? 'text-sky-500' : 'text-zinc-700')}>
            Q{number}
          </span>
        </div>
        <p className={cn('text-sm font-bold', accent ? 'text-zinc-100' : 'text-zinc-300')}>{question}</p>
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
      {href && cta && (
        <div className="px-5 pb-4">
          <Link href={href} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition',
            accent
              ? 'bg-sky-500/20 border-sky-500/30 text-sky-400 hover:bg-sky-500/30'
              : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:text-zinc-100')}>
            {cta} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, metrics, ready } = useOS()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const LEADS = data.leads
  const activeLeads = LEADS.filter(l => !['Won', 'Lost'].includes(l.status))

  // Q1: highest priority uncontacted lead
  const q1Lead = [...activeLeads].sort((a, b) => b.opportunity_score - a.opportunity_score)[0]
  // Q2: closest to paying
  const q2Lead = closestToPaying(LEADS)
  // Q4: revenue opportunity
  const q4Revenue = revenueOpportunity(LEADS)
  // Q5 / Highest ROI task
  const queue = buildWorkQueue(LEADS, [])
  const q5Action = queue[0] ?? null

  if (!ready) return <div className="text-sm text-zinc-600 p-4">Loading…</div>

  return (
    <div className="space-y-4 max-w-3xl">

      {/* Greeting */}
      <div className="pb-1">
        <h2 className="text-xl font-bold text-zinc-100">{greeting}, Gio.</h2>
        <p className="text-sm text-zinc-600 mt-0.5">{today} · Here&apos;s what needs your attention.</p>
      </div>

      {/* Today's Mission */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Flag className="h-4 w-4 text-sky-400" />
          <p className="text-[10px] font-black tracking-widest text-sky-500 uppercase">Today&apos;s Mission</p>
        </div>
        <p className="text-sm font-bold text-zinc-100">{data.settings.todays_mission}</p>
      </div>

      {/* Phase 1 metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Metric label="Revenue Goal" value={formatCurrency(metrics.revenueGoal)} sub="target MRR" icon={Target} color="text-zinc-300" href="/revenue" />
        <Metric label="MRR" value={formatCurrency(metrics.mrr)} sub={`${metrics.mrrProgressPct}% of goal`} icon={DollarSign} color={metrics.mrr > 0 ? 'text-emerald-400' : 'text-red-400'} href="/revenue" />
        <Metric label="Active Clients" value={String(metrics.activeClients)} sub={metrics.activeClients === 0 ? 'close the first one' : 'keep them happy'} icon={Building2} color="text-violet-400" href="/clients" />
        <Metric label="New Leads" value={String(metrics.newLeads)} sub="untouched" icon={Users} color="text-sky-400" href="/leads" />
        <Metric label="Follow-Ups Due" value={String(metrics.followUpsDue)} sub="today" icon={Phone} color={metrics.followUpsDue > 0 ? 'text-amber-400' : 'text-zinc-400'} href="/pipeline" />
        <Metric label="Proposals Waiting" value={String(metrics.proposalsWaiting)} sub="chase these" icon={FileText} color={metrics.proposalsWaiting > 0 ? 'text-red-400' : 'text-zinc-400'} href="/proposals" />
      </div>

      {/* Highest ROI Task */}
      <QuestionCard
        number="★" question="Highest ROI task right now"
        href={q5Action?.href ?? '/queue'} cta="Do It Now"
        border={q5Action?.type === 'chase_proposal' ? 'border-red-500/30' : 'border-sky-500/30'}
        accent>
        {q5Action ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 shrink-0 text-sky-400" />
              <p className="text-sm font-bold text-zinc-100">{q5Action.label}</p>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">{q5Action.sub}</p>
            {q5Action.phone && (
              <a href={`tel:${q5Action.phone}`}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition">
                <Phone className="h-3.5 w-3.5" /> {q5Action.phone}
              </a>
            )}
            <p className="text-[10px] text-zinc-700">Estimated time: ~{q5Action.estimated_minutes} minutes.</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Add leads and run audits to generate actions.</p>
        )}
      </QuestionCard>

      {/* Q1 — Who do I contact first? */}
      <QuestionCard
        number="1" question="Who do I contact first?"
        href={q1Lead ? `/workspace?lead=${q1Lead.id}` : '/inbox'}
        cta="Open Workspace"
        border="border-sky-500/30">
        {q1Lead ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-zinc-100">{q1Lead.business_name}</p>
                <p className="text-sm text-zinc-500">{q1Lead.city}, FL · {formatCurrency(q1Lead.estimated_deal_value)}/yr value</p>
              </div>
              {q1Lead.recommended_package && (
                <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded px-2 py-0.5 shrink-0">
                  {PACKAGES[q1Lead.recommended_package].name} · {PACKAGES[q1Lead.recommended_package].monthlyLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">{q1Lead.notes}</p>
            {q1Lead.phone && (
              <a href={`tel:${q1Lead.phone}`}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500/20 border border-sky-500/30 px-4 py-2 text-sm font-semibold text-sky-400 hover:bg-sky-500/30 transition">
                <Phone className="h-4 w-4" /> Call {q1Lead.phone}
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No active leads. Add leads to the CRM.</p>
        )}
      </QuestionCard>

      {/* Q2 — Who is closest to paying? */}
      <QuestionCard
        number="2" question="Who is closest to paying?"
        href={q2Lead ? `/leads/${q2Lead.id}` : '/pipeline'}
        cta={q2Lead ? 'View Lead' : 'View Pipeline'}
        border="border-emerald-500/20">
        {q2Lead ? (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-zinc-100">{q2Lead.business_name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{q2Lead.city}, FL</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(q2Lead.estimated_deal_value)}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5 capitalize">Stage: {toStage(q2Lead)}</p>
              </div>
            </div>
            {q2Lead.phone && <p className="text-xs text-zinc-600">{q2Lead.phone}</p>}
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
              <p className="text-xs text-emerald-400 font-medium">
                {toStage(q2Lead) === 'Proposal' && 'Proposal sent. Chase it today — call or text.'}
                {toStage(q2Lead) === 'Meeting' && 'Meeting booked. Have Stripe link + demo ready.'}
                {toStage(q2Lead) === 'Follow Up' && 'Interested. Book the close call now.'}
                {toStage(q2Lead) === 'Contacted' && 'Contacted. Follow up and push for a meeting.'}
                {!['Proposal', 'Meeting', 'Follow Up', 'Contacted'].includes(toStage(q2Lead)) && 'No warm leads yet. Your next call could change this.'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No leads in pipeline yet.</p>
        )}
      </QuestionCard>

      {/* Q3 — Pipeline value */}
      <QuestionCard
        number="3" question="What is the pipeline worth?"
        href="/command" cta="See All Leads"
        border="border-zinc-800">
        <div className="space-y-3">
          <div>
            <p className="text-3xl font-black text-emerald-400">{formatCurrency(q4Revenue)}</p>
            <p className="text-xs text-zinc-600 mt-1">
              First-year value across {activeLeads.length} active leads · {formatCurrency(metrics.mrr)} MRR closed so far
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['starter', 'growth', 'scale'] as const).map(id => (
              <div key={id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-center">
                <p className="text-sm font-bold text-zinc-300">{PACKAGES[id].name}</p>
                <p className="text-[10px] text-zinc-600">{PACKAGES[id].monthlyLabel}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-700">One Starter close = {formatCurrency(99 * 12)}/yr. Ten = {formatCurrency(99 * 12 * 10)}/yr recurring.</p>
        </div>
      </QuestionCard>

      {/* Quick nav strip */}
      <div className="grid grid-cols-3 gap-2 pb-6">
        {[
          { label: 'Lead Inbox', href: '/inbox', icon: Users, color: 'text-sky-400' },
          { label: 'Proposals', href: '/proposals', icon: FileText, color: 'text-amber-400' },
          { label: 'Workspace', href: '/workspace', icon: Target, color: 'text-violet-400' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-zinc-700 transition">
            <Icon className={cn('h-4 w-4 shrink-0', color)} />
            <span className="text-xs font-medium text-zinc-300">{label}</span>
            <ChevronRight className="h-3 w-3 text-zinc-700 ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  )
}
