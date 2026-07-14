'use client'

/**
 * AI EMPLOYEES — full management wing (2026-07-13)
 *
 * Live roster synced from ops/employees.json via /api/employees:
 * per-employee status (active/paused), last run + last report, and REAL
 * controls — pause/resume and focus/instruction directives that each
 * employee reads at the start of its next scheduled run. Below the roster:
 * the dispatch desk (work orders via /api/queue → Runner picks up 5x daily).
 * Nothing here ever auto-sends anything to businesses.
 */

import { useCallback, useEffect, useState } from 'react'

interface Employee {
  id: string
  name: string
  emoji: string
  role: string
  schedule: string
  status: 'active' | 'paused'
  focus: string
  instructions: string
  lastRun: string
  lastReport: string
}

interface Order {
  id: string
  type: string
  params?: Record<string, string>
  status: 'pending' | 'done' | 'failed'
  note?: string
  createdAt: string
}

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

function timeAgo(iso: string): string {
  if (!iso) return 'no runs reported yet'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AIEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [focusEdits, setFocusEdits] = useState<Record<string, string>>({})
  const [openEmp, setOpenEmp] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    try {
      const [empRes, qRes] = await Promise.all([
        fetch('/api/employees', { cache: 'no-store' }),
        fetch('/api/queue', { cache: 'no-store' }),
      ])
      const empData = (await empRes.json()) as { ok: boolean; configured?: boolean; employees?: Employee[] }
      const qData = (await qRes.json()) as { ok: boolean; commands?: Order[] }
      if (empData.ok) {
        setEmployees(empData.employees ?? [])
        setConfigured(Boolean(empData.configured))
      }
      if (qData.ok) setOrders((qData.commands ?? []).slice().reverse())
    } catch {
      setConfigured(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setEmployee(id: string, patch: { status?: 'active' | 'paused'; focus?: string; instructions?: string }) {
    setBusy(`emp-${id}`)
    setMsg('')
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', id, ...patch }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string; employees?: Employee[] }
      if (data.ok) {
        setEmployees(data.employees ?? [])
        setMsg('✓ Directive saved — applies on their next shift.')
      } else {
        setMsg(`✗ ${data.error ?? 'Save failed'}`)
      }
    } catch {
      setMsg('✗ Network error — try again.')
    } finally {
      setBusy(null)
    }
  }

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
          Your staff. Tap an employee to direct their work — pause, refocus, instruct.
        </p>
      </div>

      {configured === false && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-300 leading-relaxed">
          Management desk not activated yet — add a GITHUB_TOKEN env var in Vercel and redeploy. Employees
          still run their normal schedules regardless.
        </div>
      )}
      {msg && (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-300">{msg}</div>
      )}

      {/* Roster with controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {employees.map(e => {
          const open = openEmp === e.id
          const paused = e.status === 'paused'
          return (
            <div key={e.id} className={`rounded-lg border px-3.5 py-3 transition ${paused ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-800 bg-zinc-900/60'}`}>
              <button className="w-full text-left" onClick={() => setOpenEmp(open ? null : e.id)}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{e.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-100 truncate">
                      {e.name} <span className="text-zinc-500 font-medium">· {e.role}</span>
                    </p>
                    <p className="text-[10px] text-violet-400 font-semibold">{e.schedule}</p>
                  </div>
                  <span
                    className={`ml-auto h-2 w-2 rounded-full shrink-0 ${paused ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    title={paused ? 'Paused' : 'Active'}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5 truncate">
                  Last: {e.lastReport ? `${e.lastReport} · ${timeAgo(e.lastRun)}` : timeAgo(e.lastRun)}
                </p>
                {e.focus && <p className="text-[10px] text-sky-400 mt-0.5 truncate">Focus: {e.focus}</p>}
              </button>

              {open && (
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmployee(e.id, { status: paused ? 'active' : 'paused' })}
                      disabled={busy === `emp-${e.id}`}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold border transition disabled:opacity-50 ${
                        paused
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                      }`}
                    >
                      {paused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Focus (e.g. 'roofers in Miami only this week')"
                    value={focusEdits[`${e.id}:focus`] ?? e.focus}
                    onChange={ev => setFocusEdits({ ...focusEdits, [`${e.id}:focus`]: ev.target.value })}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-700 focus:border-violet-500/50 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Standing instructions (applied every run)"
                    value={focusEdits[`${e.id}:instructions`] ?? e.instructions}
                    onChange={ev => setFocusEdits({ ...focusEdits, [`${e.id}:instructions`]: ev.target.value })}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-700 focus:border-violet-500/50 focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setEmployee(e.id, {
                        focus: focusEdits[`${e.id}:focus`] ?? e.focus,
                        instructions: focusEdits[`${e.id}:instructions`] ?? e.instructions,
                      })
                    }
                    disabled={busy === `emp-${e.id}`}
                    className="rounded-md bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 text-[11px] font-bold text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-50"
                  >
                    {busy === `emp-${e.id}` ? 'Saving…' : 'Save Directives'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {employees.length === 0 && (
          <p className="text-xs text-zinc-600 sm:col-span-2">Roster loading… (activates fully once the bridge token is set)</p>
        )}
      </div>

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
