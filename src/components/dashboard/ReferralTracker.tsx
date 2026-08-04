'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Gift, PlusCircle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const REFERRAL_KEY = 'gr.referral-tracker.v1'

type ReferralStatus = 'IDEA' | 'SCRIPT COPIED' | 'INTRO SENT' | 'REPLIED' | 'CLOSED' | 'REWARD DUE'

interface ReferralPlay {
  id: string
  name: string
  source: string
  note: string
  status: ReferralStatus
  createdAt: string
}

const STATUSES: ReferralStatus[] = ['IDEA', 'SCRIPT COPIED', 'INTRO SENT', 'REPLIED', 'CLOSED', 'REWARD DUE']

const REFERRAL_SCRIPT = `Yo, quick one. I build websites and visibility systems for local businesses now. If you know any business owner with an ugly site, no site, weak Google profile, or not enough calls, intro me. If they sign, I pay you $50. Just send them my number: (813) 869-5917.`

const REVIEW_SCRIPT = `Hey {name}, awesome working with you. One favor: a quick honest Google review helps a small business like mine more than almost anything. Just mention what I helped with and whether it made the business look more professional. Thank you.`

function readReferrals() {
  try {
    return JSON.parse(localStorage.getItem(REFERRAL_KEY) || '[]') as ReferralPlay[]
  } catch {
    return []
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReferralTracker() {
  const [plays, setPlays] = useState<ReferralPlay[]>([])
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({ name: '', source: '', note: '' })

  useEffect(() => {
    setPlays(readReferrals())
  }, [])

  function save(next: ReferralPlay[]) {
    setPlays(next)
    localStorage.setItem(REFERRAL_KEY, JSON.stringify(next))
  }

  function addPlay() {
    const name = form.name.trim()
    if (!name) return
    save([
      {
        id: `ref-${Date.now()}`,
        name,
        source: form.source.trim() || 'Personal network',
        note: form.note.trim() || 'Potential referral or review play',
        status: 'IDEA',
        createdAt: todayIso(),
      },
      ...plays,
    ])
    setForm({ name: '', source: '', note: '' })
  }

  function setStatus(id: string, status: ReferralStatus) {
    save(plays.map(play => play.id === id ? { ...play, status } : play))
  }

  function copyScript(text: string, label: string) {
    navigator.clipboard?.writeText(text)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1800)
  }

  const closed = useMemo(() => plays.filter(play => play.status === 'CLOSED').length, [plays])
  const rewardDue = useMemo(() => plays.filter(play => play.status === 'REWARD DUE').length, [plays])

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-black text-white">Referral + Review Engine</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Free trust loop: ask for intros, track reward promises, request honest reviews after wins.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right">
          <div className="rounded-lg border border-zinc-800 bg-black/25 px-3 py-2">
            <p className="text-lg font-black text-emerald-300">{closed}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Closed</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-black/25 px-3 py-2">
            <p className="text-lg font-black text-amber-300">{rewardDue}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">$50 Due</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
        <input
          value={form.name}
          onChange={event => setForm({ ...form, name: event.target.value })}
          placeholder="Person or client"
          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
        />
        <input
          value={form.source}
          onChange={event => setForm({ ...form, source: event.target.value })}
          placeholder="Where from"
          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
        />
        <input
          value={form.note}
          onChange={event => setForm({ ...form, note: event.target.value })}
          placeholder="Who can they introduce or review?"
          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
        />
        <button onClick={addPlay} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-400">
          <PlusCircle className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => copyScript(REFERRAL_SCRIPT, 'Referral script copied')} className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-500/20">
          <Copy className="h-3.5 w-3.5" /> Copy referral ask
        </button>
        <button onClick={() => copyScript(REVIEW_SCRIPT, 'Review script copied')} className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-300 transition hover:bg-amber-500/20">
          <Star className="h-3.5 w-3.5" /> Copy review ask
        </button>
        {copied && <p className="self-center text-xs font-bold text-emerald-400">{copied}</p>}
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {plays.slice(0, 6).map(play => (
          <div key={play.id} className="rounded-lg border border-zinc-800 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{play.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{play.source} - {play.note}</p>
              </div>
              <select
                value={play.status}
                onChange={event => setStatus(play.id, event.target.value as ReferralStatus)}
                className={cn(
                  'rounded-lg border px-2 py-1.5 text-[11px] font-black outline-none',
                  play.status === 'REWARD DUE' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-zinc-800 bg-zinc-950 text-zinc-300'
                )}
              >
                {STATUSES.map(status => <option key={status}>{status}</option>)}
              </select>
            </div>
          </div>
        ))}
        {plays.length === 0 && (
          <p className="rounded-lg border border-zinc-800 bg-black/20 p-3 text-sm text-zinc-600">Add your first referral source: family friend, client, coach, local business owner, or anyone who knows business owners.</p>
        )}
      </div>
    </section>
  )
}
