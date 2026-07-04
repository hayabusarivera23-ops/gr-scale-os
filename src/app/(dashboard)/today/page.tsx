'use client'

/**
 * START WORK — the guided daily sales session (Founder Experience).
 *
 * Turns the OS from a CRM into a mentor: one step at a time, each step
 * pre-loaded with the exact message, phone number, and demo link needed.
 * Progress persists per-day in localStorage (documented simple choice —
 * swap for Supabase alongside the main store later).
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Phone, Copy, Check, ChevronRight, Zap, Trophy, Users, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOS } from '@/lib/store'
import { demoForIndustry } from '@/lib/demos'

interface Step {
  id: string
  kind: 'chase' | 'call' | 'prospect'
  title: string
  why: string
  phone?: string
  message?: string
  href?: string
  hrefLabel?: string
}

function todayKey() {
  return `gr-scale-today-${new Date().toISOString().slice(0, 10)}`
}

export default function TodayPage() {
  const { data, ready } = useOS()
  const [done, setDone] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(todayKey()) ?? '[]')) } catch { /* fresh day */ }
  }, [])

  function markDone(id: string) {
    setDone(prev => {
      const next = prev.includes(id) ? prev : [...prev, id]
      try { localStorage.setItem(todayKey(), JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const steps: Step[] = useMemo(() => {
    const s: Step[] = []

    // 1. Chase proposals first — closest to money
    data.proposals.filter(p => p.status === 'Sent').forEach(p => {
      s.push({
        id: `chase-${p.id}`,
        kind: 'chase',
        title: `Chase the ${p.business_name} proposal ($${p.monthly}/mo)`,
        why: 'A sent proposal is the closest thing you have to revenue. Deals die from silence, not rejection.',
        message: `Hey — just checking you saw the proposal I sent over for ${p.business_name}. Any questions I can answer? I can have you live within a week of the go-ahead.`,
        href: '/proposals',
        hrefLabel: 'Open proposal',
      })
    })

    // 2. Top 5 uncontacted leads — the day's outreach block
    const targets = data.leads
      .filter(l => !['Won', 'Lost', 'Proposal Sent'].includes(l.status))
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, 5)

    targets.forEach((l, i) => {
      const demo = demoForIndustry(l.industry)
      const flaw = l.notes ? l.notes.split('.')[0] : 'a few things costing you calls'
      s.push({
        id: `call-${l.id}`,
        kind: 'call',
        title: `Outreach ${i + 1} of ${targets.length}: ${l.business_name} (${l.city})`,
        why: `Opportunity score ${l.opportunity_score}/100. ${l.notes ?? ''}`,
        phone: l.phone,
        message: `Hi, is this the owner of ${l.business_name}? I'm Gio — I build websites for ${l.industry.toLowerCase()} companies in Florida. I looked at your online presence and noticed ${flaw.toLowerCase()}. Here's a live example of what I build: ${demo.url} — worth a look on your phone. Want a free 1-minute video audit of your current site?`,
        href: `/workspace?lead=${l.id}`,
        hrefLabel: 'Open workspace',
      })
    })

    // 3. Refill the pipeline
    s.push({
      id: 'prospect-5',
      kind: 'prospect',
      title: 'Add 5 new leads to the pipeline',
      why: 'Google Maps → "roofer [city]" or "plumber [city]" → 4.5★+, 30+ reviews, weak website. Outreach dies without fresh leads.',
      href: '/leads',
      hrefLabel: 'Open Leads',
    })

    return s
  }, [data])

  const remaining = steps.filter(st => !done.includes(st.id))
  const current = remaining[0] ?? null
  const pct = steps.length ? Math.round((done.filter(d => steps.some(st => st.id === d)).length / steps.length) * 100) : 0

  if (!ready) return <div className="text-sm text-zinc-600 p-4">Loading…</div>

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Today&apos;s Session</h2>
          <p className="text-sm text-zinc-500 mt-1">{data.settings.todays_mission}</p>
        </div>
        <span className="badge bg-sky-500/15 text-sky-400 border border-sky-500/20">{pct}% done</span>
      </div>

      {/* Progress */}
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {/* Current step — one thing at a time */}
      {current ? (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            {current.kind === 'chase' ? <FileText className="h-5 w-5 text-red-400" /> :
             current.kind === 'call' ? <Phone className="h-5 w-5 text-sky-400" /> :
             <Users className="h-5 w-5 text-amber-400" />}
            <p className="text-base font-bold text-zinc-100">{current.title}</p>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">{current.why}</p>

          {current.message && (
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Say / send exactly this</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{current.message}</p>
              <button onClick={() => copy(current.message!, current.id)}
                className={cn('btn-ghost text-xs mt-3', copied === current.id && 'text-emerald-400')}>
                {copied === current.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === current.id ? 'Copied!' : 'Copy message'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {current.phone && (
              <a href={`tel:${current.phone}`} className="btn-primary text-sm">
                <Phone className="h-4 w-4" /> Call {current.phone}
              </a>
            )}
            {current.href && (
              <Link href={current.href} className="btn-ghost text-sm">
                {current.hrefLabel} <ChevronRight className="h-4 w-4" />
              </Link>
            )}
            <button onClick={() => markDone(current.id)}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-5 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/25 transition">
              <Check className="h-4 w-4" /> Done — next
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-3">
          <Trophy className="h-10 w-10 text-emerald-400 mx-auto" />
          <p className="text-lg font-bold text-zinc-100">Session complete. That was real work.</p>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Every message you sent today is a seed. Log any replies in the pipeline, set follow-up dates,
            and come back tomorrow — consistency is the whole game.
          </p>
          <Link href="/" className="btn-primary inline-flex text-sm mt-2">Back to Dashboard</Link>
        </div>
      )}

      {/* Upcoming steps */}
      {remaining.length > 1 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Up next</p>
          {remaining.slice(1).map(st => (
            <div key={st.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
              <Zap className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
              <p className="text-sm text-zinc-500">{st.title}</p>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {done.length > 0 && remaining.length > 0 && (
        <p className="text-xs text-zinc-600">{done.length} step{done.length === 1 ? '' : 's'} completed today.</p>
      )}
    </div>
  )
}
