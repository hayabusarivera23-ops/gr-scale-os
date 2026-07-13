'use client'

/**
 * AI EMPLOYEES — the staff roster + live dispatch desk (2026-07-13)
 *
 * Gio's company runs on Claude employees (scheduled jobs). This section shows
 * who they are, when they work, and lets Gio hand any of them new work orders
 * that Claude's Order Runner picks up 5x daily via /api/queue → ops/commands.json.
 * Nothing here ever auto-sends anything to businesses — every employee drafts,
 * Gio approves.
 */

import { useCallback, useEffect, useState } from 'react'

interface Order {
  id: string
  type: string
  params?: Record<string, string>
  status: 'pending' | 'done' | 'failed'
  note?: string
  createdAt: string
}

const EMPLOYEES = [
  {
    emoji: '🕵️',
    name: 'Scout',
    role: 'Lead Hunter',
    duty: 'Finds weak-website businesses, writes 10 personalized pitch drafts into Gmail every morning.',
    shift: 'Daily · 7:00 AM',
  },
  {
    emoji: '📬',
    name: 'Penny',
    role: 'Inbox Manager',
    duty: 'Sweeps the inbox for prospect replies and pre-writes professional selling responses.',
    shift: 'Daily · 4:00 PM',
  },
  {
    emoji: '🎬',
    name: 'Ace',
    role: 'Content Producer',
    duty: 'Delivers a full week of scripted, filmable posts with fresh teardown targets.',
    shift: 'Sundays · 5:00 PM',
  },
  {
    emoji: '🩺',
    name: 'Patch',
    role: 'Site Guardian',
    duty: 'Patrols grscales.com, client sites, and demos — reports anything broken.',
    shift: 'Mondays · 4:30 PM',
  },
  {
    emoji: '⚡',
    name: 'Runner',
    role: 'Order Executor',
    duty: 'Picks up every work order you dispatch below and gets it done.',
    shift: '5x daily · 9a / 12p / 3p / 6p / 9p',
  },
]

const ORDER_TYPES: {
  type: string
  icon: string
  title: string
  fields: { key: string; label: string; placeholder: string }[]
}[] = [
  {
    type: 'find-leads',
    icon: '🔎',
    title: 'Find New Leads',
    fields: [
      { key: 'niche', label: 'Niche', placeholder: 'roofing, HVAC...' },
      { key: 'area', label: 'Area', placeholder: 'Tampa, or anywhere' },
    ],
  },
  { type: 'audit', icon: '🧪', title: 'Audit a Website', fields: [{ key: 'url', label: 'URL', placeholder: 'https://...' }] },
  { type: 'follow-ups', icon: '📞', title: 'Draft Follow-Ups', fields: [] },
  { type: 'content', icon: '✍️', title: 'Content Batch', fields: [] },
  {
    type: 'proposal',
    icon: '📄',
    title: 'Prep a Proposal',
    fields: [
      { key: 'business', label: 'Business', placeholder: 'Top Dog Roofing' },
      { key: 'package', label: 'Package', placeholder: 'Starter / Growth / Scale' },
    ],
  },
  { type: 'custom', icon: '⚡', title: 'Custom Order', fields: [{ key: 'text', label: 'Order', placeholder: 'anything within guardrails...' }] },
]

export default function AIEmployees() {
  const [orders, setOrders] = useState<Order[]>([])
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/queue', { cache: 'no-store' })
      const data = (await res.json()) as { ok: boolean; configured?: boolean; commands?: Order[] }
      if (data.ok) {
        setOrders((data.commands ?? []).slice().reverse())
        setConfigured(Boolean(data.configured))
      }
    } catch {
      setConfigured(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function dispatch(type: string, fields: { key: string }[]) {
    setBusy(type)
    setMsg('')
    const params: Record<string, string> = {}
    for (const f of fields) {
      const v = inputs[`${type}:${f.key}`]
      if (v) params[f.key] = v
    }
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', type, params }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string; commands?: Order[] }
      if (data.ok) {
        setMsg('✓ Order dispatched — Runner picks it up on the next shift.')
        setOrders((data.commands ?? []).slice().reverse())
      } else {
        setMsg(`✗ ${data.error ?? 'Dispatch failed'}`)
      }
    } catch {
      setMsg('✗ Network error — try again.')
    } finally {
      setBusy(null)
    }
  }

  const visibleOrders = showAll ? orders : orders.slice(0, 5)

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-5 py-4 space-y-4">
      <div>
        <p className="text-[10px] font-black tracking-widest text-violet-400 uppercase mb-1">AI Employees</p>
        <p className="text-sm text-zinc-300 font-semibold">
          Your staff. They do the labor — you read the reports and press send.
        </p>
      </div>

      {/* Roster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {EMPLOYEES.map(e => (
          <div key={e.name} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{e.emoji}</span>
              <div>
                <p className="text-xs font-bold text-zinc-100">
                  {e.name} <span className="text-zinc-500 font-medium">· {e.role}</span>
                </p>
                <p className="text-[10px] text-violet-400 font-semibold">{e.shift}</p>
              </div>
              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="On schedule" />
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed mt-1.5">{e.duty}</p>
          </div>
        ))}
      </div>

      {/* Bridge status */}
      {configured === false && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-300 leading-relaxed">
          Order desk not activated yet — add a GITHUB_TOKEN env var in Vercel (Settings → Environment
          Variables → GITHUB_TOKEN) and redeploy. The roster above already works on schedule regardless.
        </div>
      )}
      {msg && (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-300">{msg}</div>
      )}

      {/* Dispatch desk */}
      <div>
        <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-2">Give Work — dispatched straight to Runner</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ORDER_TYPES.map(o => (
            <div key={o.type} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col gap-2">
              <p className="text-xs font-bold text-zinc-200">
                {o.icon} {o.title}
              </p>
              {o.fields.map(f => (
                <input
                  key={f.key}
                  type="text"
                  placeholder={f.placeholder}
                  value={inputs[`${o.type}:${f.key}`] ?? ''}
                  onChange={ev => setInputs({ ...inputs, [`${o.type}:${f.key}`]: ev.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-700 focus:border-violet-500/50 focus:outline-none"
                />
              ))}
              <button
                onClick={() => dispatch(o.type, o.fields)}
                disabled={busy === o.type}
                className="mt-auto rounded-md bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 text-[11px] font-bold text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-50"
              >
                {busy === o.type ? 'Dispatching…' : 'Dispatch'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Order history */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase">Work Orders</p>
          {orders.length > 5 && (
            <button onClick={() => setShowAll(!showAll)} className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-300">
              {showAll ? 'Show less' : `Show all ${orders.length}`}
            </button>
          )}
        </div>
        {orders.length === 0 ? (
          <p className="text-xs text-zinc-600">No work orders yet — dispatch one above.</p>
        ) : (
          <div className="space-y-1.5">
            {visibleOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-zinc-200 truncate">
                    {o.type}
                    {o.params && Object.keys(o.params).length > 0 && (
                      <span className="text-zinc-500 font-normal"> — {Object.values(o.params).join(', ')}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-zinc-600 truncate">
                    {new Date(o.createdAt).toLocaleString()} {o.note ? `· ${o.note}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    o.status === 'done'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : o.status === 'failed'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
