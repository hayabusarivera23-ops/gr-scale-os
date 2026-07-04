'use client'

import { useState } from 'react'
import { Plus, Calendar, DollarSign, FolderKanban } from 'lucide-react'
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { PROJECT_STATUSES } from '@/lib/constants'

// Day 1 — no projects yet. Projects are created when a client pays a deposit.
const PROJECTS: {
  id: string; name: string; client: string; status: string; project_value: number;
  deposit_paid: number; final_payment_paid: boolean; deadline?: string;
  notes?: string; deliverables?: string; created_at: string; updated_at: string;
}[] = []

const STATUS_ORDER = PROJECT_STATUSES

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = PROJECTS.filter(p => statusFilter === 'All' || p.status === statusFilter)

  const progressPct = (p: typeof PROJECTS[0]) => {
    const idx = STATUS_ORDER.indexOf(p.status as any)
    return Math.round(((idx + 1) / STATUS_ORDER.length) * 100)
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="text-sm text-zinc-600 mt-0.5">{PROJECTS.length} active project{PROJECTS.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap">
        {['All', ...PROJECT_STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition',
              statusFilter === s ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 border border-zinc-800')}>
            {s}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div className="space-y-3">
        {filtered.map(project => {
          const pct = progressPct(project)
          const remaining = project.project_value - project.deposit_paid
          return (
            <div key={project.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-700 transition">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FolderKanban className="h-4 w-4 text-sky-400" />
                    <h3 className="font-semibold text-zinc-100">{project.name}</h3>
                  </div>
                  <p className="text-sm text-zinc-500">{project.client}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('badge', getStatusColor(project.status))}>{project.status}</span>
                  <span className="text-sm font-bold text-zinc-100">{formatCurrency(project.project_value)}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-zinc-600">Project Progress</span>
                  <span className="text-xs font-medium text-sky-400">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800">
                  <div className="h-1.5 rounded-full bg-sky-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {STATUS_ORDER.map((s, i) => (
                    <span key={s} className={cn('text-[10px] px-1.5 py-0.5 rounded',
                      STATUS_ORDER.indexOf(project.status as any) >= i ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-800 text-zinc-600')}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Deadline</p>
                  <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                    <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                    {formatDate(project.deadline)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Deposit Paid</p>
                  <div className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatCurrency(project.deposit_paid)} ✓
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Final Payment</p>
                  <div className={cn('flex items-center gap-1.5 text-sm font-medium', project.final_payment_paid ? 'text-emerald-400' : 'text-amber-400')}>
                    <DollarSign className="h-3.5 w-3.5" />
                    {project.final_payment_paid ? `${formatCurrency(remaining)} ✓` : `${formatCurrency(remaining)} pending`}
                  </div>
                </div>
              </div>

              {project.deliverables && (
                <div className="rounded-lg bg-zinc-800/40 border border-zinc-800 p-3">
                  <p className="text-xs text-zinc-500 mb-1">Deliverables</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{project.deliverables}</p>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-zinc-800">
            <FolderKanban className="h-8 w-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">No projects yet.</p>
            <p className="text-xs text-zinc-700 mt-1">Close your first client to create a project.</p>
          </div>
        )}
      </div>
    </div>
  )
}
