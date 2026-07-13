'use client'

import { useCallback, useEffect, useState } from 'react'

interface Command {
  id: string
  type: string
  params?: Record<string, string>
  status: 'pending' | 'done' | 'failed'
  note?: string
  createdAt: string
  updatedAt?: string
}

const COMMANDS: {
  type: string
  icon: string
  title: string
  desc: string
  fields: { key: string; label: string; placeholder: string }[]
}[] = [
  {
    type: 'find-leads',
    icon: '🔎',
    title: 'Find New Leads',
    desc: 'Claude researches 5 verified weak-website leads and preps outreach drafts.',
    fields: [
      { key: 'niche', label: 'Niche', placeholder: 'roofing, HVAC, barber...' },
      { key: 'area', label: 'Area', placeholder: 'Tampa FL, or "anywhere"' },
    ],
  },
  {
    type: 'audit',
    icon: '🧪',
    title: 'Audit a Website',
    desc: 'Full audit with findings, opportunity score, and an outreach hook.',
    fields: [{ key: 'url', label: 'Website URL', placeholder: 'https://...' }],
  },
  {
    type: 'follow-ups',
    icon: '📞',
    title: 'Draft Follow-Ups',
    desc: 'Follow-up drafts for every lead going cold in the pipeline.',
    fields: [],
  },
  {
    type: 'content',
    icon: '✍️',
    title: 'Write Content Batch',
    desc: 'A batch of scripted, filmable posts for GR Scale socials.',
    fields: [],
  },
  {
    type: 'proposal',
    icon: '📄',
    title: 'Prep a Proposal',
    desc: 'A ready-to-send proposal for a specific business.',
    fields: [
      { key: 'business', label: 'Business name', placeholder: 'Top Dog Roofing' },
      { key: 'package', label: 'Package', placeholder: 'Starter / Growth / Scale' },
    ],
  },
  {
    type: 'custom',
    icon: '⚡',
    title: 'Custom Order',
    desc: 'Tell Claude anything — it runs within the GR Scale guardrails.',
    fields: [{ key: 'text', label: 'What do you want done?', placeholder: 'e.g. research pool builders in Miami...' }],
  },
]

export default function DispatchPage() {
  const [commands, setCommands] = useState<Command[]>([])
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [busyType, setBusyType] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [inputs, setInputs] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/queue', { cache: 'no-store' })
      const data = (await res.json()) as { ok: boolean; configured?: boolean; commands?: Command[] }
      if (data.ok) {
        setCommands((data.commands ?? []).slice().reverse())
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
    setBusyType(type)
    setMessage('')
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
      const data = (await res.json()) as { ok: boolean; error?: string; commands?: Command[] }
      if (data.ok) {
        setMessage('✓ Dispatched — Claude picks this up on its next check (5x daily, 9am-9pm).')
        setCommands((data.commands ?? []).slice().reverse())
      } else {
        setMessage(`✗ ${data.error ?? 'Dispatch failed'}`)
      }
    } catch {
      setMessage('✗ Network error — try again.')
    } finally {
      setBusyType(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#080b10] text-white px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-2">GR Scale OS</p>
        <h1 className="text-3xl font-extrabold mb-2">Dispatch to Claude</h1>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Press a button — the order is queued for Claude, who checks in 5 times a day (9am, 12pm, 3pm, 6pm, 9pm)
          and executes it. Results land in your reports, Gmail drafts, and the activity feed. Nothing is ever
          auto-sent to businesses.
        </p>

        {configured === false && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Bridge not activated yet — add a GITHUB_TOKEN environment variable in Vercel (Settings →
            Environment Variables) and redeploy. Buttons will work the moment that&apos;s done.
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
            {message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {COMMANDS.map(cmd => (
            <div key={cmd.type} className="rounded-2xl border border-white/10 bg-[#0d1117] p-5 flex flex-col gap-3">
              <div>
                <p className="text-base font-bold">
                  {cmd.icon} {cmd.title}
                </p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cmd.desc}</p>
              </div>
              {cmd.fields.map(f => (
                <input
                  key={f.key}
                  type="text"
                  placeholder={`${f.label} — ${f.placeholder}`}
                  value={inputs[`${cmd.type}:${f.key}`] ?? ''}
                  onChange={e => setInputs({ ...inputs, [`${cmd.type}:${f.key}`]: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none"
                />
              ))}
              <button
                onClick={() => dispatch(cmd.type, cmd.fields)}
                disabled={busyType === cmd.type}
                className="mt-auto rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
              >
                {busyType === cmd.type ? 'Dispatching…' : 'Send to Claude'}
              </button>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold mt-10 mb-3">Order History</h2>
        <div className="flex flex-col gap-2">
          {commands.length === 0 && (
            <p className="text-sm text-zinc-500">No orders yet. Dispatch one above.</p>
          )}
          {commands.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {c.type}
                  {c.params && Object.keys(c.params).length > 0 && (
                    <span className="text-zinc-400 font-normal">
                      {' '}
                      — {Object.values(c.params).join(', ')}
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {new Date(c.createdAt).toLocaleString()} {c.note ? `· ${c.note}` : ''}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  c.status === 'done'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : c.status === 'failed'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
