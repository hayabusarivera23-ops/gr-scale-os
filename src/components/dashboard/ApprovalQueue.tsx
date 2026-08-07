'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Copy, ExternalLink, ShieldCheck, XCircle } from 'lucide-react'
import { LOCAL_APPROVALS_KEY, LocalApproval } from '@/lib/business'

interface QueueCommand {
  id: string
  type: string
  params?: Record<string, string>
  status: 'pending' | 'done' | 'failed'
  note?: string
  createdAt: string
}

const APPROVAL_KEY = 'gr.approvals.v1'

function surfaceFor(command: QueueCommand) {
  if (command.type.includes('content')) return { label: 'Open Content Workspace', href: '/workspace' }
  if (command.type.includes('proposal')) return { label: 'Open Proposals', href: '/proposals' }
  if (command.type.includes('follow')) return { label: 'Open Outreach', href: '/workspace' }
  if (command.type.includes('lead')) return { label: 'Open Gmail Drafts', href: 'https://mail.google.com/mail/u/0/#drafts' }
  return { label: 'Open Work Queue', href: '/queue' }
}

export default function ApprovalQueue() {
  const [commands, setCommands] = useState<QueueCommand[]>([])
  const [localApprovals, setLocalApprovals] = useState<LocalApproval[]>([])
  const [localStatus, setLocalStatus] = useState<Record<string, 'approved' | 'rejected'>>({})
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const load = useCallback(async () => {
    try {
      const [queueRes] = await Promise.all([fetch('/api/queue', { cache: 'no-store' })])
      const queue = (await queueRes.json()) as { ok: boolean; configured?: boolean; commands?: QueueCommand[]; error?: string }
      if (queue.ok) {
        setCommands(queue.commands ?? [])
        setConfigured(Boolean(queue.configured))
      } else {
        const raw = queue.error ?? 'Queue unavailable'
        if (/github read failed|bad credentials|401|403/i.test(raw)) {
          setNotice('Live queue is offline: the GitHub bridge token is missing or expired in Vercel. Local approvals below still work — add or refresh GITHUB_TOKEN to reconnect.')
        } else {
          setError(raw)
        }
      }
      setLocalStatus(JSON.parse(localStorage.getItem(APPROVAL_KEY) || '{}') as Record<string, 'approved' | 'rejected'>)
      setLocalApprovals(JSON.parse(localStorage.getItem(LOCAL_APPROVALS_KEY) || '[]') as LocalApproval[])
    } catch {
      setError('Approval queue could not load.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pending = useMemo(
    () => commands.filter(command => command.status === 'pending' && !localStatus[command.id]).slice(0, 8),
    [commands, localStatus]
  )

  function setDecision(id: string, status: 'approved' | 'rejected') {
    const next = { ...localStatus, [id]: status }
    setLocalStatus(next)
    try { localStorage.setItem(APPROVAL_KEY, JSON.stringify(next)) } catch { /* local only */ }
  }

  function setLocalApprovalStatus(id: string, status: LocalApproval['status']) {
    const next = localApprovals.map(item => item.id === id ? { ...item, status, decidedAt: new Date().toISOString() } : item)
    setLocalApprovals(next)
    try { localStorage.setItem(LOCAL_APPROVALS_KEY, JSON.stringify(next)) } catch { /* local only */ }
  }

  async function copyBody(item: LocalApproval) {
    await navigator.clipboard?.writeText(item.body)
    setCopied(item.id)
    window.setTimeout(() => setCopied(''), 1600)
  }

  const waitingLocal = localApprovals.filter(item => item.status === 'awaiting').slice(0, 8)

  return (
    <section id="approvals" className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Approval Queue</p>
          <h2 className="mt-1 text-lg font-black text-white">Nothing sends, publishes, spends, or changes accounts without Gio.</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-black/20 px-3 py-1 text-xs font-black text-amber-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          {pending.length + waitingLocal.length} awaiting
        </div>
      </div>

      {configured === false && (
        <p className="mb-3 rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-xs leading-relaxed text-zinc-500">
          Live queue writes need the GitHub bridge token. Until then, this approval desk still shows local/saved items and protects the workflow.
        </p>
      )}
      {notice && (
        <p className="mb-3 rounded-lg border border-amber-500/25 bg-black/20 px-3 py-2 text-xs leading-relaxed text-amber-300">
          {notice}
        </p>
      )}
      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <div className="space-y-2">
        {waitingLocal.map(item => (
          <div key={item.id} className="rounded-lg border border-amber-500/20 bg-black/20 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-white">{item.title}</p>
                <p className="mt-1 text-xs font-bold text-amber-300">{item.createdBy} · {item.kind}</p>
                <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-400">
                  {item.body}
                </pre>
              </div>
              <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-bold text-zinc-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setLocalApprovalStatus(item.id, 'approved')} className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-300 hover:bg-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button onClick={() => copyBody(item)} className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-black text-sky-300 hover:bg-sky-500/20">
                <Copy className="h-3.5 w-3.5" /> {copied === item.id ? 'Copied' : 'Copy'}
              </button>
              {item.href && (
                <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-black text-zinc-400 hover:text-white">
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button onClick={() => setLocalApprovalStatus(item.id, 'rejected')} className="inline-flex items-center gap-1 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-300 hover:bg-red-500/20">
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}
        {pending.map(command => {
          const surface = surfaceFor(command)
          return (
            <div key={command.id} className="rounded-lg border border-zinc-800 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">{command.type}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {command.params && Object.keys(command.params).length > 0
                      ? Object.entries(command.params).map(([key, value]) => `${key}: ${value}`).join(' - ')
                      : 'Agent work prepared for review.'}
                  </p>
                  {command.note && <p className="mt-1 text-xs text-zinc-600">{command.note}</p>}
                </div>
                <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] font-bold text-zinc-500">
                  {new Date(command.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={surface.href}
                  target={surface.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  onClick={() => setDecision(command.id, 'approved')}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-300 hover:bg-emerald-500/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve and {surface.label}
                </a>
                <button onClick={() => setDecision(command.id, 'rejected')} className="inline-flex items-center gap-1 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-300 hover:bg-red-500/20">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
                <a href="/queue" className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-black text-zinc-400 hover:text-white">
                  Details <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )
        })}
        {pending.length === 0 && waitingLocal.length === 0 && (
          <p className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-3 text-sm text-zinc-500">
            No approvals waiting. Next action: create drafts or send today&apos;s 10.
          </p>
        )}
      </div>
    </section>
  )
}
